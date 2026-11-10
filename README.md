# Color Theory

A small, static tool for turning one color — or one harmony rule — into a
copyable, contrast-checked UI palette.

## Open it

```bash
# Option 1: open the file directly
xdg-open index.html

# Option 2: serve it
python3 -m http.server 8000
# then visit http://localhost:8000
```

No install, no build step, no dependencies.

## Test

```bash
node --test tests/color.test.js tests/palette.test.js tests/app-types.test.js
```

## What it does

- Twelve preset brand colors plus a custom hex field.
- Seven app types: general, dashboard, education, kids, fintech, health,
  developer. A type shapes the neutrals, the accents, the semantic colors, the
  text contrast floor, and the harmony and theme the scheme opens in.
- Six harmony rules: analogous, complementary, split-complementary, triadic,
  tetradic, monochromatic.
- A draggable hue ring and a hue slider.
- Nine color roles — `bg`, `surface`, `text`, `accent`, `accent-2`,
  `accent-soft`, `success`, `warning`, `danger` — plus harmony extras and a
  matching `on-*` label color for every fill.
- `accent-2` is always at least 60° from `accent`, so the two stay distinct.
- WCAG contrast ratios with AA / AAA / fail labels, including whether each
  accent can be used as text on the background.
- A palette size control: pick anywhere from 3 to 21 colors. Small palettes
  drop roles in priority order, larger ones add extra swatches.
- A live preview of the palette on a full app card, using every role.
- Copy any swatch, copy the whole palette, and export as hex or CSS custom
  properties, for one theme or both.
