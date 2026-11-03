# Color Theory App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static single-page app that turns a base color or a harmony rule into a copyable, contrast-checked five-role UI palette.

**Architecture:** Three layers. `color.js` is pure color math with no DOM, loadable in the browser as `window.ColorMath` and in Node via `module.exports`. `app.js` owns state, rendering, and events against a fixed set of element IDs. `index.html` and `styles.css` provide the neutral chrome. Tests run with Node's built-in runner, no dependencies.

**Tech Stack:** HTML, CSS, vanilla JavaScript, `node --test`.

**Spec:** `docs/superpowers/specs/2026-11-03-color-theory-design.md`

## Global Constraints

- No dependencies, no bundler, no framework. `node --test tests/` is the only tool.
- Classic scripts only. No ES modules, so the page works from `file://`.
- Neutral gray chrome in both themes. The palette is the only color on screen.
- Hex output is uppercase six-digit, `#RRGGBB`, everywhere.
- `accent` is the user's input verbatim. Never re-derive or snap it.
- `text` must pass WCAG AA (4.5:1) against both `bg` and `surface` in both themes.

## Review Focus

- **Invalid hex typed** (`#12`, `zzz`, empty): keep the last valid palette and mark the field invalid. Never blank the app or throw.
- **Hue wrap at 0/360**, negative hues, and hues above 360: `accent-2` and extras must stay in `[0, 360)`.
- **Clipboard unavailable** (`file://`, permission denied): copy must fall back to a temporary textarea and still confirm.
- **Extreme accents** (`#000000`, `#FFFFFF`, pure gray): contrast math must not divide by zero, and `text` still passes.
- **Narrow viewport**: no horizontal overflow at 375px, including rows of extra swatches.

---

## File Structure

| File | Responsibility |
| --- | --- |
| `color.js` | Pure color math: conversions, harmony rules, palette derivation, contrast, suggestions, export text. No DOM. |
| `app.js` | State, DOM rendering, events, clipboard. Consumes `window.ColorMath`. |
| `index.html` | Static shell with the element IDs `app.js` binds to. |
| `styles.css` | Neutral chrome, layout, responsive rules, preview card. |
| `tests/color.test.js` | Conversion, normalization, mixing, contrast tests. |
| `tests/palette.test.js` | Harmony, palette, suggestion, export tests. |
| `README.md` | How to open and how to test. |

---

### Task 1: Color math core

**Files:**
- Create: `color.js`
- Test: `tests/color.test.js`

**Interfaces:**
- Produces:
  - `normalizeHex(input: string): string | null`
  - `hexToRgb(hex: string): {r: number, g: number, b: number}`
  - `rgbToHex(rgb: {r, g, b}): string`
  - `rgbToHsl(rgb: {r, g, b}): {h: number, s: number, l: number}`
  - `hslToRgb(hsl: {h, s, l}): {r: number, g: number, b: number}`
  - `mix(hexA: string, hexB: string, t: number): string`
  - `relativeLuminance(rgb: {r, g, b}): number`
  - `contrastRatio(hexA: string, hexB: string): number`

- [ ] **Step 1: Write the failing tests**

Create `tests/color.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert');
const C = require('../color.js');

test('normalizeHex accepts 3- and 6-digit, with or without hash', () => {
  assert.strictEqual(C.normalizeHex('#abc'), '#AABBCC');
  assert.strictEqual(C.normalizeHex('6366f1'), '#6366F1');
  assert.strictEqual(C.normalizeHex('  #6366F1  '), '#6366F1');
});

test('normalizeHex rejects junk', () => {
  assert.strictEqual(C.normalizeHex('#12'), null);
  assert.strictEqual(C.normalizeHex('zzz'), null);
  assert.strictEqual(C.normalizeHex(''), null);
  assert.strictEqual(C.normalizeHex('#GGGGGG'), null);
});

test('hex and rgb round-trip', () => {
  assert.deepStrictEqual(C.hexToRgb('#6366F1'), { r: 99, g: 102, b: 241 });
  assert.strictEqual(C.rgbToHex({ r: 99, g: 102, b: 241 }), '#6366F1');
});

test('hsl round-trip stays within one unit per channel', () => {
  for (const hex of ['#6366F1', '#FFFFFF', '#000000', '#F97316', '#14B8A6']) {
    const rgb = C.hexToRgb(hex);
    const back = C.hslToRgb(C.rgbToHsl(rgb));
    assert.ok(Math.abs(back.r - rgb.r) <= 1, `${hex} r`);
    assert.ok(Math.abs(back.g - rgb.g) <= 1, `${hex} g`);
    assert.ok(Math.abs(back.b - rgb.b) <= 1, `${hex} b`);
  }
});

test('contrast follows WCAG extremes', () => {
  assert.ok(Math.abs(C.contrastRatio('#000000', '#FFFFFF') - 21) < 0.01);
  assert.ok(Math.abs(C.contrastRatio('#FFFFFF', '#FFFFFF') - 1) < 0.01);
});

test('mix interpolates in sRGB', () => {
  assert.strictEqual(C.mix('#000000', '#FFFFFF', 0), '#000000');
  assert.strictEqual(C.mix('#000000', '#FFFFFF', 1), '#FFFFFF');
  assert.strictEqual(C.mix('#000000', '#FFFFFF', 0.5), '#808080');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/color.test.js`
Expected: FAIL — `Cannot find module '../color.js'`.

- [ ] **Step 3: Implement `color.js`**

Wrap in a UMD-style shell so both environments work:

```js
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ColorMath = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  // ...
  return { normalizeHex, hexToRgb, rgbToHex, rgbToHsl, hslToRgb, mix,
           relativeLuminance, contrastRatio };
});
```

Implementation notes: `normalizeHex` trims, strips one leading `#`, expands 3 digits by doubling, validates `/^[0-9a-f]{6}$/i`, returns uppercase. `rgbToHsl` returns `h` in `[0,360)`, `s` and `l` in `[0,1]`. `contrastRatio` orders luminances before dividing.

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/color.test.js`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add color.js tests/color.test.js
git commit -m "feat: color math core"
```

---

### Task 2: Harmonies and palette derivation

**Files:**
- Modify: `color.js`
- Create: `tests/palette.test.js`

**Interfaces:**
- Consumes: everything from Task 1.
- Produces:
  - `HARMONIES: Array<{id: string, label: string, partner: number|null, extras: number[]}>`
  - `hueName(deg: number): string`
  - `partnerHue(baseHue: number, harmonyId: string): number | null`
  - `extraHues(baseHue: number, harmonyId: string): number[]`
  - `contrastLevel(ratio: number): 'AAA' | 'AA' | 'fail'`
  - `buildPalette({hex: string, harmonyId: string, mode: 'light'|'dark'}): Palette`

`Palette` is:

```js
{
  bg, surface, text, accent, accent2, accentSoft,   // hex strings
  extras: string[],
  contrast: Array<{ key, label, fg, bg, ratio, level }>
}
```

`HARMONIES` must be exactly:

| id | label | partner | extras |
| --- | --- | --- | --- |
| `analogous` | Analogous | 30 | `[60]` |
| `complementary` | Complementary | 180 | `[]` |
| `split-complementary` | Split | 150 | `[210]` |
| `triadic` | Triadic | 120 | `[240]` |
| `tetradic` | Tetradic | 90 | `[180, 270]` |
| `monochromatic` | Mono | `null` | `[]` |

- [ ] **Step 1: Write the failing tests**

Create `tests/palette.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert');
const C = require('../color.js');

test('harmony hues wrap into 0-360', () => {
  assert.strictEqual(C.partnerHue(200, 'complementary'), 20);
  assert.strictEqual(C.partnerHue(300, 'triadic'), 60);
  assert.strictEqual(C.partnerHue(0, 'complementary'), 180);
  assert.strictEqual(C.partnerHue(350, 'analogous'), 20);
  assert.strictEqual(C.partnerHue(-30, 'analogous'), 0);
  assert.strictEqual(C.partnerHue(720, 'triadic'), 120);
  assert.strictEqual(C.partnerHue(10, 'monochromatic'), null);
});

test('extra hues follow the table', () => {
  assert.deepStrictEqual(C.extraHues(300, 'tetradic'), [120, 210]);
  assert.deepStrictEqual(C.extraHues(300, 'triadic'), [180]);
  assert.deepStrictEqual(C.extraHues(10, 'analogous'), [70]);
  assert.deepStrictEqual(C.extraHues(10, 'complementary'), []);
  assert.deepStrictEqual(C.extraHues(10, 'monochromatic'), []);
});

test('accent is the input verbatim', () => {
  const p = C.buildPalette({ hex: '6366f1', harmonyId: 'triadic', mode: 'light' });
  assert.strictEqual(p.accent, '#6366F1');
});

test('text passes AA on bg and surface for every hue in both modes', () => {
  for (const mode of ['light', 'dark']) {
    for (let h = 0; h < 360; h += 30) {
      const hex = C.rgbToHex(C.hslToRgb({ h, s: 0.65, l: 0.55 }));
      const p = C.buildPalette({ hex, harmonyId: 'analogous', mode });
      assert.ok(C.contrastRatio(p.text, p.bg) >= 4.5, `${mode} ${h} text/bg`);
      assert.ok(C.contrastRatio(p.text, p.surface) >= 4.5, `${mode} ${h} text/surface`);
    }
  }
});

test('extreme accents produce a valid palette', () => {
  for (const hex of ['#000000', '#FFFFFF', '#808080']) {
    const p = C.buildPalette({ hex, harmonyId: 'complementary', mode: 'dark' });
    assert.strictEqual(p.accent, hex);
    assert.ok(Number.isFinite(C.contrastRatio(p.text, p.bg)));
  }
});

test('surface differs from bg and accent-soft is a tint', () => {
  const p = C.buildPalette({ hex: '#6366F1', harmonyId: 'analogous', mode: 'light' });
  assert.notStrictEqual(p.surface, p.bg);
  assert.notStrictEqual(p.accentSoft, p.accent);
  assert.deepStrictEqual(p.extras.length, 1);
});

test('contrast entries are labelled and levelled', () => {
  const p = C.buildPalette({ hex: '#6366F1', harmonyId: 'complementary', mode: 'light' });
  assert.deepStrictEqual(p.contrast.map((c) => c.key), [
    'text-bg', 'text-surface', 'white-accent', 'black-accent',
    'white-accent2', 'black-accent2',
  ]);
  assert.strictEqual(C.contrastLevel(21), 'AAA');
  assert.strictEqual(C.contrastLevel(4.6), 'AA');
  assert.strictEqual(C.contrastLevel(3), 'fail');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/palette.test.js`
Expected: FAIL — `C.partnerHue is not a function`.

- [ ] **Step 3: Implement the harmony and palette functions**

Rules to encode:
- `wrapHue(h)` → `((h % 360) + 360) % 360`.
- `accent2`: for non-mono, `hslToRgb({ h: partnerHue, s: accentSat, l: accentLight })`. For mono, `hslToRgb({ h, s: accentSat * 0.55, l: min(accentLight + 0.22, 0.95) })`.
- `extras`: one hex per extra hue at the accent's saturation and lightness.
- Neumtral targets, in HSL:
  - light: `bg` = `(h, 0.24, 0.985)`, `surface` = `(h, 0.22, 0.955)`, text start `(h, 0.30, 0.12)`
  - dark: `bg` = `(h, 0.26, 0.075)`, `surface` = `(h, 0.24, 0.115)`, text start `(h, 0.25, 0.96)`
- `text`: start at the target, step lightness by 0.02 toward 0 (light mode) or 1 (dark mode) until both contrasts pass 4.5, capped at 50 iterations; fall back to `#000000` / `#FFFFFF`.
- `accentSoft`: `mix(bg, accent, mode === 'light' ? 0.16 : 0.30)`.
- Contrast entries use `fg`/`bg` hex pairs and `label` values `Text on background`, `Text on surface`, `White on accent`, `Black on accent`, `White on accent-2`, `Black on accent-2`.
- `hueName` buckets: `['Red','Orange','Amber','Lime','Green','Teal','Cyan','Blue','Indigo','Violet','Magenta','Rose']` at `Math.round(deg / 30) % 12`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/palette.test.js`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add color.js tests/palette.test.js
git commit -m "feat: harmonies and palette derivation"
```

---

### Task 3: Suggestions and export formatting

**Files:**
- Modify: `color.js`
- Modify: `tests/palette.test.js`

**Interfaces:**
- Consumes: Task 2's `buildPalette`, `hueName`.
- Produces:
  - `buildSuggestions({h: number, s: number, l: number}): Array<{id, name, hex, harmonyId}>`
  - `formatExport(palettes: {light: Palette, dark: Palette}, {format: 'hex'|'css', themes: 'light'|'dark'|'both'}): string`

- [ ] **Step 1: Write the failing tests**

Append to `tests/palette.test.js`:

```js
test('suggestions are three deterministic, valid schemes', () => {
  const a = C.buildSuggestions({ h: 240, s: 0.7, l: 0.55 });
  const b = C.buildSuggestions({ h: 240, s: 0.7, l: 0.55 });
  assert.deepStrictEqual(a, b);
  assert.strictEqual(a.length, 3);
  assert.deepStrictEqual(a.map((s) => s.harmonyId), ['analogous', 'triadic', 'split-complementary']);
  for (const s of a) {
    assert.ok(C.normalizeHex(s.hex), `${s.name} hex`);
    assert.ok(s.name.length > 0);
  }
});

test('hex export lists roles one per line', () => {
  const light = C.buildPalette({ hex: '#6366F1', harmonyId: 'analogous', mode: 'light' });
  const dark = C.buildPalette({ hex: '#6366F1', harmonyId: 'analogous', mode: 'dark' });
  const out = C.formatExport({ light, dark }, { format: 'hex', themes: 'light' });
  const lines = out.split('\n');
  assert.strictEqual(lines.length, 7); // 6 roles + 1 extra
  assert.ok(lines[0].startsWith('bg'));
  assert.ok(/^bg\s+#[0-9A-F]{6}$/.test(lines[0]));
  assert.ok(lines.some((l) => /^accent-2\s+#[0-9A-F]{6}$/.test(l)));
});

test('css export emits custom properties', () => {
  const light = C.buildPalette({ hex: '#6366F1', harmonyId: 'analogous', mode: 'light' });
  const dark = C.buildPalette({ hex: '#6366F1', harmonyId: 'analogous', mode: 'dark' });
  const single = C.formatExport({ light, dark }, { format: 'css', themes: 'light' });
  assert.ok(single.startsWith(':root {'));
  assert.ok(single.includes('--color-bg: #'));
  assert.ok(!single.includes('[data-theme="dark"]'));

  const both = C.formatExport({ light, dark }, { format: 'css', themes: 'both' });
  assert.ok(both.includes(':root {'));
  assert.ok(both.includes('[data-theme="dark"] {'));
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/palette.test.js`
Expected: FAIL — `C.buildSuggestions is not a function`.

- [ ] **Step 3: Implement both functions**

- `buildSuggestions({h, s, l})` returns, in order:
  1. `{ id: 'a', name: hueName(h - 10) + ' Analogue', harmonyId: 'analogous', hex: hslToRgb({ h: h - 10, s: clamp(s, 0.45, 0.85), l }) }`
  2. `{ id: 'b', name: hueName(h) + ' Triad', harmonyId: 'triadic', hex: hslToRgb({ h, s: clamp(s, 0.5, 0.9), l: clamp(l + 0.05, 0.25, 0.7) }) }`
  3. `{ id: 'c', name: hueName(h + 15) + ' Split', harmonyId: 'split-complementary', hex: hslToRgb({ h: h + 15, s: clamp(s, 0.4, 0.8), l: clamp(l - 0.05, 0.25, 0.7) }) }`
- Role lines in order: `bg`, `surface`, `text`, `accent`, `accent-2`, `accent-soft`, then `extra-1`… for extras.
- Hex format: `` `${name.padEnd(12)} ${hex}` `` per line, no trailing newline.
- CSS format: 2-space indent, `` `  --color-${name}: ${hex};` ``, blank line between blocks.
- `themes: 'both'` prefixes hex blocks with `/* light */` and `/* dark */`.
- Single-theme CSS always uses `:root`. Both-theme CSS uses `:root` then `[data-theme="dark"]`.

- [ ] **Step 4: Run the full suite**

Run: `node --test tests/`
Expected: PASS, 16 tests.

- [ ] **Step 5: Commit**

```bash
git add color.js tests/palette.test.js
git commit -m "feat: suggestions and export formatting"
```

---

### Task 4: Page shell, layout, neutral chrome

**Files:**
- Create: `index.html`
- Create: `styles.css`
- Create: `README.md`

**Interfaces:**
- Produces the element IDs every later task binds to: `hex-input`, `preset-grid`, `harmony-list`, `hue-ring`, `hue-handle`, `hue-slider`, `hue-value`, `swatch-row`, `extras-row`, `contrast-list`, `preview-card`, `suggestions`, `export-format`, `export-themes`, `export-output`, `copy-all`, `theme-light`, `theme-dark`, `toast`, `hex-error`.

- [ ] **Step 1: Write the shell**

`index.html` loads `styles.css`, then `color.js`, then `app.js` with `defer`. Structure:

- Header: title `Color Theory`, a short subtitle, and a light/dark segmented control.
- `aside` rail: hex field with `#hex-input` and `#hex-error`, `#preset-grid`, `#harmony-list`, `#hue-ring` containing `#hue-handle`, `#hue-slider`, `#hue-value`, `#suggestions`.
- `main`: toolbar with `#copy-all`, `#swatch-row`, `#extras-row`, `#contrast-list`, `#preview-card`, and the export panel with `#export-format`, `#export-themes`, `#export-output`.
- `#toast` with `aria-live="polite"` outside the layout flow.

Every interactive control needs an accessible label. The output box is a `<pre>` with `tabindex="0"` so it can be selected by keyboard.

- [ ] **Step 2: Write the styles**

Neutral gray palette for chrome (`#f4f4f5`, `#ffffff`, `#e4e4e7`, `#18181b`). Two-column grid: 300px rail plus flexible main, collapsing to one column under 900px. Swatches are equal-width tiles with the role name and hex underneath. Rounded 10px cards, 1px borders. No color anywhere except swatches, the preview, and the accent.

- [ ] **Step 3: Write `README.md`**

How to open (`index.html` directly, or `python3 -m http.server`), and `node --test tests/`.

- [ ] **Step 4: Verify in the browser**

Open `index.html` in the in-app browser. Expected: no console errors, two-column layout at 1200px, single column at 375px, no horizontal scrollbar.

- [ ] **Step 5: Commit**

```bash
git add index.html styles.css README.md
git commit -m "feat: page shell and neutral chrome"
```

---

### Task 5: State, presets, hex input, harmony, hue slider

**Files:**
- Create: `app.js`
- Modify: `index.html` (only if a required ID is missing)

**Interfaces:**
- Consumes: `window.ColorMath` from Tasks 1–3.
- Produces: `state`, `render()`, and `setHex(hex)`, `setHarmony(id)`, `setHue(deg)`, `setTheme(mode)` for Task 6 to extend.

State:

```js
const state = {
  hex: '#6366F1',
  harmonyId: 'analogous',
  mode: 'light',        // 'light' | 'dark'
  exportFormat: 'hex',  // 'hex' | 'css'
  exportThemes: 'light' // 'light' | 'dark' | 'both'
};
```

Presets, in order: Indigo `#6366F1`, Blue `#2563EB`, Sky `#0EA5E9`, Teal `#14B8A6`, Green `#22C55E`, Lime `#84CC16`, Amber `#F59E0B`, Orange `#F97316`, Red `#EF4444`, Rose `#F43F5E`, Violet `#8B5CF6`, Slate `#64748B`.

- [ ] **Step 1: Implement state and rendering**

`derive()` computes `{ h, s, l }` from `state.hex` and calls `buildPalette` for both modes, caching both in `palettes`. `render()` repaints the swatch row, extras, hue handle position, hue value, preset selection, and harmony selection. Swatch tiles show role label, hex, and copy on click (wired in Task 7).

- [ ] **Step 2: Wire the inputs**

- `#hex-input` on `input`: `normalizeHex`; if valid, `setHex` and clear `#hex-error`; if not, add an `is-invalid` class and leave the palette untouched.
- `#preset-grid` buttons call `setHex(preset)` and sync the input value.
- `#harmony-list` buttons call `setHarmony(id)`.
- `#hue-slider` (`input` event) and `#hue-value` text call `setHue(deg)`, which converts the current hex to HSL, replaces the hue, and writes the new hex.

- [ ] **Step 3: Verify behaviour in the browser**

Use the in-app browser and `evaluate`:
- Click the Orange preset → `#hex-input` value is `#F97316` and the accent swatch matches.
- Type `#12` → `#hex-error` is visible, the palette is unchanged.
- Click Triadic → the `accent-2` swatch hex changes.
- Drag the hue slider to 120 → the hex input hue changes and no error appears.

- [ ] **Step 4: Commit**

```bash
git add app.js index.html
git commit -m "feat: state and core controls"
```

---

### Task 6: Hue ring, suggestions, contrast panel, preview

**Files:**
- Modify: `app.js`
- Modify: `styles.css`
- Modify: `index.html` (only if a required ID is missing)

**Interfaces:**
- Consumes: `state`, `render()`, `setHue`, `setHex`, `setHarmony`.
- Produces: `renderContrast(palette)`, `renderPreview(palette)`, `renderSuggestions()`.

- [ ] **Step 1: Implement the ring**

`#hue-ring` is a 150px circle with a conic-gradient background and a 90px neutral center. Pointer down on the ring captures the pointer, computes `deg = atan2(dy, dx) * 180 / Math.PI + 90`, and calls `setHue`. Pointer move updates while captured. `#hue-handle` is positioned with `transform: rotate(deg) translateY(-62px)`. Arrow keys on the focused ring step 1°, with Shift 10°.

- [ ] **Step 2: Implement the contrast panel**

Render one row per entry in `palette.contrast`: label, `fg`/`bg` chip, ratio to two decimals with `:1`, and a pill labelled `AAA`, `AA`, or `Fail`. `Fail` adds an `is-fail` class.

- [ ] **Step 3: Implement the preview**

Set CSS custom properties on `#preview-card` for bg, surface, text, accent, and accent-soft. The card renders a nav row, heading, body line, and a button painted from those variables.

- [ ] **Step 4: Implement suggestions**

Render `buildSuggestions` output relative to the current hue. Each card shows the name and a four-swatch strip. Clicking calls `setHex(hex)` and `setHarmony(harmonyId)` in that order, then `render()`.

- [ ] **Step 5: Verify in the browser**

- Drag the ring a quarter turn → hex input updates and the handle moves.
- Focus the ring and press ArrowRight → hue increases by 1.
- Click a suggestion → hex, harmony, and palette all change together.
- Confirm the `Fail` pill appears for at least one pair with a low-contrast accent such as `#FFEE00`.

- [ ] **Step 6: Commit**

```bash
git add app.js index.html styles.css
git commit -m "feat: hue ring, suggestions, contrast, preview"
```

---

### Task 7: Export, copy, accessibility, responsive polish

**Files:**
- Modify: `app.js`
- Modify: `styles.css`
- Modify: `index.html` (only if a required ID is missing)

**Interfaces:**
- Consumes: `state`, `palettes`, `formatExport`.
- Produces: `copyText(text, confirmation)`.

- [ ] **Step 1: Implement export rendering**

`#export-output` text comes from `formatExport(palettes, { format: state.exportFormat, themes: state.exportThemes })`. `#export-format` and `#export-themes` are segmented controls that update state and re-render.

- [ ] **Step 2: Implement copy**

`copyText` tries `navigator.clipboard.writeText`, and on rejection or absence falls back to a temporary `<textarea>`, `document.execCommand('copy')`, then removes it. On success, set `#toast` text to `Copied ${value}` and clear it after 1600ms. Wire `#copy-all` and every swatch tile.

- [ ] **Step 3: Accessibility and responsive pass**

- Every button has an accessible name; icon-only buttons get `aria-label`.
- Focus outlines are visible on all controls.
- Under 900px the rail stacks above the main column.
- At 375px, swatch rows wrap and nothing overflows horizontally.
- `prefers-reduced-motion` disables the toast transition.

- [ ] **Step 4: Full verification**

Run `node --test tests/` — expect PASS.
In the browser at 1200px and 375px:
- No console errors.
- Copy all puts the expected text on the clipboard (check via `evaluate` on the output box).
- Light/dark toggle changes `bg` and `text` but not `accent`.
- Export switches between hex and CSS, and between one and both themes.

- [ ] **Step 5: Commit**

```bash
git add app.js index.html styles.css
git commit -m "feat: export, copy, accessibility, responsive polish"
```

---

## Self-Review

**Spec coverage:** palettes (Tasks 2–3), presets and hex (5), hues and harmonies (2, 5, 6), light/dark (2, 7), contrast (2, 6), suggestions (3, 6), preview (6), export (3, 7), accessibility (7). All covered.

**Type consistency:** `buildPalette` returns `accent2` and `accentSoft`; export names them `accent-2` and `accent-soft` at the string boundary only. `formatExport` takes the `{light, dark}` pair everywhere it is used, including in Task 7.

**Review Focus tests:** hue wrap in Task 2, extreme accents in Task 2, invalid hex in Task 5 (browser step), clipboard fallback in Task 7, narrow viewport in Tasks 4 and 7.
