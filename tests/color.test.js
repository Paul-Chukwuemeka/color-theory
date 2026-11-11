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

test('relative luminance uses the corrected sRGB threshold', () => {
  // 10.1/255 is 0.0396: the old 0.03928 cutoff sent it down the power curve,
  // the standard 0.04045 cutoff keeps it in the linear segment.
  const channel = (v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const expected = channel(10.1);
  const actual = C.relativeLuminance({ r: 10.1, g: 10.1, b: 10.1 });
  assert.ok(Math.abs(actual - expected) < 1e-9, `expected ${expected}, got ${actual}`);
});

test('ratios are truncated to two decimals for display', () => {
  assert.strictEqual(C.formatRatio(4.496), '4.49');
  assert.strictEqual(C.formatRatio(4.5), '4.50');
  assert.strictEqual(C.formatRatio(21), '21.00');
  assert.strictEqual(C.formatRatio(2.619), '2.61');
});

test('ensureContrast steps a colour until it reads, and leaves it alone when it already does', () => {
  const bg = '#FAFAFC';
  const fixed = C.ensureContrast('#6366F1', bg, 4.5);
  assert.ok(C.contrastRatio(fixed, bg) >= 4.5, `${fixed} still fails`);
  assert.notStrictEqual(fixed, '#6366F1');
  assert.strictEqual(C.ensureContrast('#000000', bg, 4.5), '#000000');
});

test('ensureContrast only moves the colour as far as the floor needs', () => {
  const bg = '#FAFAFC';
  const fixed = C.ensureContrast('#6366F1', bg, 4.5);
  const hsl = C.rgbToHsl(C.hexToRgb(fixed));
  const start = C.rgbToHsl(C.hexToRgb('#6366F1'));
  assert.ok(hsl.l < start.l, 'a light background needs a darker label');
  assert.ok(start.l - hsl.l < 0.2, 'the step should be small, not black');
});

test('a hex is complete only at six digits', () => {
  assert.strictEqual(C.isCompleteHex('#636'), false);
  assert.strictEqual(C.isCompleteHex('#6366F'), false);
  assert.strictEqual(C.isCompleteHex('#6366F1'), true);
  assert.strictEqual(C.isCompleteHex('6366F1'), true);
  assert.strictEqual(C.isCompleteHex(''), false);
  assert.strictEqual(C.isCompleteHex('#GGGGGG'), false);
});
