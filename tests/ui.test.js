const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const C = require('../color.js');

const HTML = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const APP = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const CSS = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

test('the interface says where the base color went', () => {
  // The base color is an input, not a role: it never appears in the palette
  // as itself, so the user needs to be told that the accent carries its hue
  // and where the exact hex went.
  assert.match(HTML, /id="palette-origin"[^>]*class="palette-origin"/);
  assert.match(HTML, /id="base-origin-text"/);
  assert.match(HTML, /id="base-origin-chip"[^>]*aria-hidden="true"/);
  assert.match(APP, /paletteOrigin\.textContent\s*=/);
  assert.match(APP, /baseOriginText\.textContent\s*=/);
  assert.match(APP, /baseOriginChip\.style\.background\s*=/);
});

test('the accent keeps the base hue even when its hex changes', () => {
  // The caption claims the hue is kept, so the claim has to hold: the accent
  // may be walked for contrast, but it must not drift off the base hue.
  for (const type of C.APP_TYPES) {
    for (const mode of ['light', 'dark']) {
      for (const hex of ['#1769E0', '#0BDB0B', '#F59E0B', '#808080']) {
        const p = C.buildPalette({ hex, harmonyId: 'analogous', mode, appType: type.id });
        const baseHue = C.rgbToHsl(C.hexToRgb(hex)).h;
        const accentHue = C.rgbToHsl(C.hexToRgb(p.accent)).h;
        const gap = Math.abs(baseHue - accentHue) % 360;
        const drift = Math.min(gap, 360 - gap);
        assert.ok(drift <= 2, `${type.id} ${mode} ${hex}: accent hue drifted ${drift.toFixed(1)}°`);
      }
    }
  }
});

test('the base caption stays legible', () => {
  const block = CSS.match(/\.palette-origin\s*\{[^}]*\}/) || [];
  assert.ok(block.length > 0, '.palette-origin has no rule');
  const size = block[0].match(/font-size:\s*([\d.]+)px/);
  assert.ok(size && Number(size[1]) >= 11, 'the caption is smaller than 11px');
});
