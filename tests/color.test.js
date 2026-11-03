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
