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
