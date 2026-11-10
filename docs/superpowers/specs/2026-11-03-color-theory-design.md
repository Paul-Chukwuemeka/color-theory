# Color theory app — design

**Date:** 2026-11-03
**Status:** approved direction, awaiting sign-off

## Why

The job is: get a good color scheme, quickly, that you trust enough to paste
into a real project. Not a color-theory encyclopedia. A fast generator with
enough theory underneath that the output holds up.

## What it is

A single-page app. Neutral gray chrome on purpose, so the generated palette is
the only color on screen.

- **Left rail:** brand color presets, custom hex, harmony rules, hue dial,
  suggestions.
- **Main:** the five-role palette, contrast checks, preview in context, export.

Two ways in, both ending at the same place:

1. **Color first** — pick a preset or type a hex. The app builds the scheme.
2. **Theory first** — pick a harmony rule and drag the hue. The scheme rebuilds.

## Goals

- From a blank page to a copyable scheme in under a minute.
- Output is code, not just swatches.
- Contrast is visible and failures are flagged.
- You can see the scheme on a real-looking UI before trusting it.

## Non-goals

- No accounts, backend, sync, or sharing in v1.
- Not an exhaustive color theory course.
- No image color extraction or eyedropper.
- No build step, no dependencies, no framework.

## Constraints

- Static HTML, CSS, and JS. Opens from the filesystem or any static server.
- Classic scripts only, no ES modules, so `file://` works without a server.

## Roles

Ten UI roles plus optional extras:

| Role | What it is |
| --- | --- |
| `bg` | Page background. Near-white or near-black, tinted with the base hue. |
| `surface` | Cards and panels. One step off `bg`. |
| `text` | Body text. Tinted near-white or near-black. |
| `accent` | The base color, kept as close to the input as possible. |
| `accent-2` | The harmony's partner hue, never closer than 60° to `accent`. |
| `accent-soft` | A tint of `accent`. Used for fills and hover states. |
| `success` | Fixed semantic green, tuned per theme. Not derived from the base hue. |
| `warning` | Fixed semantic amber, tuned per theme. |
| `danger` | Fixed semantic red, tuned per theme. |
| `on-*` | Black or white label color for each filled role, chosen by measured contrast. |

Any harmony hues beyond the first two (the third in triadic, the third and
fourth in tetradic) are shown as **extra swatches** with their hex codes. They
are copyable but are not UI roles.

## State model

- One root: a base hue, saturation, and lightness (`accent`).
- Typing a hex or picking a preset sets `accent` **exactly** as given. The
  typed value is never re-derived or snapped.
- The hue dial moves the base hue and keeps saturation and lightness.
- A harmony rule plus the base hue produce `accent-2` and the extra swatches.
- `bg`, `surface`, `text`, and `accent-soft` are derived from those.

The hex field reflects `accent` at all times. Choosing a suggestion updates the
base hue, the harmony rule, and the palette together.

## Harmony mapping

| Rule | `accent-2` hue | Extra swatches |
| --- | --- | --- |
| Analogous | base + 60° | base + 30°, base − 30° |
| Complementary | base + 180° | — |
| Split-complementary | base + 150° | base + 210° |
| Triadic | base + 120° | base + 240° |
| Tetradic | base + 90° | base + 180°, base + 270° |
| Monochromatic | base, lighter and less saturated | — |

`accent-2` is never closer than 60° to `accent`, so the two stay
distinguishable as UI states. Monochromatic is the deliberate exception: it
varies lightness within one hue instead of moving the hue.

Extra swatches are for fills and decoration. Their contrast against `bg` is
shown next to each one, and low-contrast extras are marked as fill-only.

## Palette size

A size input in the rail sets how many colors the scheme holds, from 3 to 21.
The count covers the role colors and the extra swatches together.

When the palette is smaller than the nine roles, roles are dropped in a fixed
priority order, so a tiny palette is a sensible palette rather than a random
subset:

| Order | Role | Kept from |
| --- | --- | --- |
| 1 | `bg` | always |
| 2 | `text` | always |
| 3 | `accent` | always |
| 4 | `surface` | size 4+ |
| 5 | `accent-2` | size 5+ |
| 6 | `accent-soft` | size 6+ |
| 7 | `danger` | size 7+ |
| 8 | `success` | size 8+ |
| 9 | `warning` | size 9+ |

`danger` outranks `success` and `warning` because a wrong-answer state is
the one a small palette can least afford to lose.

Above nine, the remaining slots become extra swatches: the harmony's own hues
first, then further hues spaced by the golden angle (137.508°) from the base,
skipping any hue within 10° of one already used. Monochromatic keeps its
extras in the same hue and varies lightness instead.

Roles that are not in the palette are absent, not blank: their swatch is not
drawn, their contrast row is not listed, their `on-*` token is not exported,
and the preview hides the element that used them. An `Auto` button returns to
the harmony's natural size.

## App types

The base color alone produces one scheme shape. An **app type** is the second
axis: it says what kind of product this is, and the scheme is derived to suit
it. Seven types, chosen from chips in the rail above the base color.

A type sets exactly five things:

1. **Neutral recipe** — which hue tints `bg`/`surface`/`text`, and their
   saturation and lightness. A fixed neutral hue means the neutrals ignore the
   base color entirely (Fintech, Developer, Dashboard).
2. **Accent treatment** — a saturation multiplier plus optional floor and
   ceiling, a lightness trim, and for `accent-2` an optional warm hue.
3. **Semantic colors** — `success`, `warning`, `danger` per theme.
4. **Text contrast floor** — the minimum ratio `text` must reach on `bg` and
   `surface`. Kids demands 7:1 (AAA); the rest demand 4.5:1.
5. **Opening state** — the harmony rule and the theme the type starts in.

Picking a type sets the harmony and the theme to that type's defaults. Picking
a harmony chip afterwards overrides the harmony and leaves the type alone.

**General is the default and reproduces today's behavior exactly:** neutrals
tinted with the base hue, the base color kept verbatim as `accent`, the
standard semantics, 4.5:1 text, analogous harmony, light theme. Every other
type may adjust the base color, so with a type other than General the accent
is the base color *shaped by the type*, not the typed hex.

### Recipe values

Values are `[light, dark]` pairs. `neutralSat` is the `bg` saturation;
`surface` uses `neutralSat - 0.02`.

| | General | Dashboard | Education | Kids | Fintech | Health | Developer |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `neutralHue` | base | 220 | 35 | 45 | 215 | 30 | 220 |
| `neutralSat` | 0.24, 0.26 | 0.16, 0.18 | 0.22, 0.20 | 0.28, 0.24 | 0.14, 0.16 | 0.14, 0.12 | 0.16, 0.20 |
| `neutralBgL` | 0.985, 0.075 | 0.975, 0.09 | 0.985, 0.08 | 0.99, 0.10 | 0.98, 0.08 | 0.985, 0.085 | 0.97, 0.085 |
| `neutralSurfaceL` | 0.955, 0.115 | 0.935, 0.14 | 0.955, 0.125 | 0.965, 0.15 | 0.95, 0.12 | 0.955, 0.12 | 0.94, 0.13 |
| `accentSat` | 1 | 0.9 | 1 | 1 | 0.85 | 0.8 | 1 |
| `accentSatMax` | 1 | 0.9 | 1 | 1 | 0.55 | 0.6 | 0.95 |
| `accentSatMin` | 0 | 0 | 0 | 0.68 | 0 | 0 | 0 |
| `accentLight` | 0 | -0.02 | 0.02 | 0.02 | 0.02 | 0.04 | 0 |
| `accent2Sat` | 1 | 0.85 | 1 | 1 | 0.85 | 0.8 | 1 |
| `accent2SatMax` | 1 | 0.85 | 1 | 1 | 0.85 | 0.8 | 1 |
| `accent2SatMin` | 0 | 0 | 0 | 0.6 | 0 | 0 | 0 |
| `accent2Light` | 0 | 0.04 | 0.02 | 0.02 | 0.02 | 0.04 | 0 |
| `accent2Hue` | partner | warm (35°) | partner | partner | partner | partner | partner |
| `accentSoftMix` | 0.16, 0.30 | 0.14, 0.26 | 0.20, 0.32 | 0.24, 0.36 | 0.14, 0.26 | 0.14, 0.26 | 0.16, 0.30 |
| `textRatio` | 4.5 | 4.5 | 4.5 | 7 | 4.5 | 4.5 | 4.5 |
| `harmonyId` | analogous | split-complementary | triadic | analogous | complementary | split-complementary | tetradic |
| `mode` | light | dark | light | light | light | light | dark |

`accent2Hue: warm` sets `accent-2`'s hue to 35° (orange) for a second chart
series that never blurs into the accent. If 35° would land within 60° of the
accent, the harmony's partner hue is used instead, so the 60° separation rule
holds for every type.

### Semantics

| Type | success | warning | danger |
| --- | --- | --- | --- |
| General | `#15803D` / `#4ADE80` | `#B45309` / `#FBBF24` | `#B91C1C` / `#F87171` |
| Dashboard | `#16A34A` / `#4ADE80` | `#D97706` / `#FBBF24` | `#DC2626` / `#F87171` |
| Education | `#16A34A` / `#4ADE80` | `#D97706` / `#FBBF24` | `#DC2626` / `#F87171` |
| Kids | `#22C55E` / `#86EFAC` | `#EA580C` / `#FDBA74` | `#EF4444` / `#FCA5A5` |
| Fintech | `#047857` / `#34D399` | `#B45309` / `#FBBF24` | `#B91C1C` / `#F87171` |
| Health | `#4D7C0F` / `#A3E635` | `#B45309` / `#FDE047` | `#C2410C` / `#FDBA74` |
| Developer | `#15803D` / `#4ADE80` | `#A16207` / `#FACC15` | `#DC2626` / `#F87171` |

Each cell is `light / dark`.

### Invariants every type must keep

- `accent-2` stays at least 60° from `accent`.
- `text` meets the type's floor on both `bg` and `surface`, and never below
  4.5:1.
- The accent keeps the base color's hue. Types change saturation and
  lightness, never which color it is. The rule holds in the maths; an 8-bit
  hex can move a hue by a degree or two at the extremes of lightness, so the
  emitted colour lands within that rounding, not always on the exact number.
- Semantic roles read on `bg`, and each `on-*` label color reads on its fill.

## Light and dark

- The toggle recomputes `bg`, `surface`, and `text` only. Both accents stay
  fixed. `accent-soft` is re-derived from each theme's own background, because
  a light tint on a dark background is unusable.
- `text` is auto-derived to pass WCAG AA against both `bg` and `surface`, so
  the neutral pairs never fail.
- Accent pairs are **not** forced to pass. They are measured and flagged.
- Chrome stays neutral gray in both modes. It does not adopt the palette.

## Contrast checks

Twelve pairs, each with its ratio and an AA / AAA / fail label:

- `text` on `bg`
- `text` on `surface`
- `accent` on `bg` — can it be used as text or an icon?
- label on `accent`
- `accent-2` on `bg`
- label on `accent-2`
- each semantic role on `bg`, and each label on its fill

The `on-*` rows always pick black or white by measured contrast, so label
rows should pass. The `* on bg` rows are honest: a bright accent usually fails
as text, and the tool says so rather than hiding it.

## Suggestions

Three named schemes generated deterministically from the current base hue,
each varying harmony, saturation, and lightness. Each shows a name and a
swatch strip. Adopting one sets the base hue, harmony, and palette. There is
no separate shuffle action.

## Preview

A large app card — nav, heading, body copy, two buttons, tags, and a small
stats panel — painted with every role, so the palette is judged on a
real-looking surface rather than as abstract chips. Button labels and chips
pick black or white by measured contrast, so the preview never shows
unreadable text on an accent.

## Export

- Per-swatch click to copy that hex.
- **Copy all** button.
- An output box you can also select by hand, showing hex by default with a CSS
  custom properties toggle.
- A light + dark switch in the output box that emits both blocks.
- Every role ships with its `on-*` label color, so a consumer never has to
  guess whether text on a fill should be black or white.

Output format: uppercase six-digit hex, one role per line. CSS mode emits
`--color-<role>` properties.

## My calls

- Neutral gray UI chrome, no brand color of its own.
- Hue ring with a draggable handle, plus a hue slider underneath as the
  reliable fallback and keyboard path.
- Custom hex accepts values with or without `#`.
- Suggestions are generated, not curated, so they always match the base.
- Shuffle is cut; suggestions replace it.

## Left to the builder

- Spacing and type scale.
- Exact ring drag mechanics and keyboard step sizes.
- Copy feedback: toast or button label change.
- Whether the output box also shows RGB values — pick one and be consistent.
