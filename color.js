(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ColorMath = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function normalizeHex(input) {
    if (typeof input !== 'string') return null;
    let s = input.trim();
    if (s.charAt(0) === '#') s = s.slice(1);
    if (/^[0-9a-f]{3}$/i.test(s)) {
      s = s.split('').map(function (c) { return c + c; }).join('');
    }
    if (!/^[0-9a-f]{6}$/i.test(s)) return null;
    return '#' + s.toUpperCase();
  }

  function isCompleteHex(input) {
    if (typeof input !== 'string') return false;
    return /^#?[0-9a-f]{6}$/i.test(input.trim());
  }

  function hexToRgb(hex) {
    const norm = normalizeHex(hex);
    if (!norm) throw new Error('Invalid hex: ' + hex);
    return {
      r: parseInt(norm.slice(1, 3), 16),
      g: parseInt(norm.slice(3, 5), 16),
      b: parseInt(norm.slice(5, 7), 16)
    };
  }

  function clampByte(n) {
    return Math.max(0, Math.min(255, Math.round(n)));
  }

  function toHexByte(n) {
    const s = clampByte(n).toString(16).toUpperCase();
    return s.length === 1 ? '0' + s : s;
  }

  function rgbToHex(rgb) {
    return '#' + toHexByte(rgb.r) + toHexByte(rgb.g) + toHexByte(rgb.b);
  }

  function rgbToHsl(rgb) {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0;
    let s = 0;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }

    return { h: h, s: s, l: l };
  }

  function wrapHue(deg) {
    return ((deg % 360) + 360) % 360;
  }

  function hslToRgb(hsl) {
    const h = wrapHue(hsl.h);
    const s = Math.max(0, Math.min(1, hsl.s));
    const l = Math.max(0, Math.min(1, hsl.l));

    if (s === 0) {
      const v = Math.round(l * 255);
      return { r: v, g: v, b: v };
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    function hueToChannel(t) {
      let tt = t;
      if (tt < 0) tt += 1;
      if (tt > 1) tt -= 1;
      if (tt < 1 / 6) return p + (q - p) * 6 * tt;
      if (tt < 1 / 2) return q;
      if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
      return p;
    }

    const hk = h / 360;
    return {
      r: Math.round(hueToChannel(hk + 1 / 3) * 255),
      g: Math.round(hueToChannel(hk) * 255),
      b: Math.round(hueToChannel(hk - 1 / 3) * 255)
    };
  }

  function mix(hexA, hexB, t) {
    const a = hexToRgb(hexA);
    const b = hexToRgb(hexB);
    const amount = Math.max(0, Math.min(1, t));
    return rgbToHex({
      r: a.r + (b.r - a.r) * amount,
      g: a.g + (b.g - a.g) * amount,
      b: a.b + (b.b - a.b) * amount
    });
  }

  function relativeLuminance(rgb) {
    function channel(v) {
      const c = v / 255;
      return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    }
    return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
  }

  function contrastRatio(hexA, hexB) {
    const la = relativeLuminance(hexToRgb(hexA));
    const lb = relativeLuminance(hexToRgb(hexB));
    const light = Math.max(la, lb);
    const dark = Math.min(la, lb);
    return (light + 0.05) / (dark + 0.05);
  }

  // Walk a colour's lightness toward the readable side until it clears the
  // floor. The fill itself is never touched: this makes a text-safe twin.
  function ensureContrast(fg, bg, min) {
    const floor = min || 4.5;
    const norm = normalizeHex(fg);
    if (!norm) return fg;
    if (contrastRatio(norm, bg) >= floor) return norm;

    const hsl = rgbToHsl(hexToRgb(norm));
    // Below this luminance black and white are equally readable; above it,
    // darkening is the shorter trip.
    const first = relativeLuminance(hexToRgb(bg)) > 0.18 ? -1 : 1;

    function walk(direction) {
      for (let i = 1; i <= 50; i++) {
        const l = hsl.l + direction * 0.02 * i;
        if (l < 0 || l > 1) return null;
        const candidate = rgbToHex(hslToRgb({ h: hsl.h, s: hsl.s, l: l }));
        if (contrastRatio(candidate, bg) >= floor) return candidate;
      }
      return null;
    }

    return walk(first) || walk(-first) ||
      (contrastRatio('#000000', bg) >= contrastRatio('#FFFFFF', bg) ? '#000000' : '#FFFFFF');
  }

  var HARMONIES = [
    { id: 'analogous', label: 'Analogous', partner: 60, extras: [90, 120] },
    { id: 'complementary', label: 'Complementary', partner: 180, extras: [] },
    { id: 'split-complementary', label: 'Split', partner: 150, extras: [210] },
    { id: 'triadic', label: 'Triadic', partner: 120, extras: [240] },
    { id: 'tetradic', label: 'Tetradic', partner: 90, extras: [180, 270] },
    { id: 'monochromatic', label: 'Mono', partner: null, extras: [] }
  ];

  var SIZE_MIN = 3;
  var SIZE_MAX = 21;
  var GOLDEN_ANGLE = 137.508;
  var MIN_HUE_GAP = 10;

  // Display order is the order the swatches appear in. Priority is the order
  // roles survive when the palette is shrunk: the first roles to go are the
  // ones a small palette can live without.
  var ROLE_DEFS = [
    { key: 'bg', prop: 'bg', priority: 1 },
    { key: 'surface', prop: 'surface', priority: 4 },
    { key: 'text', prop: 'text', priority: 2 },
    { key: 'text-muted', prop: 'textMuted', priority: 10 },
    { key: 'accent', prop: 'accent', priority: 3 },
    { key: 'accent-2', prop: 'accent2', priority: 5 },
    { key: 'accent-soft', prop: 'accentSoft', priority: 6 },
    { key: 'success', prop: 'success', priority: 8 },
    { key: 'warning', prop: 'warning', priority: 9 },
    { key: 'danger', prop: 'danger', priority: 7 }
  ];

  var APP_TYPES = [
    {
      id: 'general',
      label: 'General',
      neutralHue: 'base',
      neutralSat: [0.24, 0.26],
      neutralBgL: [0.985, 0.075],
      neutralSurfaceL: [0.955, 0.115],
      accentSat: 1,
      accentSatMax: 1,
      accentSatMin: 0,
      accentLight: 0,
      accent2Sat: 1,
      accent2SatMax: 1,
      accent2SatMin: 0,
      accent2Light: 0,
      accent2Hue: 'partner',
      accentSoftMix: [0.16, 0.30],
      textRatio: 4.5,
      semantics: {
        light: { success: '#15803D', warning: '#B45309', danger: '#B91C1C' },
        dark: { success: '#4ADE80', warning: '#FBBF24', danger: '#F87171' }
      },
      harmonyId: 'analogous',
      mode: 'light'
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      neutralHue: 220,
      neutralSat: [0.16, 0.18],
      neutralBgL: [0.975, 0.09],
      neutralSurfaceL: [0.935, 0.14],
      accentSat: 0.9,
      accentSatMax: 0.9,
      accentSatMin: 0,
      accentLight: -0.02,
      accent2Sat: 0.85,
      accent2SatMax: 0.85,
      accent2SatMin: 0,
      accent2Light: 0.04,
      accent2Hue: 'warm',
      accentSoftMix: [0.14, 0.26],
      textRatio: 4.5,
      semantics: {
        light: { success: '#16A34A', warning: '#D97706', danger: '#DC2626' },
        dark: { success: '#4ADE80', warning: '#FBBF24', danger: '#F87171' }
      },
      harmonyId: 'split-complementary',
      mode: 'dark'
    },
    {
      id: 'education',
      label: 'Education',
      neutralHue: 35,
      neutralSat: [0.22, 0.20],
      neutralBgL: [0.985, 0.08],
      neutralSurfaceL: [0.955, 0.125],
      accentSat: 1,
      accentSatMax: 1,
      accentSatMin: 0,
      accentLight: 0.02,
      accent2Sat: 1,
      accent2SatMax: 1,
      accent2SatMin: 0,
      accent2Light: 0.02,
      accent2Hue: 'partner',
      accentSoftMix: [0.20, 0.32],
      textRatio: 4.5,
      semantics: {
        light: { success: '#16A34A', warning: '#D97706', danger: '#DC2626' },
        dark: { success: '#4ADE80', warning: '#FBBF24', danger: '#F87171' }
      },
      harmonyId: 'triadic',
      mode: 'light'
    },
    {
      id: 'kids',
      label: 'Kids',
      neutralHue: 45,
      neutralSat: [0.28, 0.24],
      neutralBgL: [0.99, 0.10],
      neutralSurfaceL: [0.965, 0.15],
      accentSat: 1,
      accentSatMax: 1,
      accentSatMin: 0.68,
      accentLight: 0.02,
      accent2Sat: 1,
      accent2SatMax: 1,
      accent2SatMin: 0.6,
      accent2Light: 0.02,
      accent2Hue: 'partner',
      accentSoftMix: [0.24, 0.36],
      textRatio: 7,
      semantics: {
        light: { success: '#22C55E', warning: '#EA580C', danger: '#EF4444' },
        dark: { success: '#86EFAC', warning: '#FDBA74', danger: '#FCA5A5' }
      },
      harmonyId: 'analogous',
      mode: 'light'
    },
    {
      id: 'fintech',
      label: 'Fintech',
      neutralHue: 215,
      neutralSat: [0.14, 0.16],
      neutralBgL: [0.98, 0.08],
      neutralSurfaceL: [0.95, 0.12],
      accentSat: 0.85,
      accentSatMax: 0.55,
      accentSatMin: 0,
      accentLight: 0.02,
      accent2Sat: 0.85,
      accent2SatMax: 0.85,
      accent2SatMin: 0,
      accent2Light: 0.02,
      accent2Hue: 'partner',
      accentSoftMix: [0.14, 0.26],
      textRatio: 4.5,
      semantics: {
        light: { success: '#047857', warning: '#B45309', danger: '#B91C1C' },
        dark: { success: '#34D399', warning: '#FBBF24', danger: '#F87171' }
      },
      harmonyId: 'complementary',
      mode: 'light'
    },
    {
      id: 'health',
      label: 'Health',
      neutralHue: 30,
      neutralSat: [0.14, 0.12],
      neutralBgL: [0.985, 0.085],
      neutralSurfaceL: [0.955, 0.12],
      accentSat: 0.8,
      accentSatMax: 0.6,
      accentSatMin: 0,
      accentLight: 0.04,
      accent2Sat: 0.8,
      accent2SatMax: 0.8,
      accent2SatMin: 0,
      accent2Light: 0.04,
      accent2Hue: 'partner',
      accentSoftMix: [0.14, 0.26],
      textRatio: 4.5,
      semantics: {
        light: { success: '#4D7C0F', warning: '#B45309', danger: '#C2410C' },
        dark: { success: '#A3E635', warning: '#FDE047', danger: '#FDBA74' }
      },
      harmonyId: 'split-complementary',
      mode: 'light'
    },
    {
      id: 'developer',
      label: 'Developer',
      neutralHue: 220,
      neutralSat: [0.16, 0.20],
      neutralBgL: [0.97, 0.085],
      neutralSurfaceL: [0.94, 0.13],
      accentSat: 1,
      accentSatMax: 0.95,
      accentSatMin: 0,
      accentLight: 0,
      accent2Sat: 1,
      accent2SatMax: 1,
      accent2SatMin: 0,
      accent2Light: 0,
      accent2Hue: 'partner',
      accentSoftMix: [0.16, 0.30],
      textRatio: 4.5,
      semantics: {
        light: { success: '#15803D', warning: '#A16207', danger: '#DC2626' },
        dark: { success: '#4ADE80', warning: '#FACC15', danger: '#F87171' }
      },
      harmonyId: 'tetradic',
      mode: 'dark'
    }
  ];

  function appTypeById(id) {
    for (var i = 0; i < APP_TYPES.length; i++) {
      if (APP_TYPES[i].id === id) return APP_TYPES[i];
    }
    return APP_TYPES[0];
  }

  function hueGap(a, b) {
    var diff = Math.abs(a - b) % 360;
    return Math.min(diff, 360 - diff);
  }

  function normalizeSize(size) {
    if (size === undefined || size === null || size === '') return null;
    var n = Math.round(Number(size));
    if (!isFinite(n)) return null;
    if (n < SIZE_MIN) return SIZE_MIN;
    if (n > SIZE_MAX) return SIZE_MAX;
    return n;
  }

  function harmonyById(id) {
    for (var i = 0; i < HARMONIES.length; i++) {
      if (HARMONIES[i].id === id) return HARMONIES[i];
    }
    return HARMONIES[0];
  }

  function hueName(deg) {
    var names = ['Red', 'Orange', 'Amber', 'Lime', 'Green', 'Teal',
      'Cyan', 'Blue', 'Indigo', 'Violet', 'Magenta', 'Rose'];
    return names[Math.round(wrapHue(deg) / 30) % 12];
  }

  function partnerHue(baseHue, harmonyId) {
    var rule = harmonyById(harmonyId);
    if (rule.partner === null) return null;
    var delta = rule.partner;
    if (Math.abs(delta) < 60) delta = delta < 0 ? -60 : 60;
    return wrapHue(baseHue + delta);
  }

  function extraHues(baseHue, harmonyId) {
    return harmonyById(harmonyId).extras.map(function (d) {
      return wrapHue(baseHue + d);
    });
  }

  function monoExtras(baseHue, s, l, count, type, excludeHex) {
    var out = [];
    var seen = {};
    // The accent can be shaped differently from the extras, so the caller
    // supplies its actual hex: seeding with a recomputed colour let a
    // same-lightness extra come out as the accent again.
    var accentHex = excludeHex ||
      rgbToHex(hslToRgb({ h: baseHue, s: s, l: l }));
    seen[accentHex] = true;

    // Lightness steps on both sides of the base, nearest first, so a small
    // palette stays close to the accent and a large one walks outwards.
    var levels = [];
    for (var v = 0.08; v <= 0.9501; v += 0.04) levels.push(Math.round(v * 100) / 100);
    levels.sort(function (a, b) {
      return Math.abs(a - l) - Math.abs(b - l) || b - a;
    });

    function add(candidateL, candidateS) {
      var nextS = Math.max(0, Math.min(1, candidateS));
      // The saturation already carries the type's shaping; only the floor and
      // the ceiling are applied here, so the rule is not applied twice.
      if (type) nextS = Math.min(Math.max(nextS, type.accentSatMin), type.accentSatMax);
      var hex = rgbToHex(hslToRgb({ h: baseHue, s: nextS, l: candidateL }));
      if (seen[hex]) return;
      seen[hex] = true;
      out.push(hex);
    }

    // Walk candidates until the palette has count unique colours, not a fixed
    // number of steps: the old fixed walk pushed the same lightness twice on
    // light and dark bases.
    var shifts = [0, -0.08, 0.08, -0.16, 0.16];
    for (var k = 0; k < shifts.length && out.length < count; k++) {
      for (var i = 0; i < levels.length && out.length < count; i++) {
        var level = levels[i];
        if (shifts[k] === 0 && Math.abs(level - l) < 0.02) continue;
        var eased = s + shifts[k] - 0.03 * Math.min(1, Math.abs(level - l) / 0.14);
        add(level, eased);
      }
    }
    return out;
  }

  function generateExtras(baseHue, harmonyId, count, s, l, type, accentHex) {
    if (count <= 0) return [];
    if (harmonyById(harmonyId).partner === null) {
      return monoExtras(baseHue, s, l, count, type, accentHex);
    }
    var taken = [baseHue];
    var partner = partnerHue(baseHue, harmonyId);
    if (partner !== null) taken.push(partner);
    var hues = extraHues(baseHue, harmonyId);
    var k = 1;
    while (hues.length < count && k < 400) {
      var candidate = wrapHue(baseHue + GOLDEN_ANGLE * k);
      k++;
      var clear = taken.concat(hues).every(function (hue) {
        return hueGap(hue, candidate) >= MIN_HUE_GAP;
      });
      if (clear) hues.push(candidate);
    }
    return hues.slice(0, count).map(function (hue) {
      return rgbToHex(hslToRgb({ h: hue, s: s, l: l }));
    });
  }

  function contrastLevel(ratio) {
    if (ratio >= 7) return 'AAA';
    if (ratio >= 4.5) return 'AA';
    return 'fail';
  }

  // Display only: truncate rather than round, so a ratio that is below AA
  // never prints as 4.50 and reads like it passed.
  function formatRatio(ratio) {
    return (Math.floor(ratio * 100) / 100).toFixed(2);
  }

  function makeContrast(key, label, fg, bg, note) {
    var ratio = contrastRatio(fg, bg);
    return {
      key: key, label: label, fg: fg, bg: bg, ratio: ratio,
      level: contrastLevel(ratio), note: note || null
    };
  }

  function deriveText(h, mode, bg, surface, minRatio) {
    var floor = minRatio || 4.5;
    var lightMode = mode === 'light';
    var lightness = lightMode ? 0.12 : 0.96;
    var step = lightMode ? -0.02 : 0.02;
    var sat = lightMode ? 0.30 : 0.25;
    var candidate = lightMode ? '#000000' : '#FFFFFF';

    for (var i = 0; i < 60; i++) {
      candidate = rgbToHex(hslToRgb({ h: h, s: sat, l: lightness }));
      if (contrastRatio(candidate, bg) >= floor && contrastRatio(candidate, surface) >= floor) {
        return candidate;
      }
      lightness += step;
      if (lightness < 0) lightness = 0;
      if (lightness > 1) lightness = 1;
    }
    return lightMode ? '#000000' : '#FFFFFF';
  }

  function shapeSaturation(sat, type, family) {
    var multiplier = family === 'accent2' ? type.accent2Sat : type.accentSat;
    var max = family === 'accent2' ? type.accent2SatMax : type.accentSatMax;
    var min = family === 'accent2' ? type.accent2SatMin : type.accentSatMin;
    var out = clamp(sat * multiplier, 0, 1);
    out = Math.min(out, max);
    out = Math.max(out, min);
    return out;
  }

  function shapesAccent(type, family) {
    if (family === 'accent2') {
      return type.accent2Sat !== 1 || type.accent2Light !== 0 ||
        type.accent2SatMax !== 1 || type.accent2SatMin !== 0;
    }
    return type.accentSat !== 1 || type.accentLight !== 0 ||
      type.accentSatMax !== 1 || type.accentSatMin !== 0;
  }

  function buildAccent2(hueValue, s, l, type, satScale) {
    var scale = satScale || 1;
    var plain = !shapesAccent(type, 'accent2') && scale === 1;
    var a2Sat = plain
      ? s
      : clamp(shapeSaturation(s, type, 'accent2') * scale, type.accent2SatMin, type.accent2SatMax);
    // A near-grey base would otherwise make accent-2 just as grey, so the
    // second accent would not be a second accent at all.
    if (s < 0.1) a2Sat = Math.max(a2Sat, Math.min(0.45, type.accent2SatMax));
    // Shape in HSL space and keep the intended hue. Reading the hue back out
    // of a raw colour loses it whenever the base is achromatic, where every
    // hue reads as 0.
    var a2L = clamp(l + type.accent2Light, 0.05, 0.95);
    return rgbToHex(hslToRgb({ h: hueValue, s: a2Sat, l: a2L }));
  }

  // Eight-bit colour loses hue resolution in very dark or very light tones:
  // a partner that is 60 degrees away by design can read as 52 degrees on
  // screen. Step the intended hue outwards until the painted pair really is
  // 60 degrees apart, keeping the first candidate that passes.
  function buildSeparatedAccent2(accentHex, intendedHue, s, l, type, satScale) {
    var accentHsl = rgbToHsl(hexToRgb(accentHex));
    if (accentHsl.s < 0.1) {
      return buildAccent2(intendedHue, s, l, type, satScale);
    }
    var best = null;
    for (var step = 0; step <= 120; step++) {
      var offsets = step === 0 ? [0] : [step, -step];
      for (var i = 0; i < offsets.length; i++) {
        var candidate = buildAccent2(wrapHue(intendedHue + offsets[i]), s, l, type, satScale);
        var gap = hueGap(rgbToHsl(hexToRgb(candidate)).h, accentHsl.h);
        if (best === null || gap > best.gap) best = { hex: candidate, gap: gap };
        if (gap >= 60) return candidate;
      }
    }
    return best.hex;
  }

  // Keep a semantic colour distinguishable from the brand, and from the other
  // semantics, without dropping below the floor where it is used as text.
  function refineSemantic(hex, accentHue, allSemantics, bg, floor) {
    var hsl = rgbToHsl(hexToRgb(hex));
    var candidate = hex;

    if (accentHue !== null && hueGap(hsl.h, accentHue) < 25) {
      var best = null;
      [45, -45].forEach(function (shift) {
        var hue = wrapHue(hsl.h + shift);
        var minGap = hueGap(hue, accentHue);
        Object.keys(allSemantics).forEach(function (key) {
          if (allSemantics[key] === hex) return;
          minGap = Math.min(minGap, hueGap(hue, rgbToHsl(hexToRgb(allSemantics[key])).h));
        });
        if (best === null || minGap > best.gap) best = { h: hue, gap: minGap };
      });
      candidate = rgbToHex(hslToRgb({ h: best.h, s: hsl.s, l: hsl.l }));
    }

    return ensureContrast(candidate, bg, floor);
  }

  function buildPalette(opts) {
    var accent = normalizeHex(opts.hex);
    if (!accent) throw new Error('Invalid hex: ' + opts.hex);

    var mode = opts.mode === 'dark' ? 'dark' : 'light';
    var light = mode === 'light';
    var idx = light ? 0 : 1;
    var hsl = rgbToHsl(hexToRgb(accent));
    var h = hsl.h;
    var s = hsl.s;
    var l = hsl.l;

    var type = appTypeById(opts.appType);
    var neutralHue = type.neutralHue === 'base' ? h : type.neutralHue;

    var bg = rgbToHex(hslToRgb({
      h: neutralHue, s: type.neutralSat[idx], l: type.neutralBgL[idx]
    }));
    var surface = rgbToHex(hslToRgb({
      h: neutralHue, s: type.neutralSat[idx] - 0.02, l: type.neutralSurfaceL[idx]
    }));
    var text = deriveText(neutralHue, mode, bg, surface, type.textRatio);
    // A quieter text tone, mixed toward the background and then walked back
    // until it still meets the app type's floor.
    var textMuted = ensureContrast(mix(text, bg, 0.35), surface, type.textRatio);
    if (contrastRatio(textMuted, bg) < type.textRatio) {
      textMuted = ensureContrast(textMuted, bg, type.textRatio);
    }

    var accentSat = shapeSaturation(s, type, 'accent');
    var accentL = clamp(l + type.accentLight, 0.05, 0.95);
    var accentFinal = shapesAccent(type, 'accent')
      ? rgbToHex(hslToRgb({ h: h, s: accentSat, l: accentL }))
      : accent;

    // A fill that matches its background cannot be seen. Buttons, chart
    // series, icons and chips all paint the accent as a shape, so it has to
    // clear the 3:1 floor WCAG asks of non-text UI. Surface is the lighter
    // panel in dark mode and the darker one in light mode, so measuring
    // against it covers both the page and the cards. Only the lightness
    // moves; hue and saturation stay put.
    function visibleFill(hex) {
      return ensureContrast(hex, surface, 3);
    }

    // A filled control carries a label, and the label has to read on the
    // fill. Rather than flipping to black on every mid-tone fill (which is
    // what picking the higher ratio does, and which looks like an unstyled
    // default button), follow the tonal rule: a light-mode fill is deep
    // enough for a white label, a dark-mode fill is light enough for a
    // near-black one. That is also the same direction the visibility walk
    // moves, so the two never fight.
    function labelFill(hex) {
      var fillHsl = rgbToHsl(hexToRgb(hex));
      var label = light ? '#FFFFFF' : '#000000';
      var direction = light ? -1 : 1;
      var candidate = hex;
      for (var i = 1; i <= 100; i++) {
        if (contrastRatio(label, candidate) >= 4.5) return candidate;
        candidate = rgbToHex(hslToRgb({
          h: fillHsl.h,
          s: fillHsl.s,
          l: clamp(fillHsl.l + direction * 0.005 * i, 0.01, 0.99)
        }));
      }
      return candidate;
    }

    accentFinal = labelFill(visibleFill(accentFinal));

    var rule = harmonyById(opts.harmonyId);
    var accent2;
    if (rule.partner === null) {
      accent2 = rgbToHex(hslToRgb({
        h: h, s: s * 0.55, l: Math.min(l + 0.22, 0.95)
      }));
    } else {
      var accent2HueValue = partnerHue(h, rule.id);
      if (type.accent2Hue === 'warm' && hueGap(35, h) >= 60) {
        accent2HueValue = 35;
      }
      // Analogous wants a near neighbour rather than a shout, so its second
      // accent is the same harmony at a lower saturation.
      accent2 = buildSeparatedAccent2(
        accentFinal, accent2HueValue, s, l, type, rule.id === 'analogous' ? 0.6 : 1
      );
    }
    accent2 = labelFill(visibleFill(accent2));

    var extraSat = shapeSaturation(s, type, 'accent');
    var extraL = clamp(l, 0.12, 0.9);
    // Extras are hue-distinct, so an achromatic base needs some chroma or
    // every extra would be the same grey.
    if (s < 0.1) extraSat = clamp(0.45, type.accentSatMin, type.accentSatMax);
    var extras = rule.extras.map(function (d) {
      return rgbToHex(hslToRgb({ h: wrapHue(h + d), s: extraSat, l: extraL }));
    });

    var accentSoft = mix(bg, accentFinal, type.accentSoftMix[idx]);

    var semantic = type.semantics[mode];
    var accentFinalHsl = rgbToHsl(hexToRgb(accentFinal));
    var accentHue = accentFinalHsl.s >= 0.1 ? accentFinalHsl.h : null;
    // Surface is the harder background in both modes (darker than the page in
    // light mode, lighter in dark mode), so a colour that clears it also
    // clears the page.
    var success = labelFill(refineSemantic(semantic.success, accentHue, semantic, surface, 4.5));
    var warning = labelFill(refineSemantic(semantic.warning, accentHue, semantic, surface, 4.5));
    var danger = labelFill(refineSemantic(semantic.danger, accentHue, semantic, surface, 4.5));

    var size = normalizeSize(opts.size);
    var keptDefs;
    if (size === null) {
      keptDefs = ROLE_DEFS.slice();
    } else {
      keptDefs = ROLE_DEFS.slice()
        .sort(function (a, b) { return a.priority - b.priority; })
        .slice(0, Math.min(size, ROLE_DEFS.length));
      extras = generateExtras(h, rule.id, size - keptDefs.length, extraSat, extraL, type, accentFinal);
    }
    // Extras are the same hue and step by lightness in a mono palette, so
    // several can land on the same 8-bit colour once the floor pulls them
    // apart. Walk the lightness further until every chip is distinct.
    var usedFills = {};
    usedFills[accentFinal] = true;
    usedFills[accent2] = true;
    var fillDirection = relativeLuminance(hexToRgb(surface)) > 0.18 ? -1 : 1;
    extras = extras.map(function (extra) {
      var adjusted = visibleFill(extra);
      var hslExtra = rgbToHsl(hexToRgb(adjusted));
      var candidate = adjusted;
      var step = 0;
      while (usedFills[candidate] && step < 40) {
        step++;
        candidate = rgbToHex(hslToRgb({
          h: hslExtra.h,
          s: hslExtra.s,
          l: clamp(hslExtra.l + fillDirection * 0.02 * step, 0.02, 0.98)
        }));
      }
      usedFills[candidate] = true;
      return candidate;
    });

    var kept = {};
    keptDefs.forEach(function (def) { kept[def.prop] = true; });

    var colors = {
      bg: bg,
      surface: surface,
      text: text,
      textMuted: textMuted,
      accent: accentFinal,
      accent2: accent2,
      accentSoft: accentSoft,
      success: success,
      warning: warning,
      danger: danger
    };

    function roleColor(prop) {
      return kept[prop] ? colors[prop] : null;
    }

    var palette = {
      bg: roleColor('bg'),
      surface: roleColor('surface'),
      text: roleColor('text'),
      textMuted: roleColor('textMuted'),
      accent: roleColor('accent'),
      accent2: roleColor('accent2'),
      accentSoft: roleColor('accentSoft'),
      success: roleColor('success'),
      warning: roleColor('warning'),
      danger: roleColor('danger')
    };

    // A tiny palette may not keep the surface role, so measure against
    // whatever the text would sit on.
    var textBg = palette.surface || palette.bg;
    var accentText = palette.accent ? ensureContrast(palette.accent, textBg, 4.5) : null;
    var accent2Text = palette.accent2 ? ensureContrast(palette.accent2, textBg, 4.5) : null;
    // The fills were walked to meet these labels, so the pairing is known
    // rather than measured after the fact.
    var onFill = light ? '#FFFFFF' : '#000000';
    var onAccent = palette.accent ? onFill : null;
    var onAccent2 = palette.accent2 ? onFill : null;
    var onSuccess = palette.success ? onFill : null;
    var onWarning = palette.warning ? onFill : null;
    var onDanger = palette.danger ? onFill : null;

    palette.accentText = accentText;
    palette.accent2Text = accent2Text;
    palette.onAccent = onAccent;
    palette.onAccent2 = onAccent2;
    palette.onSuccess = onSuccess;
    palette.onWarning = onWarning;
    palette.onDanger = onDanger;
    palette.extras = extras;
    palette.roles = ROLE_DEFS
      .filter(function (def) { return kept[def.prop]; })
      .map(function (def) { return { key: def.key, hex: colors[def.prop] }; });
    palette.contrast = [];

    function pushContrast(key, label, fg, background, note) {
      if (!fg || !background) return;
      palette.contrast.push(makeContrast(key, label, fg, background, note));
    }

    pushContrast('text-bg', 'Text on background', palette.text, palette.bg);
    pushContrast('text-surface', 'Text on surface', palette.text, palette.surface);
    pushContrast('text-muted-bg', 'Muted text on background', palette.textMuted, palette.bg);
    pushContrast('accent-bg', 'Accent text on background', palette.accentText, palette.bg);
    pushContrast('on-accent', 'Label on accent', onAccent, palette.accent);
    pushContrast('accent2-bg', 'Accent-2 text on background', palette.accent2Text, palette.bg);
    pushContrast('on-accent2', 'Label on accent-2', onAccent2, palette.accent2);
    pushContrast('success-bg', 'Success on background', palette.success, palette.bg);
    pushContrast('on-success', 'Label on success', onSuccess, palette.success);
    pushContrast('warning-bg', 'Warning on background', palette.warning, palette.bg);
    pushContrast('on-warning', 'Label on warning', onWarning, palette.warning);
    pushContrast('danger-bg', 'Danger on background', palette.danger, palette.bg);
    pushContrast('on-danger', 'Label on danger', onDanger, palette.danger);

    return palette;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function buildSuggestions(input) {
    var h = input.h;
    var s = input.s;
    var l = input.l;
    return [
      {
        id: 'a',
        name: hueName(h - 10) + ' Analogue',
        harmonyId: 'analogous',
        hex: rgbToHex(hslToRgb({ h: h - 10, s: clamp(s, 0.45, 0.85), l: l }))
      },
      {
        id: 'b',
        name: hueName(h) + ' Triad',
        harmonyId: 'triadic',
        hex: rgbToHex(hslToRgb({ h: h, s: clamp(s, 0.5, 0.9), l: clamp(l + 0.05, 0.25, 0.7) }))
      },
      {
        id: 'c',
        name: hueName(h + 15) + ' Split',
        harmonyId: 'split-complementary',
        hex: rgbToHex(hslToRgb({ h: h + 15, s: clamp(s, 0.4, 0.8), l: clamp(l - 0.05, 0.25, 0.7) }))
      }
    ];
  }

  function roleEntries(palette) {
    var entries = [];
    palette.roles.forEach(function (role) {
      entries.push([role.key, role.hex]);
    });
    var onColors = [
      ['on-accent', palette.onAccent],
      ['on-accent-2', palette.onAccent2],
      ['on-success', palette.onSuccess],
      ['on-warning', palette.onWarning],
      ['on-danger', palette.onDanger]
    ];
    onColors.forEach(function (entry) {
      if (entry[1]) entries.push(entry);
    });
    if (palette.accentText) entries.push(['accent-text', palette.accentText]);
    if (palette.accent2Text) entries.push(['accent-2-text', palette.accent2Text]);
    palette.extras.forEach(function (hex, i) {
      entries.push(['extra-' + (i + 1), hex]);
    });
    return entries;
  }

  function cssBlock(palette, selector, indent) {
    var pad = indent || '';
    var lines = [pad + selector + ' {'];
    roleEntries(palette).forEach(function (entry) {
      lines.push(pad + '  --color-' + entry[0] + ': ' + entry[1] + ';');
    });
    lines.push(pad + '}');
    return lines.join('\n');
  }

  function tailwindBlock(palette, selector) {
    return cssBlock(palette, selector || '@theme');
  }

  function roleMap(palette) {
    var map = {};
    roleEntries(palette).forEach(function (entry) {
      map[entry[0]] = entry[1];
    });
    return map;
  }

  function hexBlock(palette) {
    return roleEntries(palette).map(function (entry) {
      return entry[0].padEnd(12) + ' ' + entry[1];
    }).join('\n');
  }

  function jsonBlock(palette) {
    return JSON.stringify(roleMap(palette), null, 2);
  }

  function pickReadable(bgHex, preferredHex) {
    if (contrastRatio(preferredHex, bgHex) >= 4.5) return preferredHex;
    return contrastRatio('#000000', bgHex) >= contrastRatio('#FFFFFF', bgHex)
      ? '#000000'
      : '#FFFFFF';
  }

  function formatExport(palettes, opts) {
    var requested = opts.format;
    var format = requested === 'css' || requested === 'tailwind' || requested === 'json'
      ? requested
      : 'hex';
    var themes = opts.themes === 'dark' || opts.themes === 'both' ? opts.themes : 'light';

    if (themes === 'both') {
      if (format === 'css') {
        // Three blocks: light, an explicit dark override, and an OS preference
        // fallback that cannot beat a deliberate light choice.
        return cssBlock(palettes.light, ':root') + '\n\n' +
          cssBlock(palettes.dark, '[data-theme="dark"]') + '\n\n' +
          '@media (prefers-color-scheme: dark) {\n' +
          cssBlock(palettes.dark, ':root:not([data-theme="light"])', '  ') + '\n}';
      }
      if (format === 'tailwind') {
        return tailwindBlock(palettes.light) + '\n\n' +
          tailwindBlock(palettes.dark, '[data-theme="dark"]');
      }
      if (format === 'json') {
        return JSON.stringify({
          light: roleMap(palettes.light),
          dark: roleMap(palettes.dark)
        }, null, 2);
      }
      return '/* light */\n' + hexBlock(palettes.light) + '\n\n/* dark */\n' + hexBlock(palettes.dark);
    }

    if (format === 'css') return cssBlock(palettes[themes], ':root');
    if (format === 'tailwind') return tailwindBlock(palettes[themes]);
    if (format === 'json') return jsonBlock(palettes[themes]);
    return hexBlock(palettes[themes]);
  }

  return {
    normalizeHex: normalizeHex,
    isCompleteHex: isCompleteHex,
    hexToRgb: hexToRgb,
    rgbToHex: rgbToHex,
    rgbToHsl: rgbToHsl,
    hslToRgb: hslToRgb,
    wrapHue: wrapHue,
    mix: mix,
    relativeLuminance: relativeLuminance,
    contrastRatio: contrastRatio,
    HARMONIES: HARMONIES,
    hueName: hueName,
    partnerHue: partnerHue,
    extraHues: extraHues,
    contrastLevel: contrastLevel,
    formatRatio: formatRatio,
    ensureContrast: ensureContrast,
    buildPalette: buildPalette,
    buildSuggestions: buildSuggestions,
    pickReadable: pickReadable,
    formatExport: formatExport,
    normalizeSize: normalizeSize,
    SIZE_MIN: SIZE_MIN,
    SIZE_MAX: SIZE_MAX,
    APP_TYPES: APP_TYPES,
    appTypeById: appTypeById
  };
});
