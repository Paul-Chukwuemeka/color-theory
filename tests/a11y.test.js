const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const HTML = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const APP = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const CSS = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

test('the decorative preview is hidden from assistive tech and summarised in text', () => {
  assert.match(HTML, /<div id="preview-card"[^>]*aria-hidden="true"/);
  assert.match(HTML, /<p id="preview-summary" class="sr-only"><\/p>/);
  assert.match(APP, /previewSummary\.textContent\s*=/);
  assert.match(APP, /previewSummary:/);
});

test('no text is smaller than 11px', () => {
  const sizes = [...CSS.matchAll(/font-size:\s*([\d.]+)px/g)].map((m) => Number(m[1]));
  assert.ok(sizes.length > 0);
  const small = sizes.filter((size) => size < 11);
  assert.deepStrictEqual(small, [], `font sizes below 11px: ${small.join(', ')}`);
});

test('interactive controls clear a 24px target, and 32px on phones', () => {
  for (const selector of ['.chip', '.segmented button', '.extra', '.link-btn']) {
    const block = CSS.match(new RegExp('\\' + selector + '\\s*\\{[^}]*\\}', 'g')) || [];
    assert.ok(
      block.some((body) => /min-height:\s*24px/.test(body)),
      `${selector} has no 24px minimum`
    );
  }
  const phone = CSS.match(/@media \(max-width: 520px\) \{[\s\S]*?\n\}/);
  assert.ok(phone, 'no phone media query');
  for (const selector of ['.chip', '.segmented button', '.extra', '.link-btn']) {
    const rule = new RegExp('\\' + selector + '\\s*\\{[^}]*min-height:\\s*32px[^}]*\\}');
    assert.match(phone[0], rule, `${selector} is not 32px on phones`);
  }
});
