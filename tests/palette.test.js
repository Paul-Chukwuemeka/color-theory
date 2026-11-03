const test = require('node:test');
const assert = require('node:assert');
const C = require('../color.js');

test('harmony hues wrap into 0-360', () => {
  assert.strictEqual(C.partnerHue(200, 'complementary'), 20);
  assert.strictEqual(C.partnerHue(300, 'triadic'), 60);
  assert.strictEqual(C.partnerHue(0, 'complementary'), 180);
  assert.strictEqual(C.partnerHue(350, 'analogous'), 50);
  assert.strictEqual(C.partnerHue(-30, 'analogous'), 30);
  assert.strictEqual(C.partnerHue(720, 'triadic'), 120);
  assert.strictEqual(C.partnerHue(10, 'monochromatic'), null);
});

test('accent-2 stays at least 60 degrees from accent', () => {
  const harmonies = ['analogous', 'complementary', 'split-complementary', 'triadic', 'tetradic'];
  for (const harmony of harmonies) {
    for (let h = 0; h < 360; h += 15) {
      const p = C.partnerHue(h, harmony);
      const signed = Math.abs(p - h);
      const separation = Math.min(signed, 360 - signed);
      assert.ok(separation >= 60, `${harmony} ${h} -> ${p} (${separation})`);
    }
  }
});

test('extra hues follow the table', () => {
  assert.deepStrictEqual(C.extraHues(300, 'tetradic'), [120, 210]);
  assert.deepStrictEqual(C.extraHues(300, 'triadic'), [180]);
  assert.deepStrictEqual(C.extraHues(10, 'analogous'), [40, 340]);
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

test('semantic roles are readable on bg in both modes', () => {
  for (const mode of ['light', 'dark']) {
    const p = C.buildPalette({ hex: '#1DE533', harmonyId: 'analogous', mode });
    for (const role of ['success', 'warning', 'danger']) {
      assert.ok(C.contrastRatio(p[role], p.bg) >= 4.5, `${mode} ${role}`);
      assert.notStrictEqual(p[role], p.accent);
    }
  }
});

test('fill label colors pass AA on every filled role', () => {
  const p = C.buildPalette({ hex: '#1DE533', harmonyId: 'analogous', mode: 'light' });
  const pairs = [
    ['onAccent', 'accent'],
    ['onAccent2', 'accent2'],
    ['onSuccess', 'success'],
    ['onWarning', 'warning'],
    ['onDanger', 'danger']
  ];
  for (const [on, fill] of pairs) {
    assert.ok(C.contrastRatio(p[on], p[fill]) >= 4.5, `${on} on ${fill}`);
  }
});

test('extreme accents produce a valid palette', () => {
  for (const hex of ['#000000', '#FFFFFF', '#808080']) {
    const p = C.buildPalette({ hex, harmonyId: 'complementary', mode: 'dark' });
    assert.strictEqual(p.accent, hex);
    assert.ok(Number.isFinite(C.contrastRatio(p.text, p.bg)));
    assert.ok(C.contrastRatio(p.text, p.bg) >= 4.5, `${hex} text/bg`);
    assert.ok(C.contrastRatio(p.text, p.surface) >= 4.5, `${hex} text/surface`);
  }
});

test('surface differs from bg and accent-soft is a tint', () => {
  const p = C.buildPalette({ hex: '#6366F1', harmonyId: 'analogous', mode: 'light' });
  assert.notStrictEqual(p.surface, p.bg);
  assert.notStrictEqual(p.accentSoft, p.accent);
  assert.strictEqual(p.extras.length, 2);
});

test('contrast entries cover text, accents and semantics', () => {
  const p = C.buildPalette({ hex: '#6366F1', harmonyId: 'complementary', mode: 'light' });
  assert.deepStrictEqual(p.contrast.map((c) => c.key), [
    'text-bg', 'text-surface',
    'accent-bg', 'on-accent',
    'accent2-bg', 'on-accent2',
    'success-bg', 'on-success',
    'warning-bg', 'on-warning',
    'danger-bg', 'on-danger'
  ]);
  assert.strictEqual(C.contrastLevel(21), 'AAA');
  assert.strictEqual(C.contrastLevel(4.6), 'AA');
  assert.strictEqual(C.contrastLevel(3), 'fail');
});

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
  assert.strictEqual(lines.length, 16);
  assert.ok(lines[0].startsWith('bg'));
  assert.ok(/^bg\s+#[0-9A-F]{6}$/.test(lines[0]));
  assert.ok(lines.some((l) => /^accent-2\s+#[0-9A-F]{6}$/.test(l)));
  assert.ok(lines.some((l) => /^on-accent\s+#[0-9A-F]{6}$/.test(l)));
  assert.ok(lines.some((l) => /^danger\s+#[0-9A-F]{6}$/.test(l)));
});

test('css export emits custom properties', () => {
  const light = C.buildPalette({ hex: '#6366F1', harmonyId: 'analogous', mode: 'light' });
  const dark = C.buildPalette({ hex: '#6366F1', harmonyId: 'analogous', mode: 'dark' });
  const single = C.formatExport({ light, dark }, { format: 'css', themes: 'light' });
  assert.ok(single.startsWith(':root {'));
  assert.ok(single.includes('--color-bg: #'));
  assert.ok(single.includes('--color-on-accent: #'));
  assert.ok(!single.includes('[data-theme="dark"]'));

  const both = C.formatExport({ light, dark }, { format: 'css', themes: 'both' });
  assert.ok(both.includes(':root {'));
  assert.ok(both.includes('[data-theme="dark"] {'));
});

test('dark-only css export uses :root so it works when pasted', () => {
  const light = C.buildPalette({ hex: '#6366F1', harmonyId: 'analogous', mode: 'light' });
  const dark = C.buildPalette({ hex: '#6366F1', harmonyId: 'analogous', mode: 'dark' });
  const out = C.formatExport({ light, dark }, { format: 'css', themes: 'dark' });
  assert.ok(out.startsWith(':root {'));
  assert.ok(!out.includes('[data-theme="dark"]'));
});

test('pickReadable keeps the preferred color only when it reads', () => {
  assert.strictEqual(C.pickReadable('#00FF00', '#FFFFFF'), '#000000');
  assert.strictEqual(C.pickReadable('#0B0D14', '#151628'), '#FFFFFF');
  assert.strictEqual(C.pickReadable('#FAFAFC', '#151628'), '#151628');
  assert.ok(C.contrastRatio(C.pickReadable('#00FF00', '#FFFFFF'), '#00FF00') >= 4.5);
});
