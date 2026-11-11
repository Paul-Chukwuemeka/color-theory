const test = require('node:test');
const assert = require('node:assert');
const Schedule = require('../schedule.js');

function manualScheduler() {
  const queue = [];
  return {
    schedule: (fn) => queue.push(fn),
    flush: () => {
      const run = queue.splice(0);
      run.forEach((fn) => fn());
      return run.length;
    },
    size: () => queue.length
  };
}

test('many calls in one frame run the render once', () => {
  const sched = manualScheduler();
  let runs = 0;
  const batch = Schedule.createBatcher(() => { runs += 1; }, sched.schedule);

  batch();
  batch();
  batch();
  assert.strictEqual(runs, 0, 'nothing runs before the frame');
  assert.strictEqual(sched.size(), 1, 'only one frame is requested');
  sched.flush();
  assert.strictEqual(runs, 1);
});

test('a later change after a frame schedules a new render', () => {
  const sched = manualScheduler();
  let runs = 0;
  const batch = Schedule.createBatcher(() => { runs += 1; }, sched.schedule);

  batch();
  sched.flush();
  batch();
  sched.flush();
  assert.strictEqual(runs, 2);
});

test('the last call in a frame decides the options the render sees', () => {
  const sched = manualScheduler();
  let seen = null;
  const batch = Schedule.createBatcher((options) => { seen = options; }, sched.schedule);

  batch({ syncHex: false });
  batch({});
  sched.flush();
  assert.deepStrictEqual(seen, {}, 'the later plain render must not inherit syncHex: false');

  batch({ syncHex: false });
  sched.flush();
  assert.deepStrictEqual(seen, { syncHex: false }, 'a render that asked not to sync keeps its ask');
});
