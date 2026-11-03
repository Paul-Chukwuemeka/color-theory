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
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
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

  var HARMONIES = [
    { id: 'analogous', label: 'Analogous', partner: 30, extras: [60] },
    { id: 'complementary', label: 'Complementary', partner: 180, extras: [] },
    { id: 'split-complementary', label: 'Split', partner: 150, extras: [210] },
    { id: 'triadic', label: 'Triadic', partner: 120, extras: [240] },
    { id: 'tetradic', label: 'Tetradic', partner: 90, extras: [180, 270] },
    { id: 'monochromatic', label: 'Mono', partner: null, extras: [] }
  ];

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
    return wrapHue(baseHue + rule.partner);
  }

  function extraHues(baseHue, harmonyId) {
    return harmonyById(harmonyId).extras.map(function (d) {
      return wrapHue(baseHue + d);
    });
  }

  function contrastLevel(ratio) {
    if (ratio >= 7) return 'AAA';
    if (ratio >= 4.5) return 'AA';
    return 'fail';
  }

  function makeContrast(key, label, fg, bg) {
    var ratio = contrastRatio(fg, bg);
    return { key: key, label: label, fg: fg, bg: bg, ratio: ratio, level: contrastLevel(ratio) };
  }

  function deriveText(h, mode, bg, surface) {
    var lightMode = mode === 'light';
    var lightness = lightMode ? 0.12 : 0.96;
    var step = lightMode ? -0.02 : 0.02;
    var sat = lightMode ? 0.30 : 0.25;
    var candidate = lightMode ? '#000000' : '#FFFFFF';

    for (var i = 0; i < 60; i++) {
      candidate = rgbToHex(hslToRgb({ h: h, s: sat, l: lightness }));
      if (contrastRatio(candidate, bg) >= 4.5 && contrastRatio(candidate, surface) >= 4.5) {
        return candidate;
      }
      lightness += step;
      if (lightness < 0) lightness = 0;
      if (lightness > 1) lightness = 1;
    }
    return lightMode ? '#000000' : '#FFFFFF';
  }

  function buildPalette(opts) {
    var accent = normalizeHex(opts.hex);
    if (!accent) throw new Error('Invalid hex: ' + opts.hex);

    var mode = opts.mode === 'dark' ? 'dark' : 'light';
    var light = mode === 'light';
    var hsl = rgbToHsl(hexToRgb(accent));
    var h = hsl.h;
    var s = hsl.s;
    var l = hsl.l;

    var bg = rgbToHex(hslToRgb(light
      ? { h: h, s: 0.24, l: 0.985 }
      : { h: h, s: 0.26, l: 0.075 }));
    var surface = rgbToHex(hslToRgb(light
      ? { h: h, s: 0.22, l: 0.955 }
      : { h: h, s: 0.24, l: 0.115 }));
    var text = deriveText(h, mode, bg, surface);

    var rule = harmonyById(opts.harmonyId);
    var accent2;
    if (rule.partner === null) {
      accent2 = rgbToHex(hslToRgb({
        h: h, s: s * 0.55, l: Math.min(l + 0.22, 0.95)
      }));
    } else {
      accent2 = rgbToHex(hslToRgb({ h: wrapHue(h + rule.partner), s: s, l: l }));
    }

    var extras = rule.extras.map(function (d) {
      return rgbToHex(hslToRgb({ h: wrapHue(h + d), s: s, l: l }));
    });

    var accentSoft = mix(bg, accent, light ? 0.16 : 0.30);

    return {
      bg: bg,
      surface: surface,
      text: text,
      accent: accent,
      accent2: accent2,
      accentSoft: accentSoft,
      extras: extras,
      contrast: [
        makeContrast('text-bg', 'Text on background', text, bg),
        makeContrast('text-surface', 'Text on surface', text, surface),
        makeContrast('white-accent', 'White on accent', '#FFFFFF', accent),
        makeContrast('black-accent', 'Black on accent', '#000000', accent),
        makeContrast('white-accent2', 'White on accent-2', '#FFFFFF', accent2),
        makeContrast('black-accent2', 'Black on accent-2', '#000000', accent2)
      ]
    };
  }

  return {
    normalizeHex: normalizeHex,
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
    buildPalette: buildPalette
  };
});
