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
node --test tests/color.test.js tests/palette.test.js
```

## What it does

- Twelve preset brand colors plus a custom hex field.
- Six harmony rules: analogous, complementary, split-complementary, triadic,
  tetradic, monochromatic.
- A draggable hue ring and a hue slider.
- Five UI roles — `bg`, `surface`, `text`, `accent`, `accent-2` — plus
  `accent-soft` and any extra harmony swatches.
- WCAG contrast ratios with AA / AAA / fail labels.
- A live preview of the palette on a full app card, using every role.
- Copy any swatch, copy the whole palette, and export as hex or CSS custom
  properties, for one theme or both.
