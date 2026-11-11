/*
 * The app's colour state.
 *
 * HSL is the source of truth, as floats: a hue the user dragged is never read
 * back out of an 8-bit hex, where rounding would move the ring and an
 * achromatic colour would forget its hue entirely. A hex is derived for
 * display and for palette building; a hex is only parsed when the user types
 * one, or picks a preset or suggestion.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./color.js'));
  } else {
    root.AppState = factory(root.ColorMath);
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function (C) {
  'use strict';

  var DEFAULT_HEX = '#6366F1';

  function hslFromHex(hex) {
    return C.rgbToHsl(C.hexToRgb(hex));
  }

  function copy(state) {
    return {
      hsl: { h: state.hsl.h, s: state.hsl.s, l: state.hsl.l },
      appType: state.appType,
      harmonyId: state.harmonyId,
      mode: state.mode,
      size: state.size,
      exportFormat: state.exportFormat,
      exportThemes: state.exportThemes,
      harmonyTouched: state.harmonyTouched,
      modeTouched: state.modeTouched
    };
  }

  function create() {
    return {
      hsl: hslFromHex(DEFAULT_HEX),
      appType: 'general',
      harmonyId: 'analogous',
      mode: 'light',
      size: null,
      exportFormat: 'hex',
      exportThemes: 'light',
      harmonyTouched: false,
      modeTouched: false
    };
  }

  function hexOf(state) {
    return C.rgbToHex(C.hslToRgb(state.hsl));
  }

  function hueOf(state) {
    return state.hsl.h;
  }

  function fromHex(state, hex) {
    var norm = C.normalizeHex(hex);
    if (!norm) return null;
    var hsl = hslFromHex(norm);
    // A grey has no hue of its own. Keep the one the ring was on, so moving
    // the ring on #808080 is not immediately undone by the next render.
    if (hsl.s === 0) hsl.h = state.hsl.h;
    var next = copy(state);
    next.hsl = hsl;
    return next;
  }

  function setHue(state, deg) {
    var next = copy(state);
    var value = Number(deg);
    if (!isFinite(value)) value = state.hsl.h;
    next.hsl.h = C.wrapHue(value);
    return next;
  }

  function knownAppType(id) {
    for (var i = 0; i < C.APP_TYPES.length; i++) {
      if (C.APP_TYPES[i].id === id) return C.APP_TYPES[i];
    }
    return null;
  }

  // Choosing an app type is a suggestion, not an override: it may set the
  // harmony and the preview mode only while the user has not picked one.
  function applyAppType(state, id) {
    var type = knownAppType(id);
    if (!type) return copy(state);
    var next = copy(state);
    next.appType = type.id;
    if (!next.harmonyTouched) next.harmonyId = type.harmonyId;
    if (!next.modeTouched) next.mode = type.mode;
    return next;
  }

  function knownHarmony(id) {
    for (var i = 0; i < C.HARMONIES.length; i++) {
      if (C.HARMONIES[i].id === id) return C.HARMONIES[i];
    }
    return null;
  }

  // The URL is a shared copy of the state, so it is parsed defensively: a
  // value that fails validation is ignored and the current value stays.
  function fromQuery(state, search) {
    var params = new URLSearchParams(typeof search === 'string' ? search.replace(/^\?/, '') : '');
    var next = copy(state);

    var hex = params.get('hex');
    if (hex) {
      var parsed = fromHex(next, hex);
      if (parsed) next = parsed;
    }

    var harmony = params.get('harmony');
    if (harmony && knownHarmony(harmony)) {
      next.harmonyId = harmony;
      next.harmonyTouched = true;
    }

    var mode = params.get('mode');
    if (mode === 'light' || mode === 'dark') {
      next.mode = mode;
      next.modeTouched = true;
    }

    var type = params.get('type');
    if (type && knownAppType(type)) next = applyAppType(next, type);

    var size = params.get('size');
    if (size === 'auto') {
      next.size = null;
    } else if (size !== null) {
      var n = C.normalizeSize(size);
      if (n !== null) next.size = n;
    }

    return next;
  }

  function toQuery(state) {
    var parts = [
      'hex=' + encodeURIComponent(hexOf(state)),
      'type=' + encodeURIComponent(state.appType),
      'harmony=' + encodeURIComponent(state.harmonyId),
      'mode=' + encodeURIComponent(state.mode)
    ];
    if (state.size !== null) parts.push('size=' + state.size);
    return '?' + parts.join('&');
  }

  return {
    DEFAULT_HEX: DEFAULT_HEX,
    create: create,
    hslFromHex: hslFromHex,
    hexOf: hexOf,
    hueOf: hueOf,
    fromHex: fromHex,
    setHue: setHue,
    applyAppType: applyAppType,
    fromQuery: fromQuery,
    toQuery: toQuery
  };
}));
