/*
 * One render per frame.
 *
 * A pointer drag on the hue ring fires dozens of input events per second.
 * Rendering each one does the same work several times over, so calls are
 * coalesced: the first call books a frame, the rest join it.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Schedule = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function createBatcher(run, schedule) {
    var pending = false;
    var payload = null;
    var request = schedule || function (callback) {
      if (typeof requestAnimationFrame === 'function') return requestAnimationFrame(callback);
      return setTimeout(callback, 16);
    };

    return function (options) {
      // The last call in a frame wins: a caller that changes the state after
      // another caller asked for something special must not inherit it.
      payload = options === undefined ? null : options;
      if (pending) return;
      pending = true;
      request(function () {
        pending = false;
        var next = payload;
        payload = null;
        run(next);
      });
    };
  }

  return { createBatcher: createBatcher };
}));
