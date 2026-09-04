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
 * Undo-stack's flow, as a looping diagram: a session records, edits accumulate,
 * then the workspace is restored and the bars empty back out.
 *
 * This is an ILLUSTRATION, not a screen capture, and is captioned as such in the
 * README. It must not be dressed up to resemble the real VS Code UI.
 *
 * The resting state (no animation) shows filled bars — "changes recorded" —
 * which is a coherent still frame rather than an empty diagram.
 */
export function flow({ theme, title, files }) {
  const t = theme;
  assertRenderable(title, "flow title");
  files.forEach((f) => assertRenderable(f.name, "flow file"));

  const FS2 = 13;
  const TRACK_X = 220;
  const TRACK_W = W - PAD - TRACK_X; // span the full width rather than
  // stopping short and leaving the right third of the card empty
  const rowY = 112;
  const ROW = 26;
  const height = rowY + files.length * ROW + 74;
  const LOOP = 6.0;
  const pct = (s) => ((s / LOOP) * 100).toFixed(2);

  const kf = [];
  const bars = files.map((f, i) => {
    const w = TRACK_W * f.fill;
    const id = `fl${i}`;
    const lead = i * 0.18;
    const hid = `transform:translateX(-${w.toFixed(2)}px)`;
    const shown = "transform:translateX(0)";
    // Phase deliberately starts FILLED (edits recorded), empties on restore,
    // then refills. Starting empty meant frame zero — and every static capture
    // — showed three blank tracks, which reads as broken rather than as "before".
    kf.push(
      `@keyframes ${id}{` +
        `0%,${pct(2.4 + lead)}%{${shown}}` +
        `${pct(3.1 + lead)}%,${pct(3.7 + lead)}%{${hid}}` +
        `${pct(4.4 + lead)}%,100%{${shown}}}`
    );
    return `<clipPath id="${id}c"><rect x="${TRACK_X}" y="${
      rowY + i * ROW - 9
    }" width="${w.toFixed(2)}" height="12" style="animation:${id} ${LOOP}s linear infinite${
      FREEZE ? `;animation-delay:-${FREEZE}s;animation-play-state:paused` : ""
    }"/></clipPath>`;
  });

  const rows = files
    .map((f, i) => {
      const y = rowY + i * ROW;
      const w = TRACK_W * f.fill;
      return `<text x="${PAD}" y="${y}" fill="${t.dim}">${esc(f.name)}</text>
<rect x="${TRACK_X}" y="${y - 9}" width="${TRACK_W}" height="10" rx="5" fill="${
        t.rampRest
      }"/>
<g clip-path="url(#fl${i}c)"><rect x="${TRACK_X}" y="${
        y - 9
      }" width="${w.toFixed(2)}" height="10" rx="5" fill="${
        t.ramp[i % t.ramp.length]
      }"/></g>`;
    })
    .join("\n");

  const label =
    "Undo-stack: a session records edits across files, then restores the workspace to its earlier state.";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${height}" viewBox="0 0 ${W} ${height}" fill="none" role="img" aria-label="${esc(
    label
  )}">
<title>${esc(label)}</title>
<style>${faces()}
text{font-family:${MONO_FALLBACK};font-size:${FS2}px}
.ttl{font-size:13px;fill:${t.dim}}
${kf.join("\n")}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style>
<defs>${bars.join("\n")}</defs>
${chrome(t, title, height)}
<text x="${PAD}" y="76"><tspan fill="${t.prompt}">$</tspan><tspan fill="${
    t.text
  }" xml:space="preserve"> session.start</tspan></text>
<text x="${W - PAD}" y="76" text-anchor="end" fill="${
    t.accent
  }">recording edits</text>
<text x="${PAD}" y="${height - 34}"><tspan fill="${
    t.prompt
  }">$</tspan><tspan fill="${
    t.text
  }" xml:space="preserve"> session.undo</tspan></text>
<text x="${W - PAD}" y="${height - 34}" text-anchor="end" fill="${
    t.keyword
  }">workspace restored</text>
${rows}
</svg>`;
}

/** The window frame every card shares: bar, traffic lights, title, border. */
function chrome(t, title, height) {
  return `<rect width="${W}" height="${height}" rx="12" fill="${t.ground}"/>
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
  }" rx="12" stroke="${t.edge}"/>`;
}

// A 5×6 pixel "A". Drawn as rects rather than glyphs so it needs no font
// coverage, and coloured by column from theme.ramp so the monogram and the
// language bar below it read as the same system.
const MONOGRAM = [
  "01110",
  "10001",
  "10001",
  "11111",
  "10001",
  "10001",
];

/**
 * The neofetch readout: monogram left, key/value rows right.
 *
 * Carries no commit or repository counters on purpose — GitHub renders the
 * contribution graph and repo count on the profile page directly below the
 * README, so those were the same information twice. Everything here is either
 * unavailable from the native profile UI or personal.
 */
export function neofetch({ theme, title, user, rows, languages }) {
  const t = theme;
  assertRenderable(title, "neofetch title");
  assertRenderable(user, "neofetch user");
  rows.forEach(([k, v]) => {
    assertRenderable(k, "neofetch key");
    assertRenderable(v, "neofetch value");
  });
  languages.forEach((l) => assertRenderable(l.name, "neofetch language"));

  const LFS = 13;
  const LCH = LFS * CHAR_RATIO; // 7.8px per glyph — drives all column maths
  const COL = 218; // left edge of the text block
  const VAL = COL + 82; // value column
  const ROW = 23;
  const row0 = 104;
  const barY = row0 + rows.length * ROW + 6;
  const legendY = barY + 32;
  const height = legendY + 30;
  const barW = W - PAD - VAL;

  const barDelay = 0.5 + rows.length * 0.09;
  const total = barDelay + 0.8 + 0.3;
  const pct = (s) => Math.max(0, Math.min(100, (s / total) * 100)).toFixed(3);

  // Same contract as terminal(): one zero-delay timeline per element, reveal
  // encoded as keyframe percentages, resting state = the finished card. Using
  // animation-delay with fill-mode "backwards" instead would leave the card
  // blank in any renderer that applies CSS without advancing animations.
  const kf = [];
  let seq = 0;
  const anim = (at, dur, from, to = "opacity:1;transform:none") => {
    const name = `n${seq++}`;
    kf.push(
      `@keyframes ${name}{0%,${pct(at)}%{${from}}${pct(
        at + dur
      )}%,100%{${to}}}`
    );
    return `animation:${name} ${total.toFixed(2)}s linear forwards${
      FREEZE ? `;animation-delay:-${FREEZE}s;animation-play-state:paused` : ""
    }`;
  };

  const FADE = "opacity:0;transform:translateY(3px)";

  // ── monogram ──
  const CELL = 22;
  const mx = 52;
  const my = 78;
  const cells = [];
  MONOGRAM.forEach((line, r) =>
    [...line].forEach((c, col) => {
      if (c !== "1") return;
      cells.push(
        `<rect x="${mx + col * CELL}" y="${my + r * CELL}" width="${
          CELL - 4
        }" height="${CELL - 4}" rx="3" fill="${
          t.ramp[col % t.ramp.length]
        }" class="px" style="${anim(
          0.15 + (r + col) * 0.035,
          0.3,
          "opacity:0;transform:scale(.4)"
        )}"/>`
      );
    })
  );

  // ── key/value rows ──
  const lines = rows.map(
    ([k, v], i) =>
      `<text y="${row0 + i * ROW}" style="${anim(
        0.5 + i * 0.09,
        0.32,
        FADE
      )}"><tspan x="${COL}" fill="${t.prompt}">${esc(
        k
      )}</tspan><tspan x="${VAL}" fill="${t.text}">${esc(v)}</tspan></text>`
  );

  // ── language bar: revealed by sliding its clip, the same mechanism the
  // header uses for typing, which is known to work inside an <img> ──
  let cx = VAL;
  const segs = languages
    .map((l, i) => {
      const w = (barW * l.share) / 100;
      const s = `<rect x="${cx.toFixed(2)}" y="${barY}" width="${Math.max(
        0,
        w - 2
      ).toFixed(2)}" height="11" rx="5.5" fill="${
        i < t.ramp.length ? t.ramp[i] : t.rampRest
      }"/>`;
      cx += w;
      return s;
    })
    .join("\n");

  // Starts at COL, not VAL: five entries indented to the value column overran
  // the card's right edge and clipped the last one.
  let lx = COL;
  const legend = languages
    .map((l, i) => {
      const text = `${l.name} ${l.share.toFixed(0)}%`;
      const s = `<circle cx="${(lx + 4.5).toFixed(2)}" cy="${
        legendY - 4
      }" r="4" fill="${i < t.ramp.length ? t.ramp[i] : t.rampRest}"/>
<text x="${(lx + 15).toFixed(2)}" y="${legendY}" fill="${t.dim}">${esc(
        text
      )}</text>`;
      lx += 15 + text.length * LCH + 22;
      return s;
    })
    .join("\n");

  const barStyle = anim(
    barDelay,
    0.8,
    `transform:translateX(-${barW.toFixed(2)}px)`,
    "transform:translateX(0)"
  );
  const userStyle = anim(0.1, 0.3, FADE);
  const ruleStyle = anim(0.3, 0.3, "opacity:0", "opacity:1");
  const legendStyle = anim(barDelay + 0.5, 0.3, FADE);

  const label = `${user}. ${rows
    .map(([k, v]) => `${k}: ${v}`)
    .join(". ")}. Languages: ${languages
    .map((l) => `${l.name} ${l.share.toFixed(0)}%`)
    .join(", ")}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${height}" viewBox="0 0 ${W} ${height}" fill="none" role="img" aria-label="${esc(
    label
  )}">
<title>${esc(label)}</title>
<style>${faces()}
/* Class selectors, not font-size attributes: CSS beats a presentation
   attribute, so a size set on the element would be silently overridden. */
text{font-family:${MONO_FALLBACK};font-size:${LFS}px}
.ttl{font-size:13px;fill:${t.dim}}
.usr{font-weight:700;font-size:15px}
/* scale() needs a box to scale about; without this the pixels fly off-origin. */
.px{transform-box:fill-box;transform-origin:center}
${kf.join("\n")}
/* Resting state is the finished card, so dropping animation is a safe no-op. */
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style>
<defs><clipPath id="barclip"><rect x="${VAL}" y="${
    barY - 2
  }" width="${barW.toFixed(2)}" height="16" style="${barStyle}"/></clipPath></defs>
${chrome(t, title, height)}
${cells.join("\n")}
<text class="usr" x="${COL}" y="72" fill="${
    t.accent
  }" style="${userStyle}">${esc(user)}</text>
<line x1="${COL}" y1="84" x2="${
    W - PAD
  }" y2="84" stroke="${t.edge}" style="${ruleStyle}"/>
${lines.join("\n")}
<text x="${COL}" y="${barY + 10}" fill="${
    t.prompt
  }" style="${legendStyle}">Langs</text>
<g clip-path="url(#barclip)">${segs}</g>
<g style="${legendStyle}">${legend}</g>
</svg>`;
}
