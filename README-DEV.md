# How this profile is built

`README.md` is the GitHub profile page. The two cards in it are SVGs generated
in this repo — not fetched from a third-party service.

## Why generated, not fetched

The previous README used `github-readme-stats` and `github-profile-trophy`.
At the time of the rewrite those were returning **503** and **402**, so the
profile showed broken images. Everything here is rendered locally and committed,
so the only thing that can break it is this repo.

## Running it

```bash
node scripts/render.mjs                 # fallback numbers, correct layout
GITHUB_TOKEN=$(gh auth token) node scripts/render.mjs   # live numbers
```

Writes `assets/{terminal,neofetch,undostack}-{dark,light}.svg`.

- `scripts/theme.mjs` — the "Midnight Ink" tokens, both themes in one place.
- `scripts/svg.mjs` — three builders sharing one `chrome()` window frame:
  - `terminal()` — the animated header
  - `neofetch()` — the key/value card, monogram and language bar
  - `flow()` — the looping Undo-stack diagram
- `scripts/render.mjs` — the GitHub GraphQL query, the Marketplace version
  lookup, and the copy for the header and card rows.

The card carries no commit or repository counters on purpose: GitHub renders
the contribution graph and repo count on the profile page directly below the
README, so those were the same information twice.

### Inspecting the animation

```bash
FREEZE=1.15 node scripts/render.mjs     # parks the sequence at t=1.15s
```

Then open the SVG. `FREEZE` shifts every `animation-delay` negative so a
screenshot catches a specific frame. Never set it in CI.

## The font

Text is laid out on a fixed grid: JetBrains Mono is 1000 upem with a 600
advance, so every glyph is exactly `0.6 × font-size` wide. All the positioning
maths depends on that.

The subset is embedded as base64 inside each SVG because an SVG loaded through
an `<img>` tag cannot fetch external resources — a linked webfont would silently
fall back and shift every column.

`assertRenderable()` in `scripts/svg.mjs` throws if any string contains a
character outside the subset, which is how the em dash and ellipsis bugs were
caught. To add characters, re-subset **and** widen the `SUBSET` regex:

```bash
pyftsubset JetBrainsMono-Regular.ttf \
  --unicodes="U+0020-007E,U+00A9,U+00B7,U+2013,U+2014,U+2018,U+2019,U+201C,U+201D,U+2026,U+2192,U+2500,U+2502,U+25CF,U+258A,U+2591-2593" \
  --flavor=woff2 --layout-features='' --no-hinting --desubroutinize \
  --output-file=assets/fonts/JetBrainsMono-Regular.subset.woff2
```

JetBrains Mono is OFL-1.1; the licence ships in `assets/fonts/OFL.txt`.

## The workflow

`.github/workflows/refresh.yml` runs daily and commits the SVGs only when they
change.

No secret is required. `restrictedContributionsCount` — the private-repo
commits, which are most of them — reads correctly under the default
`GITHUB_TOKEN`, because *Settings → Profile → Include private contributions on
my profile* is enabled, which makes that number public. The first scheduled run
reported 84 commits against 28 public ones, so the private work is counted.

If that profile setting is ever turned off, the counter silently drops to
public commits only. The `PROFILE_TOKEN` override in the workflow (a classic
PAT with `read:user`) exists for that case and is otherwise unused.

## Notes for editing `README.md`

- Card `<img>` paths are absolute `raw.githubusercontent.com/.../main/...`
  URLs. Relative paths work in `<img src>` but are not reliably rewritten
  inside `<source srcset>`, which `<picture>` needs. If the default branch is
  ever renamed, update these.
- GitHub strips `<script>`, `<style>` and `style=` from Markdown, but allows
  `<details>`, `<summary>`, `<picture>`, `<source>`, `<img>`, `<a>` and
  `<table>`. CSS inside a standalone `.svg` file is untouched — that is why the
  header can animate.
- SVGs served from `raw.githubusercontent.com` are **not** camo-proxied, so
  they animate. GitHub does cache them; a refreshed card can take a while to
  appear.
