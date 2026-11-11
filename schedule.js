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
    var request = schedule || function (callback) {
      if (typeof requestAnimationFrame === 'function') return requestAnimationFrame(callback);
      return setTimeout(callback, 16);
    };

    return function () {
      if (pending) return;
      pending = true;
      request(function () {
        pending = false;
        run();
      });
    };
  }

  return { createBatcher: createBatcher };
}));
