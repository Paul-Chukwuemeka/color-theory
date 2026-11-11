const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const C = require('../color.js');
const Preview = require('../preview.js');

const CSS = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

const FILL_ROLES = ['surface', 'accent', 'accent2', 'accentSoft', 'success', 'warning', 'danger'];

const ROLE_VARS = {
  surface: '--pv-surface',
  accent: '--pv-accent',
  accent2: '--pv-accent2',
  accentSoft: '--pv-accent-soft',
  success: '--pv-success',
  warning: '--pv-warning',
  danger: '--pv-danger'
};

// Text made from the accents must use the readable twin, not the fill.
const TEXT_VARS = {
  accent: '--pv-accent-text',
  accent2: '--pv-accent2-text'
};

const PALETTE_KEYS = Object.keys(C.buildPalette({
  hex: '#6366F1', harmonyId: 'analogous', mode: 'light'
}));

function attributesIn(markup) {
  const roles = new Set();
  const texts = new Set();
  let match;
  const roleRe = /data-role="([^"]+)"/g;
  while ((match = roleRe.exec(markup)) !== null) roles.add(match[1]);
  const textRe = /data-text="([^"]+)"/g;
  while ((match = textRe.exec(markup)) !== null) texts.add(match[1]);
  return { roles, texts };
}

function rulesFor(kind, role) {
  const bodies = [];
  const re = new RegExp('\\[data-' + kind + '="' + role + '"\\][^{]*\\{([^}]*)\\}', 'g');
  let match;
  while ((match = re.exec(CSS)) !== null) bodies.push(match[1]);
  return bodies;
}

function rolesIn(markup) {
  return attributesIn(markup).roles;
}

test('every app type has a preview mockup', () => {
  for (const type of C.APP_TYPES) {
    assert.ok(Preview.ids.includes(type.id), `no mockup for ${type.id}`);
  }
  assert.strictEqual(Preview.ids.length, C.APP_TYPES.length);
});

test('every mockup paints every fill role', () => {
  for (const id of Preview.ids) {
    const { roles, texts } = attributesIn(Preview.markup(id));
    const used = new Set([...roles, ...texts]);
    for (const role of FILL_ROLES) {
      assert.ok(used.has(role), `${id} mockup never uses ${role}`);
    }
  }
});

test('mockups only ask for roles the palette has', () => {
  for (const id of Preview.ids) {
    const { roles, texts } = attributesIn(Preview.markup(id));
    for (const role of new Set([...roles, ...texts])) {
      assert.ok(PALETTE_KEYS.includes(role), `${id} asks for unknown role ${role}`);
    }
  }
});

test('every role a mockup asks for is painted from the palette', () => {
  for (const id of Preview.ids) {
    const { roles, texts } = attributesIn(Preview.markup(id));

    for (const role of roles) {
      const bodies = rulesFor('role', role);
      assert.ok(bodies.length > 0, `${id}: no css rule paints [data-role="${role}"]`);
      assert.ok(
        bodies.some((body) => body.includes('var(' + ROLE_VARS[role] + ')')),
        `${id}: [data-role="${role}"] is not painted with ${ROLE_VARS[role]}`
      );
      assert.ok(
        bodies.some((body) => /var\(--pv-on-/.test(body)),
        `${id}: [data-role="${role}"] has no measured label colour`
      );
    }

    for (const role of texts) {
      const bodies = rulesFor('text', role);
      const expected = TEXT_VARS[role] || ROLE_VARS[role];
      assert.ok(bodies.length > 0, `${id}: no css rule paints [data-text="${role}"]`);
      assert.ok(
        bodies.some((body) => body.includes('var(' + expected + ')')),
        `${id}: [data-text="${role}"] is not painted with ${expected}`
      );
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

test('the general mock names the semantic roles and shows interactive states', () => {
  const markup = Preview.markup('general');
  assert.match(markup, />Success</);
  assert.match(markup, />Warning</);
  assert.match(markup, />Error</);
  for (const state of ['is-hover', 'is-disabled', 'is-focus', 'mock-input is-error']) {
    assert.ok(markup.includes(state), `the general mock is missing ${state}`);
  }
});

test('mockups are distinct from each other', () => {
  const seen = new Map();
  for (const id of Preview.ids) {
    const markup = Preview.markup(id);
    assert.ok(!seen.has(markup), `${id} duplicates ${seen.get(markup)}`);
    seen.set(markup, id);
  }
});
