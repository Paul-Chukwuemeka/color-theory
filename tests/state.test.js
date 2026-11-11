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

test('an app type sets its own harmony and mode until the user picks one', () => {
  const base = State.create();
  const dashboard = State.applyAppType(base, 'dashboard');
  assert.strictEqual(dashboard.appType, 'dashboard');
  assert.strictEqual(dashboard.harmonyId, 'split-complementary');
  assert.strictEqual(dashboard.mode, 'dark');

  const chosenHarmony = { ...base, harmonyId: 'triadic', harmonyTouched: true };
  const kept = State.applyAppType(chosenHarmony, 'dashboard');
  assert.strictEqual(kept.harmonyId, 'triadic');
  assert.strictEqual(kept.mode, 'dark', 'an unpicked mode still follows the type');
});

test('an unknown app type is ignored', () => {
  const base = State.create();
  assert.strictEqual(State.applyAppType(base, 'nope').appType, 'general');
});

test('the query string round-trips every control', () => {
  let s = State.create();
  s = State.fromHex(s, '#F97316');
  s = State.applyAppType(s, 'fintech');
  s = { ...s, harmonyId: 'tetradic', harmonyTouched: true, mode: 'dark', modeTouched: true, size: 7 };
  const query = State.toQuery(s);
  assert.match(query, /hex=%23F97316/);
  const back = State.fromQuery(State.create(), query);
  assert.strictEqual(State.hexOf(back), '#F97316');
  assert.strictEqual(back.appType, 'fintech');
  assert.strictEqual(back.harmonyId, 'tetradic');
  assert.strictEqual(back.mode, 'dark');
  assert.strictEqual(back.size, 7);
});

test('an explicit harmony in the query wins over the app type default', () => {
  const s = State.fromQuery(State.create(), '?type=dashboard&harmony=triadic');
  assert.strictEqual(s.appType, 'dashboard');
  assert.strictEqual(s.harmonyId, 'triadic');
  assert.strictEqual(s.mode, 'dark');
});

test('junk in the query is ignored, not trusted', () => {
  const base = State.create();
  const s = State.fromQuery(base, '?hex=zzz&type=nope&harmony=nope&mode=neon&size=999');
  assert.strictEqual(State.hexOf(s), State.hexOf(base));
  assert.strictEqual(s.appType, 'general');
  assert.strictEqual(s.harmonyId, 'analogous');
  assert.strictEqual(s.mode, 'light');
  assert.strictEqual(s.size, 21);
});

test('an auto size is left out of the query and restored as auto', () => {
  const s = State.create();
  assert.ok(!State.toQuery(s).includes('size='));
  assert.strictEqual(State.fromQuery(s, '?size=auto').size, null);
});
