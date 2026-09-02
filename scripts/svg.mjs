import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { CHAR_RATIO } from "./theme.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const fontDir = join(here, "..", "assets", "fonts");

// Fonts are embedded rather than linked: an SVG loaded through an <img> tag is
// sandboxed and cannot fetch external resources, so a linked webfont would
// silently fall back and shift every column.
const b64 = (f) => readFileSync(join(fontDir, f)).toString("base64");
const faces = () => `
@font-face{font-family:JBM;font-style:normal;font-weight:400;src:url(data:font/woff2;base64,${b64(
  "JetBrainsMono-Regular.subset.woff2"
)}) format("woff2")}
@font-face{font-family:JBM;font-style:normal;font-weight:700;src:url(data:font/woff2;base64,${b64(
  "JetBrainsMono-Bold.subset.woff2"
)}) format("woff2")}`;

// Exactly the codepoints the embedded subset covers (see the pyftsubset range
// in README-DEV.md). Anything outside it would silently fall back to a system
// font mid-line, breaking the monospace grid — so fail loudly instead.
const SUBSET =
  /^[ -~©·–—‘’“”…→─│●▊░-▓]*$/;

export function assertRenderable(s, where) {
  if (SUBSET.test(String(s))) return s;
  const bad = [...String(s)]
    .filter((c) => !SUBSET.test(c))
    .map((c) => `${c} (U+${c.codePointAt(0).toString(16).toUpperCase()})`);
  throw new Error(
    `${where}: character(s) outside the embedded font subset: ${bad.join(", ")}`
  );
}

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ─── geometry ────────────────────────────────────────────────────────────────
const W = 840;
const FS = 15;
const CH = FS * CHAR_RATIO; // 9px exactly
const LH = 25;
const PAD = 28;
const BAR = 38; // title bar height
const TOP = 32; // gap between title bar and first baseline

const MONO_FALLBACK =
  "JBM,ui-monospace,SFMono-Regular,Menlo,Consolas,'DejaVu Sans Mono',monospace";

// Set FREEZE=<seconds> to shift every delay negative, parking the whole
// sequence at one instant. Used to screenshot a mid-animation frame; never
// set in CI.
const FREEZE = Number(process.env.FREEZE ?? 0);
const at = (s) => (s - FREEZE).toFixed(2);

/**
 * Build the animated terminal header.
 *
 * `lines` is a list of:
 *   {cmd: "whoami"}                     a typed prompt line
 *   {out: [[text, tokenName], ...]}     an output line, revealed after its command
 *   {gap: true}                         a blank line
 *   {cursor: true}                      the trailing blink
 */
export function terminal({ theme, title, lines }) {
  const t = theme;
  assertRenderable(title, "terminal title");
  lines.forEach((l, i) => {
    if (l.cmd) assertRenderable(l.cmd, `terminal line ${i}`);
    if (l.out)
      l.out.forEach(([text]) => assertRenderable(text, `terminal line ${i}`));
  });

  const height = BAR + TOP + lines.length * LH + 22;

  // ── Why every element shares one zero-delay timeline ──────────────────────
  // The obvious approach — per-element animation-delay plus fill-mode — has a
  // bad failure mode. "backwards" holds the FROM state during the delay, so
  // any renderer that applies CSS but does not advance animations (an <img>
  // in some engines, a thumbnailer, a static rasteriser) shows an empty
  // window. Instead every element rests in its FINAL state and runs one
  // animation of the same total duration, with its reveal encoded as
  // percentages. No animation means no delay to sit inside, so the terminal
  // simply renders complete.
  const plan = [];
  let clock = 0.25; // window settles first
  let typed = 0;

  lines.forEach((line, i) => {
    const y = BAR + TOP + i * LH;
    if (line.gap) return;

    if (line.cursor) {
      plan.push({ kind: "cursor", y, at: clock });
      return;
    }
    if (line.cmd) {
      const full = `$ ${line.cmd}`;
      const dur = Math.max(0.35, full.length * 0.042);
      plan.push({
        kind: "cmd",
        y,
        at: clock,
        dur,
        text: line.cmd,
        chars: full.length,
        w: full.length * CH,
        id: `ty${typed++}`,
      });
      clock += dur + 0.18;
      return;
    }
    plan.push({ kind: "out", y, at: clock, spans: line.out });
    clock += 0.12;
  });

  const FADE = 0.34;
  const total = clock + 0.6; // tail so the last reveal is not clipped
  const pct = (s) => Math.max(0, Math.min(100, (s / total) * 100)).toFixed(3);

  // With FREEZE set, park the whole timeline at one instant for inspection.
  const run = (name) =>
    `animation:${name} ${total.toFixed(2)}s linear forwards${
      FREEZE ? `;animation-delay:-${FREEZE}s;animation-play-state:paused` : ""
    }`;

  const body = [];
  const keyframes = [];
  const clips = [];

  for (const p of plan) {
    if (p.kind === "cmd") {
      const a = pct(p.at);
      const b = pct(p.at + p.dur);
      // The steps() lives on the keyframe that starts the typing segment, so
      // it applies to that segment only rather than the whole timeline.
      keyframes.push(
        `@keyframes ${p.id}k{` +
          `0%{transform:translateX(-${p.w.toFixed(
            2
          )}px);animation-timing-function:steps(${p.chars},end)}` +
          `${a}%{transform:translateX(-${p.w.toFixed(
            2
          )}px);animation-timing-function:steps(${p.chars},end)}` +
          `${b}%,100%{transform:translateX(0)}}`
      );
      clips.push(
        `<clipPath id="${p.id}"><rect x="${PAD}" y="${p.y - FS}" width="${p.w.toFixed(
          2
        )}" height="${FS + 6}" style="${run(`${p.id}k`)}"/></clipPath>`
      );
      body.push(
        `<g clip-path="url(#${p.id})"><text x="${PAD}" y="${p.y}"><tspan fill="${
          t.prompt
        }">$</tspan><tspan fill="${t.text}" xml:space="preserve"> ${esc(
          p.text
        )}</tspan></text></g>`
      );
      continue;
    }

    const name = `rv${keyframes.length}`;
    const a = pct(p.at);
    const b = pct(p.at + FADE);
    keyframes.push(
      `@keyframes ${name}{0%,${a}%{opacity:0;transform:translateY(3px)}` +
        `${b}%,100%{opacity:1;transform:translateY(0)}}`
    );

    if (p.kind === "cursor") {
      // Reveal on the wrapper, blink on the rect: one element cannot do both,
      // and merging them would show the caret before the session starts.
      body.push(
        `<g style="${run(name)}">` +
          `<text x="${PAD}" y="${p.y}" fill="${t.prompt}">$</text>` +
          `<rect class="caret" x="${PAD + CH * 2}" y="${
            p.y - FS + 3
          }" width="${(CH * 0.85).toFixed(2)}" height="${FS + 3}" fill="${
            t.accent
          }"/>` +
          `</g>`
      );
      continue;
    }

    let x = PAD;
    const spans = p.spans
      .map(([text, tok = "text", bold = false]) => {
        const s = `<tspan x="${x.toFixed(2)}" fill="${t[tok] ?? tok}"${
          bold ? ' font-weight="700"' : ""
        } xml:space="preserve">${esc(text)}</tspan>`;
        x += text.length * CH;
        return s;
      })
      .join("");
    body.push(`<text y="${p.y}" style="${run(name)}">${spans}</text>`);
  }

  const label = lines
    .map((l) =>
      l.cmd ? `$ ${l.cmd}` : l.out ? l.out.map(([s]) => s).join("") : ""
    )
    .filter(Boolean)
    .join(". ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${height}" viewBox="0 0 ${W} ${height}" fill="none" role="img" aria-label="${esc(
    label
  )}">
<title>${esc(label)}</title>
<style>${faces()}
text{font-family:${MONO_FALLBACK};font-size:${FS}px;font-weight:400;dominant-baseline:auto}
.ttl{font-size:13px;fill:${t.dim}}
.caret{animation:blink 1.06s steps(1,end) infinite}
@keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}
${keyframes.join("\n")}
/* Resting state is the finished terminal, so dropping every animation is a
   safe no-op rather than a blank window. */
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style>
<defs>${clips.join("")}</defs>
<rect width="${W}" height="${height}" rx="12" fill="${t.ground}"/>
<path d="M0 12a12 12 0 0 1 12-12h${
    W - 24
  }a12 12 0 0 1 12 12v${BAR - 12}H0Z" fill="${t.chrome}"/>
<line x1="0" y1="${BAR}" x2="${W}" y2="${BAR}" stroke="${t.edge}"/>
<circle cx="24" cy="19" r="5.5" fill="${t.prompt}" opacity=".85"/>
<circle cx="43" cy="19" r="5.5" fill="${t.dim}" opacity=".55"/>
<circle cx="62" cy="19" r="5.5" fill="${t.dim}" opacity=".35"/>
<text class="ttl" x="${W / 2}" y="24" text-anchor="middle">${esc(title)}</text>
<rect x=".5" y=".5" width="${W - 1}" height="${
    height - 1
  }" rx="12" stroke="${t.edge}"/>
${body.join("\n")}
</svg>`;
}

/**
 * Build the stats strip — same window chrome, deliberately quieter than the
 * header. Four counters and a stacked language bar.
 */
export function stats({ theme, title, counters, languages }) {
  const t = theme;
  assertRenderable(title, "stats title");
  counters.forEach((c) => {
    assertRenderable(c.value, "stats value");
    assertRenderable(c.label, "stats label");
  });
  languages.forEach((l) => assertRenderable(l.name, "stats language"));

  const LFS = 12.5; // caption/legend size
  const LCH = LFS * CHAR_RATIO; // 7.5px per glyph — drives legend spacing
  const barY = 152;
  const height = 214;
  const inner = W - PAD * 2;

  const cells = counters
    .map((c, i) => {
      const x = PAD + (inner / counters.length) * i;
      return `<text class="num" x="${x}" y="${BAR + 48}" fill="${
        t.accent
      }">${esc(c.value)}</text>
<text x="${x}" y="${BAR + 70}" fill="${t.dim}">${esc(c.label)}</text>`;
    })
    .join("\n");

  // Stacked bar: each language gets width proportional to bytes.
  let cx = PAD;
  const segs = languages
    .map((l, i) => {
      const w = (inner * l.share) / 100;
      const fill = i < t.ramp.length ? t.ramp[i] : t.rampRest;
      const s = `<rect x="${cx.toFixed(2)}" y="${barY}" width="${Math.max(
        0,
        w - 2
      ).toFixed(2)}" height="12" rx="6" fill="${fill}"/>`;
      cx += w;
      return s;
    })
    .join("\n");

  let lx = PAD;
  const legend = languages
    .map((l, i) => {
      const fill = i < t.ramp.length ? t.ramp[i] : t.rampRest;
      const text = `${l.name} ${l.share.toFixed(0)}%`;
      const s = `<circle cx="${(lx + 5).toFixed(2)}" cy="${
        barY + 38
      }" r="4.5" fill="${fill}"/>
<text x="${(lx + 17).toFixed(2)}" y="${barY + 42.5}" fill="${t.dim}">${esc(
        text
      )}</text>`;
      lx += 17 + text.length * LCH + 24;
      return s;
    })
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${height}" viewBox="0 0 ${W} ${height}" fill="none" role="img" aria-label="${esc(
    counters.map((c) => `${c.value} ${c.label}`).join(", ")
  )}">
<title>${esc(counters.map((c) => `${c.value} ${c.label}`).join(", "))}</title>
<style>${faces()}
/* Class selectors, not font-size attributes: CSS beats a presentation
   attribute, so a size set on the element would be silently overridden. */
text{font-family:${MONO_FALLBACK};font-size:${LFS}px}
.num{font-size:26px;font-weight:700}
.ttl{font-size:13px;fill:${t.dim}}
</style>
<rect width="${W}" height="${height}" rx="12" fill="${t.ground}"/>
<path d="M0 12a12 12 0 0 1 12-12h${
    W - 24
  }a12 12 0 0 1 12 12v${BAR - 12}H0Z" fill="${t.chrome}"/>
<line x1="0" y1="${BAR}" x2="${W}" y2="${BAR}" stroke="${t.edge}"/>
<circle cx="24" cy="19" r="5.5" fill="${t.prompt}" opacity=".85"/>
<circle cx="43" cy="19" r="5.5" fill="${t.dim}" opacity=".55"/>
<circle cx="62" cy="19" r="5.5" fill="${t.dim}" opacity=".35"/>
<text class="ttl" x="${W / 2}" y="24" text-anchor="middle">${esc(title)}</text>
<rect x=".5" y=".5" width="${W - 1}" height="${
    height - 1
  }" rx="12" stroke="${t.edge}"/>
${cells}
<text x="${PAD}" y="${barY - 14}" fill="${
    t.dim
  }">public repositories by primary language</text>
${segs}
${legend}
</svg>`;
}
