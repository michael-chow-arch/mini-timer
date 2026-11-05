import test from "node:test";
import assert from "node:assert/strict";

import { formatElapsed, Stopwatch } from "../src/renderer/timer.js";
import { resolveWindowBounds } from "../src/main/window-state.js";

test("formats elapsed time as MM:SS before one hour", () => {
  assert.equal(formatElapsed(0), "00:00");
  assert.equal(formatElapsed(5_999), "00:05");
  assert.equal(formatElapsed(3_599_999), "59:59");
});

test("formats elapsed time as HH:MM:SS from one hour", () => {
  assert.equal(formatElapsed(3_600_000), "01:00:00");
  assert.equal(formatElapsed(3_932_000), "01:05:32");
});

test("does not use refresh ticks as the timing source", () => {
  let now = 100;
  const stopwatch = new Stopwatch({ now: () => now });

  stopwatch.start();
  now = 2_650;
  assert.equal(stopwatch.elapsedMs, 2_550);

  stopwatch.pause();
  now = 8_000;
  assert.equal(stopwatch.elapsedMs, 2_550);
});

test("resumes from paused time and reset stops the stopwatch", () => {
  let now = 0;
  const stopwatch = new Stopwatch({ now: () => now });

  stopwatch.start();
  now = 1_250;
  stopwatch.pause();
  now = 5_000;
  stopwatch.start();
  now = 6_750;
  assert.equal(stopwatch.elapsedMs, 3_000);

  stopwatch.reset();
  assert.equal(stopwatch.isRunning, false);
  assert.equal(stopwatch.elapsedMs, 0);
});

test("clamps a partially visible saved window fully into the active display", () => {
  const display = { workArea: { x: 0, y: 0, width: 1_440, height: 900 } };

  assert.deepEqual(
    resolveWindowBounds({ x: 1_420, y: 880, width: 260, height: 60 }, [display], display),
    { x: 1_180, y: 840, width: 260, height: 60 },
  );
});

test("uses a visible fallback position when a saved display no longer exists", () => {
  const primaryDisplay = { workArea: { x: 0, y: 0, width: 1_440, height: 900 } };

  assert.deepEqual(
    resolveWindowBounds({ x: 3_000, y: 1_000, width: 260, height: 60 }, [primaryDisplay], primaryDisplay),
    { x: 1_156, y: 24, width: 260, height: 60 },
  );
});
