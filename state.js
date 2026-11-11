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

  return {
    DEFAULT_HEX: DEFAULT_HEX,
    create: create,
    hslFromHex: hslFromHex,
    hexOf: hexOf,
    hueOf: hueOf,
    fromHex: fromHex,
    setHue: setHue
  };
}));
