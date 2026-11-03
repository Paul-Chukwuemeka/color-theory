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
    { id: 'analogous', label: 'Analogous', partner: 60, extras: [30, -30] },
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
    var delta = rule.partner;
    if (Math.abs(delta) < 60) delta = delta < 0 ? -60 : 60;
    return wrapHue(baseHue + delta);
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

    var semantic = light
      ? { success: '#15803D', warning: '#B45309', danger: '#B91C1C' }
      : { success: '#4ADE80', warning: '#FBBF24', danger: '#F87171' };

    var onAccent = pickReadable(accent, '#FFFFFF');
    var onAccent2 = pickReadable(accent2, '#FFFFFF');
    var onSuccess = pickReadable(semantic.success, '#FFFFFF');
    var onWarning = pickReadable(semantic.warning, '#FFFFFF');
    var onDanger = pickReadable(semantic.danger, '#FFFFFF');

    return {
      bg: bg,
      surface: surface,
      text: text,
      accent: accent,
      accent2: accent2,
      accentSoft: accentSoft,
      success: semantic.success,
      warning: semantic.warning,
      danger: semantic.danger,
      onAccent: onAccent,
      onAccent2: onAccent2,
      onSuccess: onSuccess,
      onWarning: onWarning,
      onDanger: onDanger,
      extras: extras,
      contrast: [
        makeContrast('text-bg', 'Text on background', text, bg),
        makeContrast('text-surface', 'Text on surface', text, surface),
        makeContrast('accent-bg', 'Accent on background', accent, bg),
        makeContrast('on-accent', 'Label on accent', onAccent, accent),
        makeContrast('accent2-bg', 'Accent-2 on background', accent2, bg),
        makeContrast('on-accent2', 'Label on accent-2', onAccent2, accent2),
        makeContrast('success-bg', 'Success on background', semantic.success, bg),
        makeContrast('on-success', 'Label on success', onSuccess, semantic.success),
        makeContrast('warning-bg', 'Warning on background', semantic.warning, bg),
        makeContrast('on-warning', 'Label on warning', onWarning, semantic.warning),
        makeContrast('danger-bg', 'Danger on background', semantic.danger, bg),
        makeContrast('on-danger', 'Label on danger', onDanger, semantic.danger)
      ]
    };
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
    var entries = [
      ['bg', palette.bg],
      ['surface', palette.surface],
      ['text', palette.text],
      ['accent', palette.accent],
      ['accent-2', palette.accent2],
      ['accent-soft', palette.accentSoft],
      ['success', palette.success],
      ['warning', palette.warning],
      ['danger', palette.danger],
      ['on-accent', palette.onAccent],
      ['on-accent-2', palette.onAccent2],
      ['on-success', palette.onSuccess],
      ['on-warning', palette.onWarning],
      ['on-danger', palette.onDanger]
    ];
    palette.extras.forEach(function (hex, i) {
      entries.push(['extra-' + (i + 1), hex]);
    });
    return entries;
  }

  function cssBlock(palette, selector) {
    var lines = [selector + ' {'];
    roleEntries(palette).forEach(function (entry) {
      lines.push('  --color-' + entry[0] + ': ' + entry[1] + ';');
    });
    lines.push('}');
    return lines.join('\n');
  }

  function hexBlock(palette) {
    return roleEntries(palette).map(function (entry) {
      return entry[0].padEnd(12) + ' ' + entry[1];
    }).join('\n');
  }

  function pickReadable(bgHex, preferredHex) {
    if (contrastRatio(preferredHex, bgHex) >= 4.5) return preferredHex;
    return contrastRatio('#000000', bgHex) >= contrastRatio('#FFFFFF', bgHex)
      ? '#000000'
      : '#FFFFFF';
  }

  function formatExport(palettes, opts) {
    var format = opts.format === 'css' ? 'css' : 'hex';
    var themes = opts.themes || 'light';
    var list = themes === 'both' ? ['light', 'dark'] : [themes];

    var parts = list.map(function (theme) {
      if (format === 'css') {
        var selector = themes === 'both' && theme === 'dark' ? '[data-theme="dark"]' : ':root';
        return cssBlock(palettes[theme], selector);
      }
      var body = hexBlock(palettes[theme]);
      return themes === 'both' ? '/* ' + theme + ' */\n' + body : body;
    });

    return parts.join('\n\n');
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
    buildPalette: buildPalette,
    buildSuggestions: buildSuggestions,
    pickReadable: pickReadable,
    formatExport: formatExport
  };
});
