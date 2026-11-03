(function () {
  'use strict';

  var C = window.ColorMath;

  var PRESETS = [
    { name: 'Indigo', hex: '#6366F1' },
    { name: 'Blue', hex: '#2563EB' },
    { name: 'Sky', hex: '#0EA5E9' },
    { name: 'Teal', hex: '#14B8A6' },
    { name: 'Green', hex: '#22C55E' },
    { name: 'Lime', hex: '#84CC16' },
    { name: 'Amber', hex: '#F59E0B' },
    { name: 'Orange', hex: '#F97316' },
    { name: 'Red', hex: '#EF4444' },
    { name: 'Rose', hex: '#F43F5E' },
    { name: 'Violet', hex: '#8B5CF6' },
    { name: 'Slate', hex: '#64748B' }
  ];

  var ROLES = [
    { key: 'bg', prop: 'bg' },
    { key: 'surface', prop: 'surface' },
    { key: 'text', prop: 'text' },
    { key: 'accent', prop: 'accent' },
    { key: 'accent-2', prop: 'accent2' },
    { key: 'accent-soft', prop: 'accentSoft' }
  ];

  var state = {
    hex: '#6366F1',
    harmonyId: 'analogous',
    mode: 'light',
    exportFormat: 'hex',
    exportThemes: 'light'
  };

  var palettes = { light: null, dark: null };

  var els = {
    hexInput: document.getElementById('hex-input'),
    hexError: document.getElementById('hex-error'),
    presetGrid: document.getElementById('preset-grid'),
    harmonyList: document.getElementById('harmony-list'),
    hueRing: document.getElementById('hue-ring'),
    hueHandle: document.getElementById('hue-handle'),
    hueSlider: document.getElementById('hue-slider'),
    hueValue: document.getElementById('hue-value'),
    swatchRow: document.getElementById('swatch-row'),
    extrasRow: document.getElementById('extras-row'),
    contrastList: document.getElementById('contrast-list'),
    previewCard: document.getElementById('preview-card'),
    suggestions: document.getElementById('suggestions'),
    exportFormat: document.getElementById('export-format'),
    exportThemes: document.getElementById('export-themes'),
    exportOutput: document.getElementById('export-output'),
    copyAll: document.getElementById('copy-all'),
    themeLight: document.getElementById('theme-light'),
    themeDark: document.getElementById('theme-dark'),
    toast: document.getElementById('toast')
  };

  function activePalette() {
    return state.mode === 'light' ? palettes.light : palettes.dark;
  }

  function activeHsl() {
    return C.rgbToHsl(C.hexToRgb(state.hex));
  }

  function derive() {
    palettes.light = C.buildPalette({ hex: state.hex, harmonyId: state.harmonyId, mode: 'light' });
    palettes.dark = C.buildPalette({ hex: state.hex, harmonyId: state.harmonyId, mode: 'dark' });
  }

  function setHex(hex) {
    var norm = C.normalizeHex(hex);
    if (!norm) return false;
    state.hex = norm;
    render();
    return true;
  }

  function setHarmony(id) {
    state.harmonyId = id;
    render();
  }

  function setHue(deg) {
    var hsl = activeHsl();
    state.hex = C.rgbToHex(C.hslToRgb({
      h: C.wrapHue(Number(deg)),
      s: hsl.s,
      l: hsl.l
    }));
    render();
  }

  function setTheme(mode) {
    state.mode = mode === 'dark' ? 'dark' : 'light';
    render();
  }

  /* ---------- Static controls ---------- */

  function buildPresets() {
    PRESETS.forEach(function (preset) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'preset';
      button.dataset.hex = preset.hex;
      button.style.background = preset.hex;
      button.setAttribute('aria-label', preset.name + ' ' + preset.hex);
      button.title = preset.name + ' ' + preset.hex;
      button.addEventListener('click', function () {
        setHex(preset.hex);
      });
      els.presetGrid.appendChild(button);
    });
  }

  function buildHarmonies() {
    C.HARMONIES.forEach(function (rule) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'chip';
      button.dataset.harmony = rule.id;
      button.textContent = rule.label;
      button.setAttribute('aria-label', rule.label + ' harmony');
      button.addEventListener('click', function () {
        setHarmony(rule.id);
      });
      els.harmonyList.appendChild(button);
    });
  }

  /* ---------- Rendering ---------- */

  function render(options) {
    var opts = options || {};
    derive();

    var palette = activePalette();
    var hsl = activeHsl();
    var hue = Math.round(hsl.h) % 360;

    if (opts.syncHex !== false) {
      els.hexInput.value = state.hex;
      els.hexInput.classList.remove('is-invalid');
      els.hexInput.removeAttribute('aria-invalid');
      els.hexError.hidden = true;
    }

    renderPresetState();
    renderHarmonyState();
    renderSwatches(palette);
    renderDial(hue);
    renderContrast(palette);
    renderPreview(palette);
    renderSuggestions(hsl);
    renderExport();
    renderThemeState();
  }

  function renderPresetState() {
    Array.prototype.forEach.call(els.presetGrid.children, function (button) {
      var active = button.dataset.hex === state.hex;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function renderHarmonyState() {
    Array.prototype.forEach.call(els.harmonyList.children, function (button) {
      button.setAttribute('aria-pressed', button.dataset.harmony === state.harmonyId ? 'true' : 'false');
    });
  }

  function renderThemeState() {
    els.themeLight.classList.toggle('is-active', state.mode === 'light');
    els.themeDark.classList.toggle('is-active', state.mode === 'dark');
    els.themeLight.setAttribute('aria-pressed', state.mode === 'light' ? 'true' : 'false');
    els.themeDark.setAttribute('aria-pressed', state.mode === 'dark' ? 'true' : 'false');
  }

  function renderSwatches(palette) {
    els.swatchRow.innerHTML = '';
    ROLES.forEach(function (role) {
      var hex = palette[role.prop];
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'swatch';
      button.dataset.hex = hex;
      button.setAttribute('aria-label', 'Copy ' + role.key + ' ' + hex);

      var chip = document.createElement('span');
      chip.className = 'swatch-chip';
      chip.style.background = hex;

      var meta = document.createElement('span');
      meta.className = 'swatch-meta';

      var name = document.createElement('span');
      name.className = 'swatch-role';
      name.textContent = role.key;

      var code = document.createElement('span');
      code.className = 'swatch-hex';
      code.textContent = hex;

      meta.appendChild(name);
      meta.appendChild(code);
      button.appendChild(chip);
      button.appendChild(meta);
      els.swatchRow.appendChild(button);
    });

    els.extrasRow.innerHTML = '';
    palette.extras.forEach(function (hex, index) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'extra';
      button.dataset.hex = hex;
      button.setAttribute('aria-label', 'Copy extra-' + (index + 1) + ' ' + hex);

      var dot = document.createElement('i');
      dot.style.background = hex;

      var label = document.createElement('span');
      label.textContent = 'extra-' + (index + 1) + ' ' + hex;

      button.appendChild(dot);
      button.appendChild(label);
      els.extrasRow.appendChild(button);
    });
  }

  function renderDial(hue) {
    els.hueHandle.style.transform = 'rotate(' + hue + 'deg) translateY(-75px)';
    els.hueSlider.value = String(hue);
    if (document.activeElement !== els.hueValue) {
      els.hueValue.value = String(hue);
    }
    els.hueRing.setAttribute('aria-valuenow', String(hue));
    els.hueRing.setAttribute('aria-valuetext', hue + ' degrees, ' + C.hueName(hue));
  }

  function renderContrast(palette) {
    els.contrastList.innerHTML = '';
    palette.contrast.forEach(function (entry) {
      var row = document.createElement('li');
      row.className = 'contrast-row';

      var pair = document.createElement('span');
      pair.className = 'contrast-pair';
      var fg = document.createElement('span');
      fg.style.background = entry.fg;
      var bg = document.createElement('span');
      bg.style.background = entry.bg;
      pair.appendChild(fg);
      pair.appendChild(bg);

      var label = document.createElement('span');
      label.className = 'contrast-label';
      label.textContent = entry.label;

      var ratio = document.createElement('span');
      ratio.className = 'contrast-ratio';
      ratio.textContent = entry.ratio.toFixed(2) + ':1';

      var pill = document.createElement('span');
      pill.className = 'pill';
      if (entry.level === 'AA') pill.classList.add('is-aa');
      if (entry.level === 'fail') pill.classList.add('is-fail');
      pill.textContent = entry.level === 'fail' ? 'Fail' : entry.level;

      row.appendChild(pair);
      row.appendChild(label);
      row.appendChild(ratio);
      row.appendChild(pill);
      els.contrastList.appendChild(row);
    });
  }

  function renderPreview(palette) {
    els.previewCard.style.setProperty('--pv-bg', palette.bg);
    els.previewCard.style.setProperty('--pv-surface', palette.surface);
    els.previewCard.style.setProperty('--pv-text', palette.text);
    els.previewCard.style.setProperty('--pv-accent', palette.accent);
    els.previewCard.style.setProperty('--pv-accent2', palette.accent2);
    els.previewCard.style.setProperty('--pv-accent-soft', palette.accentSoft);
  }

  function renderSuggestions(hsl) {
    var suggestions = C.buildSuggestions(hsl);
    els.suggestions.innerHTML = '';

    suggestions.forEach(function (suggestion) {
      var mini = C.buildPalette({
        hex: suggestion.hex,
        harmonyId: suggestion.harmonyId,
        mode: state.mode
      });

      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'suggestion';
      button.setAttribute('aria-label', 'Use ' + suggestion.name + ' ' + suggestion.hex);

      var strip = document.createElement('span');
      strip.className = 'suggestion-strip';
      [mini.bg, mini.accent, mini.accent2, mini.text].forEach(function (hex) {
        var slice = document.createElement('span');
        slice.style.background = hex;
        strip.appendChild(slice);
      });

      var text = document.createElement('span');
      var name = document.createElement('span');
      name.className = 'suggestion-name';
      name.textContent = suggestion.name;
      var meta = document.createElement('span');
      meta.className = 'suggestion-meta';
      meta.textContent = suggestion.hex;
      text.appendChild(name);
      text.appendChild(document.createElement('br'));
      text.appendChild(meta);

      button.appendChild(strip);
      button.appendChild(text);
      button.addEventListener('click', function () {
        state.hex = C.normalizeHex(suggestion.hex);
        state.harmonyId = suggestion.harmonyId;
        render();
      });
      els.suggestions.appendChild(button);
    });
  }

  function renderExport() {
    els.exportOutput.textContent = C.formatExport(palettes, {
      format: state.exportFormat,
      themes: state.exportThemes
    });

    Array.prototype.forEach.call(els.exportFormat.children, function (button) {
      var active = button.dataset.format === state.exportFormat;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    Array.prototype.forEach.call(els.exportThemes.children, function (button) {
      var active = button.dataset.themes === state.exportThemes;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  /* ---------- Clipboard ---------- */

  var toastTimer = null;

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      els.toast.classList.remove('is-visible');
    }, 1600);
  }

  function fallbackCopy(text) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    area.style.left = '-1000px';
    document.body.appendChild(area);
    area.select();

    var ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (err) {
      ok = false;
    }

    document.body.removeChild(area);
    return ok;
  }

  function copyText(text, confirmation) {
    var message = confirmation || ('Copied ' + text);

    function succeed() {
      showToast(message);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(succeed, function () {
        if (fallbackCopy(text)) succeed();
      });
    } else if (fallbackCopy(text)) {
      succeed();
    }
  }

  /* ---------- Events ---------- */

  function wireInputs() {
    els.hexInput.addEventListener('input', function () {
      var norm = C.normalizeHex(els.hexInput.value);
      if (norm) {
        els.hexInput.classList.remove('is-invalid');
        els.hexError.hidden = true;
        state.hex = norm;
        render({ syncHex: false });
      } else {
        els.hexInput.classList.add('is-invalid');
        els.hexInput.setAttribute('aria-invalid', 'true');
        els.hexError.hidden = false;
      }
    });

    els.hexInput.addEventListener('blur', function () {
      els.hexInput.value = state.hex;
      els.hexInput.classList.remove('is-invalid');
      els.hexInput.removeAttribute('aria-invalid');
      els.hexError.hidden = true;
    });

    els.hueSlider.addEventListener('input', function () {
      setHue(els.hueSlider.value);
    });

    els.hueValue.addEventListener('change', function () {
      var raw = els.hueValue.value.trim();
      if (raw === '') {
        els.hueValue.value = String(Math.round(activeHsl().h));
        return;
      }
      var value = Number(raw);
      if (Number.isFinite(value)) setHue(value);
    });

    els.themeLight.addEventListener('click', function () {
      setTheme('light');
    });

    els.themeDark.addEventListener('click', function () {
      setTheme('dark');
    });

    wireRing();
    wireExport();
    wireCopy();
  }

  function wireExport() {
    Array.prototype.forEach.call(els.exportFormat.children, function (button) {
      button.addEventListener('click', function () {
        state.exportFormat = button.dataset.format === 'css' ? 'css' : 'hex';
        render();
      });
    });

    Array.prototype.forEach.call(els.exportThemes.children, function (button) {
      button.addEventListener('click', function () {
        var value = button.dataset.themes;
        state.exportThemes = value === 'dark' || value === 'both' ? value : 'light';
        render();
      });
    });
  }

  function wireCopy() {
    els.copyAll.addEventListener('click', function () {
      copyText(els.exportOutput.textContent, 'Palette copied');
    });

    els.swatchRow.addEventListener('click', function (event) {
      var button = event.target.closest('.swatch');
      if (!button) return;
      copyText(button.dataset.hex);
    });

    els.extrasRow.addEventListener('click', function (event) {
      var button = event.target.closest('.extra');
      if (!button) return;
      copyText(button.dataset.hex);
    });
  }

  function hueFromPointer(event) {
    var rect = els.hueRing.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;
    var deg = Math.atan2(event.clientY - cy, event.clientX - cx) * 180 / Math.PI + 90;
    return C.wrapHue(deg);
  }

  function wireRing() {
    var pointerId = null;

    els.hueRing.addEventListener('pointerdown', function (event) {
      pointerId = event.pointerId;
      try { els.hueRing.setPointerCapture(pointerId); } catch (err) { /* no capture */ }
      setHue(hueFromPointer(event));
      event.preventDefault();
    });

    els.hueRing.addEventListener('pointermove', function (event) {
      if (pointerId !== event.pointerId) return;
      setHue(hueFromPointer(event));
    });

    function release(event) {
      if (pointerId !== event.pointerId) return;
      pointerId = null;
      try { els.hueRing.releasePointerCapture(event.pointerId); } catch (err) { /* already released */ }
    }

    els.hueRing.addEventListener('pointerup', release);
    els.hueRing.addEventListener('pointercancel', release);

    els.hueRing.addEventListener('keydown', function (event) {
      var hue = activeHsl().h;
      var step = event.shiftKey ? 10 : 1;
      if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
        setHue(hue + step);
        event.preventDefault();
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
        setHue(hue - step);
        event.preventDefault();
      } else if (event.key === 'Home') {
        setHue(0);
        event.preventDefault();
      } else if (event.key === 'End') {
        setHue(359);
        event.preventDefault();
      }
    });
  }

  buildPresets();
  buildHarmonies();
  wireInputs();
  render();
})();
