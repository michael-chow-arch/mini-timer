import test from "node:test";
import assert from "node:assert/strict";

import { Countdown, formatElapsed, formatRemaining, MAX_COUNTDOWN_MS, parseDuration, Stopwatch } from "../src/renderer/timer.js";
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

test("countdown uses the clock, pauses, resumes, and stops exactly at zero", () => {
  let now = 100;
  const timer = new Countdown({ durationMs: 5_000, now: () => now });
  assert.equal(timer.remainingMs, 5_000);
  assert.equal(timer.isRunning, false);
  assert.equal(timer.isFinished, false);
  timer.start();
  now = 1_350;
  timer.start(); // Starting twice must not move the deadline.
  assert.equal(timer.remainingMs, 3_750);
  timer.pause();
  now = 20_000;
  assert.equal(timer.remainingMs, 3_750);
  timer.toggle();
  now = 23_749;
  assert.equal(timer.remainingMs, 1);
  assert.equal(timer.isRunning, true);
  assert.equal(formatRemaining(timer.remainingMs), "00:01");
  now = 23_750;
  assert.equal(timer.remainingMs, 0);
  assert.equal(timer.isFinished, true);
  assert.equal(timer.isRunning, false);
  now = 100_000; // A delayed refresh must never produce negative time.
  timer.start();
  assert.equal(timer.remainingMs, 0);
  assert.equal(timer.isRunning, false);
  timer.reset();
  assert.equal(timer.remainingMs, 5_000);
  assert.equal(timer.isFinished, false);
  assert.equal(timer.isRunning, false);
  timer.start();
  now += 1_000;
  assert.equal(timer.remainingMs, 4_000);
});

test("changing duration resets and stops a running or completed countdown", () => {
  let now = 0;
  const timer = new Countdown({ durationMs: 2_000, now: () => now });
  timer.start();
  now = 1_000;
  timer.setDuration(3_600_000);
  assert.equal(timer.durationMs, 3_600_000);
  assert.equal(timer.remainingMs, 3_600_000);
  assert.equal(timer.isRunning, false);
  timer.start();
  now += 3_600_000;
  assert.equal(timer.isFinished, true);
  timer.setDuration(1_000);
  assert.equal(timer.isFinished, false);
  assert.equal(timer.remainingMs, 1_000);
});

test("invalid durations leave the existing countdown intact", () => {
  const timer = new Countdown({ durationMs: 5_000, now: () => 0 });
  timer.start();
  for (const value of [0, -1, 999, 1_000.5, NaN, Infinity, "5000", MAX_COUNTDOWN_MS + 1]) {
    assert.throws(() => timer.setDuration(value), RangeError);
    assert.equal(timer.durationMs, 5_000);
    assert.equal(timer.isRunning, true);
  }
  assert.throws(() => new Countdown({ durationMs: 0 }), RangeError);
});

test("parses minute and hour durations including boundaries", () => {
  for (const [text, expected] of [
    ["00:01", 1_000], ["5:00", 300_000], [" 05:30 ", 330_000],
    ["90:00", 5_400_000], ["1:00:00", 3_600_000], ["99:59:59", MAX_COUNTDOWN_MS],
  ]) assert.equal(parseDuration(text), expected, text);
});

test("rejects zero, incomplete, nonnumeric and out-of-range input", () => {
  for (const value of ["", " ", "0", "00:00", "00:00:00", "1:2", "1.5:00", "-1:00", "+1:00",
    "00:60", "01:60:00", "100:00:00", "01:02:03:04", "1e2:00", "ab:cd", null, 60]) {
    assert.equal(parseDuration(value), null, String(value));
  }
});

test("remaining time rounds up and keeps the correct hour boundary", () => {
  for (const [milliseconds, expected] of [
    [-1, "00:00"], [0, "00:00"], [1, "00:01"], [999, "00:01"], [1_000, "00:01"],
    [1_001, "00:02"], [3_599_001, "01:00:00"], [3_599_000, "59:59"], [MAX_COUNTDOWN_MS, "99:59:59"],
  ]) assert.equal(formatRemaining(milliseconds), expected);
});
