const test = require('node:test');
const assert = require('node:assert');
const State = require('../state.js');

test('the state starts on the default indigo', () => {
  const s = State.create();
  assert.strictEqual(State.hexOf(s), '#6366F1');
  assert.strictEqual(State.hueOf(s), State.hslFromHex('#6366F1').h);
});

test('dragging the hue ring never drifts the hue', () => {
  let s = State.fromHex(State.create(), '#6366F1');
  const start = State.hueOf(s);
  for (let i = 0; i < 120; i++) s = State.setHue(s, State.hueOf(s) + 1);
  assert.ok(Math.abs(State.hueOf(s) - (start + 120)) < 1e-9,
    `hue drifted to ${State.hueOf(s)}`);
});

test('an achromatic base keeps the hue the ring was moved to', () => {
  let s = State.fromHex(State.create(), '#808080');
  s = State.setHue(s, 211.5);
  assert.strictEqual(State.hueOf(s), 211.5);
  assert.strictEqual(State.hexOf(s), '#808080');
});

test('a typed hex becomes the new hue and keeps the state', () => {
  const s = State.fromHex(State.create(), '#F97316');
  assert.strictEqual(State.hexOf(s), '#F97316');
  assert.strictEqual(State.hueOf(s), State.hslFromHex('#F97316').h);
  assert.strictEqual(s.appType, 'general');
});

test('an invalid hex leaves the state alone', () => {
  const s = State.create();
  assert.strictEqual(State.fromHex(s, '#12'), null);
});
