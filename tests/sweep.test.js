const test = require('node:test');
const assert = require('node:assert');
const C = require('../color.js');

const BASES = ['#808080', '#FEF9C3', '#0B0D14', '#FFFFFF', '#000000', '#6366F1', '#22C55E', '#EF4444'];
const MODES = ['light', 'dark'];
const SIZES = [null, 3, 5, 9, 12, 21];

function hueOf(hex) {
  return C.rgbToHsl(C.hexToRgb(hex)).h;
}

function gap(a, b) {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
}

test('the whole matrix keeps every promise', () => {
  const failures = [];

  function fail(where, message) {
    failures.push(where + ': ' + message);
  }

  for (const type of C.APP_TYPES) {
    for (const harmony of C.HARMONIES) {
      for (const hex of BASES) {
        for (const mode of MODES) {
          for (const size of SIZES) {
            const where = [type.id, harmony.id, hex, mode, size === null ? 'auto' : size].join(' / ');
            const p = C.buildPalette({
              hex, harmonyId: harmony.id, mode, appType: type.id, size
            });

            // Extras are unique colours and never repeat the accent.
            const extras = new Set(p.extras);
            if (extras.size !== p.extras.length) {
              fail(where, 'duplicate extras: ' + p.extras.join(' '));
            }
            if (p.extras.includes(p.accent)) fail(where, 'an extra repeats the accent');

            // The accent-2 promise, where a partner exists and the base has a hue.
            const accentHsl = C.rgbToHsl(C.hexToRgb(p.accent));
            if (harmony.partner !== null && accentHsl.s >= 0.1 && p.accent2) {
              const separation = gap(hueOf(p.accent2), accentHsl.h);
              if (separation < 57) {
                fail(where, 'accent-2 is ' + separation.toFixed(1) + ' from accent');
              }
            }

            // Text roles and text-safe twins clear their floor.
            const textFloor = type.textRatio;
            if (C.contrastRatio(p.text, p.bg) < textFloor) {
              fail(where, 'text/bg ' + C.formatRatio(C.contrastRatio(p.text, p.bg)));
            }
            if (p.surface && C.contrastRatio(p.text, p.surface) < textFloor) {
              fail(where, 'text/surface ' + C.formatRatio(C.contrastRatio(p.text, p.surface)));
            }
            if (p.textMuted) {
              if (C.contrastRatio(p.textMuted, p.bg) < textFloor) {
                fail(where, 'text-muted/bg ' + C.formatRatio(C.contrastRatio(p.textMuted, p.bg)));
              }
              if (p.surface && C.contrastRatio(p.textMuted, p.surface) < textFloor) {
                fail(where, 'text-muted/surface ' + C.formatRatio(C.contrastRatio(p.textMuted, p.surface)));
              }
            }
            if (p.accentText && C.contrastRatio(p.accentText, p.bg) < 4.5) {
              fail(where, 'accent-text ' + C.formatRatio(C.contrastRatio(p.accentText, p.bg)));
            }
            if (p.accent2Text && C.contrastRatio(p.accent2Text, p.bg) < 4.5) {
              fail(where, 'accent-2-text ' + C.formatRatio(C.contrastRatio(p.accent2Text, p.bg)));
            }

            // Every contrast row that is meant to be text must pass AA.
            for (const row of p.contrast) {
              if (/-bg$/.test(row.key) && row.ratio < 4.5) {
                fail(where, row.key + ' ' + C.formatRatio(row.ratio));
              }
              if (/^on-/.test(row.key) && row.ratio < 4.5) {
                fail(where, row.key + ' label ' + C.formatRatio(row.ratio));
              }
            }
          }
        }
      }
    }
  }

  if (failures.length) {
    const shown = failures.slice(0, 40).join('\n');
    assert.fail(failures.length + ' failures\n' + shown +
      (failures.length > 40 ? '\n...' : ''));
  }
});
