const test = require('node:test');
const assert = require('node:assert');
const C = require('../color.js');
const Preview = require('../preview.js');

const FILL_ROLES = ['surface', 'accent', 'accent2', 'accentSoft', 'success', 'warning', 'danger'];
const KNOWN_ROLES = ['bg', 'surface', 'text', 'accent', 'accent2', 'accentSoft', 'success', 'warning', 'danger'];

function rolesIn(markup) {
  const found = new Set();
  const re = /data-role="([^"]+)"/g;
  let match;
  while ((match = re.exec(markup)) !== null) found.add(match[1]);
  return found;
}

test('every app type has a preview mockup', () => {
  for (const type of C.APP_TYPES) {
    assert.ok(Preview.ids.includes(type.id), `no mockup for ${type.id}`);
  }
  assert.strictEqual(Preview.ids.length, C.APP_TYPES.length);
});

test('every mockup paints every fill role', () => {
  for (const id of Preview.ids) {
    const roles = rolesIn(Preview.markup(id));
    for (const role of FILL_ROLES) {
      assert.ok(roles.has(role), `${id} mockup never uses ${role}`);
    }
  }
});

test('mockups only ask for roles the palette has', () => {
  for (const id of Preview.ids) {
    for (const role of rolesIn(Preview.markup(id))) {
      assert.ok(KNOWN_ROLES.includes(role), `${id} asks for unknown role ${role}`);
    }
  }
});

test('a mockup is real markup, not a placeholder', () => {
  for (const id of Preview.ids) {
    const markup = Preview.markup(id);
    assert.ok(markup.length > 300, `${id} mockup is too small`);
    assert.ok(markup.includes('class='), `${id} mockup has no classes`);
    assert.ok(!markup.includes('undefined'), `${id} mockup has an undefined value`);
    assert.ok(!markup.includes('{{'), `${id} mockup has an unresolved placeholder`);
  }
});

test('an unknown app type falls back to the general mockup', () => {
  assert.strictEqual(Preview.markup('nope'), Preview.markup('general'));
});

test('mockups are distinct from each other', () => {
  const seen = new Map();
  for (const id of Preview.ids) {
    const markup = Preview.markup(id);
    assert.ok(!seen.has(markup), `${id} duplicates ${seen.get(markup)}`);
    seen.set(markup, id);
  }
});
