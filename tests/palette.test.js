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
  assert.deepStrictEqual(C.extraHues(10, 'analogous'), [100, 130]);
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
    // The accent keeps the base's hue but walks its lightness until the fill
    // can be seen at the 3:1 non-text floor.
    assert.ok(C.contrastRatio(p.accent, p.surface) >= 3, `${hex} accent/surface`);
    assert.ok(Number.isFinite(C.contrastRatio(p.text, p.bg)));
    assert.ok(C.contrastRatio(p.text, p.bg) >= 4.5, `${hex} text/bg`);
    assert.ok(C.contrastRatio(p.text, p.surface) >= 4.5, `${hex} text/surface`);
  }
});

test('every fill stays visible against the surface at extreme bases', () => {
  // A fill painted in the accent, accent-2 or an extra must not vanish into
  // the card it sits on. Before the 3:1 walk, a near-white base produced a
  // near-white accent and every button, chart series and chip disappeared.
  for (const hex of ['#FFFFFF', '#FAFAFA', '#FEF9C3', '#808080', '#0B0D14', '#000000']) {
    for (const mode of ['light', 'dark']) {
      for (const harmonyId of ['analogous', 'monochromatic', 'complementary']) {
        const p = C.buildPalette({ hex, harmonyId, mode, appType: 'general', size: 15 });
        for (const key of ['accent', 'accent2']) {
          assert.ok(
            C.contrastRatio(p[key], p.surface) >= 2.95,
            `${hex} ${mode} ${harmonyId}: ${key} is invisible on the surface`
          );
        }
        for (const extra of p.extras) {
          assert.ok(
            C.contrastRatio(extra, p.surface) >= 2.95,
            `${hex} ${mode} ${harmonyId}: extra ${extra} is invisible on the surface`
          );
        }
      }
    }
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
    'text-bg', 'text-surface', 'text-muted-bg',
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
  assert.strictEqual(lines.length, 19);
  assert.ok(lines[0].startsWith('bg'));
  assert.ok(/^bg\s+#[0-9A-F]{6}$/.test(lines[0]));
  assert.ok(lines.some((l) => /^text-muted\s+#[0-9A-F]{6}$/.test(l)));
  assert.ok(lines.some((l) => /^accent-2\s+#[0-9A-F]{6}$/.test(l)));
  assert.ok(lines.some((l) => /^accent-2-text\s+#[0-9A-F]{6}$/.test(l)));
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

test('both-theme css export has three blocks, including an OS preference fallback', () => {
  const light = C.buildPalette({ hex: '#6366F1', harmonyId: 'analogous', mode: 'light' });
  const dark = C.buildPalette({ hex: '#6366F1', harmonyId: 'analogous', mode: 'dark' });
  const out = C.formatExport({ light, dark }, { format: 'css', themes: 'both' });
  assert.ok(out.includes(':root {'));
  assert.ok(out.includes('[data-theme="dark"] {'));
  assert.ok(out.includes('@media (prefers-color-scheme: dark)'));
  // The OS dark block must not beat an explicit light choice.
  assert.ok(out.includes(':root:not([data-theme="light"])'));
  // Each theme keeps its own background.
  assert.ok(out.includes(light.bg));
  assert.ok(out.includes(dark.bg));
});

test('tailwind v4 export emits an @theme block with the palette tokens', () => {
  const light = C.buildPalette({ hex: '#6366F1', harmonyId: 'analogous', mode: 'light' });
  const dark = C.buildPalette({ hex: '#6366F1', harmonyId: 'analogous', mode: 'dark' });
  const out = C.formatExport({ light, dark }, { format: 'tailwind', themes: 'light' });
  assert.ok(out.startsWith('@theme {'));
  assert.ok(out.includes('--color-bg: ' + light.bg + ';'));
  assert.ok(out.includes('--color-accent-text: ' + light.accentText + ';'));
  assert.ok(out.includes('--color-on-accent: ' + light.onAccent + ';'));

  const both = C.formatExport({ light, dark }, { format: 'tailwind', themes: 'both' });
  assert.ok(both.includes('@theme {'));
  assert.ok(both.includes('[data-theme="dark"] {'));
  assert.ok(both.includes(dark.bg));
});

test('json export is valid and follows the theme selection', () => {
  const light = C.buildPalette({ hex: '#6366F1', harmonyId: 'analogous', mode: 'light' });
  const dark = C.buildPalette({ hex: '#6366F1', harmonyId: 'analogous', mode: 'dark' });

  const single = JSON.parse(C.formatExport({ light, dark }, { format: 'json', themes: 'light' }));
  assert.strictEqual(single.bg, light.bg);
  assert.strictEqual(single['on-accent'], light.onAccent);
  assert.strictEqual(single['accent-text'], light.accentText);

  const both = JSON.parse(C.formatExport({ light, dark }, { format: 'json', themes: 'both' }));
  assert.strictEqual(both.light.bg, light.bg);
  assert.strictEqual(both.dark.bg, dark.bg);
  assert.strictEqual(both.light.text, light.text);
});

test('pickReadable keeps the preferred color only when it reads', () => {
  assert.strictEqual(C.pickReadable('#00FF00', '#FFFFFF'), '#000000');
  assert.strictEqual(C.pickReadable('#0B0D14', '#151628'), '#FFFFFF');
  assert.strictEqual(C.pickReadable('#FAFAFC', '#151628'), '#151628');
  assert.ok(C.contrastRatio(C.pickReadable('#00FF00', '#FFFFFF'), '#00FF00') >= 4.5);
});

function hueDistance(a, b) {
  const diff = Math.abs(a - b) % 360;
  return Math.min(diff, 360 - diff);
}

function sizeKeys(n) {
  return C.buildPalette({ hex: '#6366F1', harmonyId: 'analogous', mode: 'light', size: n })
    .roles.map((r) => r.key);
}

test('palette size is clamped to a workable range', () => {
  const count = (n) => {
    const p = C.buildPalette({ hex: '#6366F1', harmonyId: 'analogous', mode: 'light', size: n });
    return p.roles.length + p.extras.length;
  };
  assert.strictEqual(count(1), 3);
  assert.strictEqual(count(0), 3);
  assert.strictEqual(count(99), 21);
  assert.strictEqual(count(3.6), 4);
});

test('a tiny palette keeps only bg, text and accent', () => {
  const p = C.buildPalette({ hex: '#6366F1', harmonyId: 'analogous', mode: 'light', size: 3 });
  assert.deepStrictEqual(p.roles.map((r) => r.key), ['bg', 'text', 'accent']);
  assert.strictEqual(p.surface, null);
  assert.strictEqual(p.accent2, null);
  assert.strictEqual(p.accentSoft, null);
  assert.strictEqual(p.success, null);
  assert.strictEqual(p.warning, null);
  assert.strictEqual(p.danger, null);
  assert.strictEqual(p.onAccent2, null);
  assert.deepStrictEqual(p.extras, []);
});

test('roles are dropped in priority order as the palette shrinks', () => {
  assert.deepStrictEqual(sizeKeys(5), ['bg', 'surface', 'text', 'accent', 'accent-2']);
  assert.deepStrictEqual(sizeKeys(6), ['bg', 'surface', 'text', 'accent', 'accent-2', 'accent-soft']);
  assert.deepStrictEqual(sizeKeys(7), ['bg', 'surface', 'text', 'accent', 'accent-2', 'accent-soft', 'danger']);
  assert.deepStrictEqual(sizeKeys(8), ['bg', 'surface', 'text', 'accent', 'accent-2', 'accent-soft', 'success', 'danger']);
  assert.deepStrictEqual(sizeKeys(9), ['bg', 'surface', 'text', 'accent', 'accent-2', 'accent-soft', 'success', 'warning', 'danger']);
});

test('extra swatches fill the slots above the ten roles', () => {
  const p = C.buildPalette({ hex: '#6366F1', harmonyId: 'analogous', mode: 'light', size: 14 });
  const base = C.rgbToHsl(C.hexToRgb('#6366F1')).h;
  const hueOf = (hex) => C.rgbToHsl(C.hexToRgb(hex)).h;
  assert.strictEqual(p.extras.length, 4);
  assert.ok(Math.abs(hueDistance(hueOf(p.extras[0]), base) - 90) < 1);
  assert.ok(Math.abs(hueDistance(hueOf(p.extras[1]), base) - 120) < 1);
  assert.ok(Math.abs(hueDistance(hueOf(p.extras[2]), base) - 137.508) < 1);
  assert.ok(Math.abs(hueDistance(hueOf(p.extras[3]), base) - 84.984) < 1);
});

test('a harmony with no extras still fills up to the chosen size', () => {
  const p = C.buildPalette({ hex: '#6366F1', harmonyId: 'complementary', mode: 'light', size: 14 });
  const base = C.rgbToHsl(C.hexToRgb('#6366F1')).h;
  assert.strictEqual(p.extras.length, 4);
  assert.ok(p.extras.every((hex) => hueDistance(C.rgbToHsl(C.hexToRgb(hex)).h, base) > 20));
});

test('monochromatic extras stay in the same hue', () => {
  const p = C.buildPalette({ hex: '#6366F1', harmonyId: 'monochromatic', mode: 'light', size: 14 });
  const base = C.rgbToHsl(C.hexToRgb('#6366F1')).h;
  assert.strictEqual(p.extras.length, 4);
  assert.ok(p.extras.every((hex) => hueDistance(C.rgbToHsl(C.hexToRgb(hex)).h, base) < 6));
  assert.ok(p.extras.every((hex) => hex !== p.accent));
});

test('export follows the palette size', () => {
  const light = C.buildPalette({ hex: '#6366F1', harmonyId: 'analogous', mode: 'light', size: 5 });
  const dark = C.buildPalette({ hex: '#6366F1', harmonyId: 'analogous', mode: 'dark', size: 5 });
  const out = C.formatExport({ light, dark }, { format: 'hex', themes: 'light' });
  const keys = out.split('\n').map((line) => line.trim().split(/\s+/)[0]);
  assert.deepStrictEqual(keys, [
    'bg', 'surface', 'text', 'accent', 'accent-2',
    'on-accent', 'on-accent-2', 'accent-text', 'accent-2-text'
  ]);
});

test('contrast rows only cover the roles that exist', () => {
  const p = C.buildPalette({ hex: '#6366F1', harmonyId: 'analogous', mode: 'light', size: 5 });
  const keys = p.contrast.map((c) => c.key);
  assert.ok(keys.includes('text-bg'));
  assert.ok(keys.includes('accent-bg'));
  assert.ok(keys.includes('on-accent'));
  assert.ok(keys.includes('accent2-bg'));
  assert.ok(keys.includes('on-accent2'));
  assert.ok(!keys.some((k) => k.startsWith('success')));
  assert.ok(!keys.some((k) => k.startsWith('warning')));
  assert.ok(!keys.some((k) => k.startsWith('danger')));
});

test('the default palette is unchanged when no size is given', () => {
  const p = C.buildPalette({ hex: '#6366F1', harmonyId: 'analogous', mode: 'light' });
  assert.strictEqual(p.roles.length, 10);
  assert.strictEqual(p.extras.length, 2);
});

test('accent and accent-2 get text-safe twins, and the fills stay exact', () => {
  for (const mode of ['light', 'dark']) {
    const p = C.buildPalette({ hex: '#6366F1', harmonyId: 'analogous', mode });
    assert.strictEqual(p.accent, '#6366F1');
    assert.ok(C.contrastRatio(p.accentText, p.bg) >= 4.5, `${mode} accent text`);
    assert.ok(C.contrastRatio(p.accent2Text, p.bg) >= 4.5, `${mode} accent-2 text`);
    const row = p.contrast.find((c) => c.key === 'accent-bg');
    assert.strictEqual(row.fg, p.accentText, `${mode} row uses the text-safe accent`);
    const row2 = p.contrast.find((c) => c.key === 'accent2-bg');
    assert.strictEqual(row2.fg, p.accent2Text);
  }
});

test('muted text steps toward the background but keeps the floor', () => {
  for (const type of C.APP_TYPES) {
    const p = C.buildPalette({
      hex: '#6366F1', harmonyId: 'analogous', mode: 'light', appType: type.id, size: 10
    });
    assert.ok(p.textMuted, `${type.id} has no textMuted at size 10`);
    assert.ok(C.contrastRatio(p.textMuted, p.bg) >= type.textRatio,
      `${type.id} muted text fails the floor`);
    assert.ok(p.contrast.some((c) => c.key === 'text-muted-bg'));
    assert.ok(p.roles.some((r) => r.key === 'text-muted'));
  }
});

test('a semantic hue never sits next to the brand hue', () => {
  for (const type of C.APP_TYPES) {
    for (const hex of ['#EF4444', '#22C55E', '#F97316', '#6366F1']) {
      const p = C.buildPalette({ hex, harmonyId: 'analogous', mode: 'light', appType: type.id });
      const accent = C.rgbToHsl(C.hexToRgb(p.accent));
      if (accent.s < 0.1) continue;
      for (const role of ['success', 'warning', 'danger']) {
        const gap = hueDistance(C.rgbToHsl(C.hexToRgb(p[role])).h, accent.h);
        assert.ok(gap >= 25, `${type.id} ${hex} ${role} gap ${gap.toFixed(1)}`);
        assert.ok(C.contrastRatio(p[role], p.bg) >= 4.5, `${type.id} ${hex} ${role} contrast`);
      }
    }
  }
});

test('analogous puts accent-2 nearest, above the extras, and calms it', () => {
  const p = C.buildPalette({ hex: '#6366F1', harmonyId: 'analogous', mode: 'light' });
  const base = C.rgbToHsl(C.hexToRgb('#6366F1')).h;
  const accent = C.rgbToHsl(C.hexToRgb(p.accent));
  const accent2 = C.rgbToHsl(C.hexToRgb(p.accent2));
  const partnerGap = hueDistance(accent2.h, accent.h);
  assert.ok(partnerGap >= 60 - 3, `accent-2 is ${partnerGap} away`);
  for (const hex of p.extras) {
    const d = hueDistance(C.rgbToHsl(C.hexToRgb(hex)).h, base);
    assert.ok(d >= partnerGap - 3, `an extra at ${d} is nearer than accent-2 at ${partnerGap}`);
  }
  assert.ok(accent2.s < accent.s, 'analogous accent-2 should be calmer than the accent');
});

test('a rejected white label is noted in the contrast row', () => {
  const p = C.buildPalette({ hex: '#6366F1', harmonyId: 'analogous', mode: 'light' });
  const row = p.contrast.find((c) => c.key === 'on-accent');
  assert.strictEqual(row.fg, '#000000');
  assert.ok(/White rejected/.test(row.note), `expected a note, got ${row.note}`);
  const passing = C.buildPalette({ hex: '#0B0D14', harmonyId: 'analogous', mode: 'light' })
    .contrast.find((c) => c.key === 'on-accent');
  assert.strictEqual(passing.note, null);
});

test('monochromatic extras are unique at every size and base lightness', () => {
  for (const hex of ['#FEF9C3', '#6366F1', '#0B0D14']) {
    for (const mode of ['light', 'dark']) {
      for (let size = 3; size <= 21; size++) {
        const p = C.buildPalette({ hex, harmonyId: 'monochromatic', mode, size });
        assert.strictEqual(new Set(p.extras).size, p.extras.length,
          `${hex} ${mode} size ${size} duplicate extras: ${p.extras.join(' ')}`);
        assert.ok(!p.extras.includes(p.accent),
          `${hex} ${mode} size ${size} repeats the accent`);
      }
    }
  }
});

test('buildPalette clamps a harmony whose partner is under 60 degrees', () => {
  C.HARMONIES.push({ id: 'test-near', label: 'Near', partner: 30, extras: [] });
  try {
    const p = C.buildPalette({ hex: '#6366F1', harmonyId: 'test-near', mode: 'light' });
    const d = Math.abs(C.rgbToHsl(C.hexToRgb(p.accent2)).h - C.rgbToHsl(C.hexToRgb(p.accent)).h);
    const gap = Math.min(d, 360 - d);
    assert.ok(gap >= 57, `accent-2 is only ${gap} degrees from the accent`);
  } finally {
    C.HARMONIES.pop();
  }
});
