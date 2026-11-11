const test = require('node:test');
const assert = require('node:assert');
const C = require('../color.js');

function hueOf(hex) {
  return C.rgbToHsl(C.hexToRgb(hex)).h;
}

function gap(a, b) {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
}

test('general is the default and reproduces the current palette', () => {
  const plain = C.buildPalette({ hex: '#6366F1', harmonyId: 'analogous', mode: 'light' });
  const general = C.buildPalette({ hex: '#6366F1', harmonyId: 'analogous', mode: 'light', appType: 'general' });
  assert.deepStrictEqual(general.roles, plain.roles);
  assert.deepStrictEqual(general.extras, plain.extras);
  assert.deepStrictEqual(general.contrast, plain.contrast);
  assert.strictEqual(general.accent, '#6366F1');
});

test('every app type keeps text readable in both themes', () => {
  for (const type of C.APP_TYPES) {
    for (const mode of ['light', 'dark']) {
      for (const hex of ['#6366F1', '#22C55E', '#EF4444', '#0B0D14', '#FAFAFA']) {
        const p = C.buildPalette({ hex, harmonyId: 'analogous', mode, appType: type.id });
        assert.ok(C.contrastRatio(p.text, p.bg) >= 4.5, `${type.id} ${mode} ${hex} text/bg`);
        assert.ok(C.contrastRatio(p.text, p.bg) >= type.textRatio, `${type.id} ${mode} ${hex} floor`);
        assert.ok(C.contrastRatio(p.text, p.surface) >= type.textRatio, `${type.id} ${mode} ${hex} text/surface`);
      }
    }
  }
});

test('kids demands AAA text', () => {
  const kids = C.appTypeById('kids');
  const p = C.buildPalette({ hex: '#6366F1', harmonyId: 'analogous', mode: 'light', appType: 'kids' });
  assert.ok(C.contrastRatio(p.text, p.bg) >= 7);
  assert.ok(kids.textRatio >= 7);
});

test('fintech ignores the base hue for its neutrals', () => {
  const a = C.buildPalette({ hex: '#6366F1', harmonyId: 'analogous', mode: 'light', appType: 'fintech' });
  const b = C.buildPalette({ hex: '#22C55E', harmonyId: 'analogous', mode: 'light', appType: 'fintech' });
  assert.ok(Math.abs(hueOf(a.bg) - 215) < 12);
  assert.ok(Math.abs(hueOf(a.bg) - hueOf(b.bg)) < 12);
});

test('fintech caps the accent saturation', () => {
  const p = C.buildPalette({ hex: '#1DE533', harmonyId: 'analogous', mode: 'light', appType: 'fintech' });
  assert.ok(C.rgbToHsl(C.hexToRgb(p.accent)).s <= 0.55 + 0.01);
});

test('kids lifts a washed out accent without changing its hue', () => {
  const p = C.buildPalette({ hex: '#B0B0A0', harmonyId: 'analogous', mode: 'light', appType: 'kids' });
  const hsl = C.rgbToHsl(C.hexToRgb(p.accent));
  assert.ok(hsl.s >= 0.68 - 0.01);
  assert.ok(Math.abs(gap(hsl.h, hueOf('#B0B0A0'))) < 2);
});

test('every type keeps the accent hue and 60 degrees of separation', () => {
  for (const type of C.APP_TYPES) {
    for (const harmonyId of ['analogous', 'complementary', 'split-complementary', 'triadic', 'tetradic', 'monochromatic']) {
      for (const hex of ['#6366F1', '#1DE533', '#F97316', '#0B0D14', '#808080']) {
        const p = C.buildPalette({ hex, harmonyId, mode: 'light', appType: type.id });
        if (!p.accent2) continue;
        // The hue survives, to within the drift an 8 bit hex introduces.
        // Very dark and very pale colours have no stable hue to measure.
        const baseHsl = C.rgbToHsl(C.hexToRgb(hex));
        const stableHue = baseHsl.l > 0.15 && baseHsl.l < 0.85 && baseHsl.s >= 0.25;
        const drift = Math.abs(gap(hueOf(p.accent), hueOf(hex)));
        assert.ok(drift < (stableHue ? 2.5 : 7),
          `${type.id} ${harmonyId} ${hex} accent hue drift ${drift}`);
        if (harmonyId === 'monochromatic') continue;

        // The rule is about the hues the harmony asks for.
        const partner = C.partnerHue(hueOf(hex), harmonyId);
        const expectedHue = type.accent2Hue === 'warm' && gap(35, hueOf(hex)) >= 60 ? 35 : partner;
        const expectedGap = gap(expectedHue, hueOf(hex));
        // 1e-6 absorbs float noise in the hue arithmetic; a real violation of
        // the rule is 30 degrees or more, not a rounding hair.
        assert.ok(expectedGap >= 60 - 1e-6, `${type.id} ${harmonyId} ${hex} rule`);

        // The emitted pair must land on that rule, to within the drift an
        // 8 bit hex can introduce. Pale and near-grey colours have no stable
        // hue to measure, so they are not compared.
        const accentHsl = C.rgbToHsl(C.hexToRgb(p.accent));
        if (accentHsl.l > 0.15 && accentHsl.l < 0.85 && accentHsl.s >= 0.25) {
          const emitted = gap(hueOf(p.accent), hueOf(p.accent2));
          assert.ok(Math.abs(emitted - expectedGap) < 3,
            `${type.id} ${harmonyId} ${hex} emitted ${emitted} vs ${expectedGap}`);
        }
      }
    }
  }
});

test('dashboard gives accent-2 a warm hue that stays 60 degrees away', () => {
  const p = C.buildPalette({ hex: '#6366F1', harmonyId: 'split-complementary', mode: 'light', appType: 'dashboard' });
  assert.ok(gap(hueOf(p.accent2), 35) < 20);
  assert.ok(gap(hueOf(p.accent2), hueOf(p.accent)) >= 60);
});

test('extreme base colors still produce an in-range accent', () => {
  for (const type of C.APP_TYPES) {
    for (const hex of ['#0B0D14', '#FAFAFA', '#FFFFFF', '#000000']) {
      const p = C.buildPalette({ hex, harmonyId: 'analogous', mode: 'light', appType: type.id });
      const hsl = C.rgbToHsl(C.hexToRgb(p.accent));
      // Every type, including General, has to paint a visible fill. A
      // near-white base used to come straight back as a near-white accent,
      // which made every button and chart series disappear.
      assert.ok(
        C.contrastRatio(p.accent, p.surface) >= 3,
        `${type.id} ${hex} accent fill is invisible on the surface`
      );
      assert.ok(hsl.l >= 0 && hsl.l <= 1, `${type.id} ${hex} accent lightness`);
      assert.ok(hsl.s >= 0 && hsl.s <= 1, `${type.id} ${hex} accent saturation`);
    }
  }
});

test('an achromatic base still gets a distinct accent-2', () => {
  const p = C.buildPalette({ hex: '#808080', harmonyId: 'analogous', mode: 'light', appType: 'kids' });
  const gapDegrees = gap(hueOf(p.accent), hueOf(p.accent2));
  assert.ok(gapDegrees >= 60, `kids grey gap ${gapDegrees}`);
  assert.ok(Math.abs(gap(hueOf(p.accent2), 60)) < 3, `accent-2 hue ${hueOf(p.accent2)}`);
});

test('monochromatic extras are shaped once, not twice', () => {
  const p = C.buildPalette({ hex: '#6366F1', harmonyId: 'monochromatic', mode: 'light', appType: 'dashboard', size: 14 });
  const accentSat = C.rgbToHsl(C.hexToRgb(p.accent)).s;
  assert.strictEqual(p.extras.length, 4);
  p.extras.forEach((hex) => {
    const sat = C.rgbToHsl(C.hexToRgb(hex)).s;
    assert.ok(Math.abs(sat - accentSat) < 0.09, `extra sat ${sat} vs accent ${accentSat}`);
  });
});

test('app types carry their own semantics', () => {
  const health = C.buildPalette({ hex: '#6366F1', harmonyId: 'analogous', mode: 'light', appType: 'health' });
  const general = C.buildPalette({ hex: '#6366F1', harmonyId: 'analogous', mode: 'light', appType: 'general' });
  assert.notStrictEqual(health.danger, general.danger);
  assert.notStrictEqual(health.success, general.success);
  assert.ok(C.contrastRatio(health.danger, health.bg) >= 4.5);
});

test('app types declare an opening harmony and theme', () => {
  assert.strictEqual(C.appTypeById('dashboard').mode, 'dark');
  assert.strictEqual(C.appTypeById('developer').mode, 'dark');
  assert.strictEqual(C.appTypeById('kids').mode, 'light');
  assert.strictEqual(C.appTypeById('general').harmonyId, 'analogous');
  assert.strictEqual(C.appTypeById('dashboard').harmonyId, 'split-complementary');
});
