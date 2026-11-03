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
  assert.strictEqual(p.extras.length, 1);
});

test('contrast entries are labelled and levelled', () => {
  const p = C.buildPalette({ hex: '#6366F1', harmonyId: 'complementary', mode: 'light' });
  assert.deepStrictEqual(p.contrast.map((c) => c.key), [
    'text-bg', 'text-surface', 'white-accent', 'black-accent',
    'white-accent2', 'black-accent2'
  ]);
  assert.strictEqual(C.contrastLevel(21), 'AAA');
  assert.strictEqual(C.contrastLevel(4.6), 'AA');
  assert.strictEqual(C.contrastLevel(3), 'fail');
});
