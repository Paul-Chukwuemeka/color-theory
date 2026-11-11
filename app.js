(function () {
  'use strict';

  var C = window.ColorMath;
  var S = window.AppState;

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

  var state = S.create();

  var palettes = { light: null, dark: null };

  var els = {
    hexInput: document.getElementById('hex-input'),
    hexError: document.getElementById('hex-error'),
    presetGrid: document.getElementById('preset-grid'),
    appTypeList: document.getElementById('app-type-list'),
    harmonyList: document.getElementById('harmony-list'),
    sizeInput: document.getElementById('size-input'),
    sizeMinus: document.getElementById('size-minus'),
    sizePlus: document.getElementById('size-plus'),
    sizeAuto: document.getElementById('size-auto'),
    sizeSummary: document.getElementById('size-summary'),
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
    return state.hsl;
  }

  function currentHex() {
    return S.hexOf(state);
  }

  function derive() {
    var hex = currentHex();
    palettes.light = C.buildPalette({
      hex: hex, harmonyId: state.harmonyId, mode: 'light', size: state.size, appType: state.appType
    });
    palettes.dark = C.buildPalette({
      hex: hex, harmonyId: state.harmonyId, mode: 'dark', size: state.size, appType: state.appType
    });
  }

  function setHex(hex) {
    var next = S.fromHex(state, hex);
    if (!next) return false;
    state = next;
    render();
    return true;
  }

  function setHarmony(id) {
    state.harmonyId = id;
    render();
  }

  function setAppType(id) {
    var type = C.appTypeById(id);
    state.appType = type.id;
    state.harmonyId = type.harmonyId;
    state.mode = type.mode;
    render();
  }

  function setSize(size) {
    state.size = C.normalizeSize(size);
    render();
  }

  function setHue(deg) {
    state = S.setHue(state, deg);
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

  function buildAppTypes() {
    C.APP_TYPES.forEach(function (type) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'chip';
      button.dataset.appType = type.id;
      button.textContent = type.label;
      button.setAttribute('aria-label', type.label + ' app type');
      button.addEventListener('click', function () {
        setAppType(type.id);
      });
      els.appTypeList.appendChild(button);
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
      els.hexInput.value = currentHex();
      els.hexInput.classList.remove('is-invalid');
      els.hexInput.removeAttribute('aria-invalid');
      els.hexError.hidden = true;
    }

    renderPresetState();
    renderAppTypeState();
    renderHarmonyState();
    renderSizeControl(palette);
    renderSwatches(palette);
    renderDial(hue);
    renderContrast(palette);
    renderPreview(palette);
    renderSuggestions(hsl);
    renderExport();
    renderThemeState();
  }

  function renderPresetState() {
    var current = currentHex();
    Array.prototype.forEach.call(els.presetGrid.children, function (button) {
      var active = button.dataset.hex === current;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function renderHarmonyState() {
    Array.prototype.forEach.call(els.harmonyList.children, function (button) {
      button.setAttribute('aria-pressed', button.dataset.harmony === state.harmonyId ? 'true' : 'false');
    });
  }

  function renderAppTypeState() {
    Array.prototype.forEach.call(els.appTypeList.children, function (button) {
      var active = button.dataset.appType === state.appType;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function renderThemeState() {
    els.themeLight.classList.toggle('is-active', state.mode === 'light');
    els.themeDark.classList.toggle('is-active', state.mode === 'dark');
    els.themeLight.setAttribute('aria-pressed', state.mode === 'light' ? 'true' : 'false');
    els.themeDark.setAttribute('aria-pressed', state.mode === 'dark' ? 'true' : 'false');
  }

  function currentCount() {
    var palette = activePalette();
    return palette.roles.length + palette.extras.length;
  }

  function renderSizeControl(palette) {
    var count = palette.roles.length + palette.extras.length;
    var extras = palette.extras.length;

    if (document.activeElement !== els.sizeInput) {
      els.sizeInput.value = String(count);
    }
    els.sizeMinus.disabled = count <= C.SIZE_MIN;
    els.sizePlus.disabled = count >= C.SIZE_MAX;
    els.sizeSummary.textContent = extras
      ? palette.roles.length + ' roles + ' + extras + (extras === 1 ? ' extra' : ' extras')
      : palette.roles.length + (palette.roles.length === 1 ? ' role' : ' roles');
    els.sizeAuto.hidden = state.size === null;
  }

  function renderSwatches(palette) {
    els.swatchRow.innerHTML = '';
    palette.roles.forEach(function (role) {
      var hex = role.hex;
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
      var ratio = C.contrastRatio(hex, palette.bg);
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'extra';
      if (ratio < 4.5) button.classList.add('is-fill-only');
      button.dataset.hex = hex;
      button.setAttribute('aria-label',
        'Copy extra-' + (index + 1) + ' ' + hex + ', ' + C.formatRatio(ratio) + ' to 1 on the background');

      var dot = document.createElement('i');
      dot.style.background = hex;

      var label = document.createElement('span');
      label.textContent = 'extra-' + (index + 1) + ' ' + hex;

      var meta = document.createElement('em');
      meta.className = 'extra-ratio';
      meta.textContent = C.formatRatio(ratio) + ':1';

      button.appendChild(dot);
      button.appendChild(label);
      button.appendChild(meta);
      if (ratio < 4.5) {
        button.title = 'Low contrast on the background — use as a fill, not text';
      }
      els.extrasRow.appendChild(button);
    });
  }

  function renderDial(hue) {
    els.hueHandle.style.setProperty('--hue-angle', hue + 'deg');
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
      if (entry.note) {
        var note = document.createElement('span');
        note.className = 'contrast-note';
        note.textContent = entry.note;
        label.appendChild(note);
      }

      var ratio = document.createElement('span');
      ratio.className = 'contrast-ratio';
      ratio.textContent = C.formatRatio(entry.ratio) + ':1';

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
    var surface = palette.surface || palette.bg;
    var accent2 = palette.accent2 || palette.accent;
    var accentSoft = palette.accentSoft || palette.accent;
    var success = palette.success || palette.accent;
    var warning = palette.warning || palette.accent;
    var danger = palette.danger || palette.accent;

    els.previewCard.style.setProperty('--pv-bg', palette.bg);
    els.previewCard.style.setProperty('--pv-surface', surface);
    els.previewCard.style.setProperty('--pv-text', palette.text);
    els.previewCard.style.setProperty('--pv-text-muted', palette.textMuted || palette.text);
    els.previewCard.style.setProperty('--pv-accent', palette.accent);
    els.previewCard.style.setProperty('--pv-accent-text', palette.accentText || palette.accent);
    els.previewCard.style.setProperty('--pv-accent2', accent2);
    els.previewCard.style.setProperty('--pv-accent2-text', palette.accent2Text || accent2);
    els.previewCard.style.setProperty('--pv-accent-soft', accentSoft);
    els.previewCard.style.setProperty('--pv-on-accent', C.pickReadable(palette.accent, '#FFFFFF'));
    // Each label colour is measured against the fill it sits on. on-accent-2
    // is the palette's own token for accent-2; on-soft and on-surface are
    // measured against the soft tint and the surface respectively.
    els.previewCard.style.setProperty('--pv-on-accent2', palette.onAccent2 || '#FFFFFF');
    els.previewCard.style.setProperty('--pv-on-soft', C.pickReadable(accentSoft, palette.text));
    els.previewCard.style.setProperty('--pv-on-surface', C.pickReadable(surface, palette.text));
    els.previewCard.style.setProperty('--pv-success', success);
    els.previewCard.style.setProperty('--pv-warning', warning);
    els.previewCard.style.setProperty('--pv-danger', danger);
    els.previewCard.style.setProperty('--pv-on-success', C.pickReadable(success, '#FFFFFF'));
    els.previewCard.style.setProperty('--pv-on-warning', C.pickReadable(warning, '#FFFFFF'));
    els.previewCard.style.setProperty('--pv-on-danger', C.pickReadable(danger, '#FFFFFF'));

    els.previewCard.innerHTML = window.Preview.markup(state.appType);

    // A role that is not in the palette cannot be painted, so the element
    // that needed it steps out of the layout instead of showing nothing.
    // Elements that carry words keep them: their colour sits in a child.
    Array.prototype.forEach.call(
      els.previewCard.querySelectorAll('[data-role], [data-text]'),
      function (element) {
        var role = element.dataset.role || element.dataset.text;
        element.hidden = !palette[role];
      }
    );
  }

  function renderSuggestions(hsl) {
    var suggestions = C.buildSuggestions(hsl);
    els.suggestions.innerHTML = '';

    suggestions.forEach(function (suggestion) {
      var mini = C.buildPalette({
        hex: suggestion.hex,
        harmonyId: suggestion.harmonyId,
        mode: state.mode,
        appType: state.appType
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
        var next = S.fromHex(state, suggestion.hex);
        if (!next) return;
        state = next;
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

  function clearHexError() {
    els.hexInput.classList.remove('is-invalid');
    els.hexInput.removeAttribute('aria-invalid');
    els.hexError.hidden = true;
  }

  function markHexError() {
    els.hexInput.classList.add('is-invalid');
    els.hexInput.setAttribute('aria-invalid', 'true');
    els.hexError.hidden = false;
  }

  // A value the user is still typing is not an error, it is simply not
  // committed yet. Only junk earns the invalid style.
  function isHexPrefix(value) {
    return value === '' || /^#?[0-9a-f]{0,6}$/i.test(value);
  }

  function commitTypedHex() {
    var norm = C.normalizeHex(els.hexInput.value);
    if (!norm) {
      markHexError();
      return false;
    }
    els.hexInput.value = norm;
    clearHexError();
    setHex(norm);
    return true;
  }

  function wireHexInput() {
    els.hexInput.addEventListener('input', function () {
      var value = els.hexInput.value.trim();
      if (C.isCompleteHex(value)) {
        var next = S.fromHex(state, value);
        if (next) {
          state = next;
          clearHexError();
          render({ syncHex: false });
        }
        return;
      }
      if (isHexPrefix(value)) {
        // Three-digit hex is valid on blur or Enter, but committing it while
        // the user is still typing turned #636 into #663366 on the way to
        // #6366F1.
        clearHexError();
        return;
      }
      markHexError();
    });

    els.hexInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        commitTypedHex();
      }
    });

    els.hexInput.addEventListener('blur', function () {
      if (!commitTypedHex()) {
        els.hexInput.value = currentHex();
        clearHexError();
      }
    });
  }

  function wireInputs() {
    wireHexInput();

    els.hueSlider.addEventListener('input', function () {
      setHue(els.hueSlider.value);
    });

    els.sizeMinus.addEventListener('click', function () {
      setSize(currentCount() - 1);
    });

    els.sizePlus.addEventListener('click', function () {
      setSize(currentCount() + 1);
    });

    els.sizeInput.addEventListener('change', function () {
      var raw = els.sizeInput.value.trim();
      if (raw === '' || !isFinite(Number(raw))) {
        els.sizeInput.value = String(currentCount());
        return;
      }
      setSize(Number(raw));
      els.sizeInput.value = String(currentCount());
    });

    els.sizeInput.addEventListener('blur', function () {
      els.sizeInput.value = String(currentCount());
    });

    els.sizeAuto.addEventListener('click', function () {
      state.size = null;
      render();
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

  buildAppTypes();
  buildPresets();
  buildHarmonies();
  wireInputs();
  render();
})();
