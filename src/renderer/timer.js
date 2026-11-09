/**
 * A monotonic, elapsed-time stopwatch. Rendering may be throttled without
 * affecting its precision because elapsed time is always derived from the
 * clock instead of interval ticks.
 */
export class Stopwatch {
  #elapsedMs = 0;

  #startedAt = null;

  #now;

  constructor({ now = () => performance.now() } = {}) {
    this.#now = now;
  }

  get isRunning() {
    return this.#startedAt !== null;
  }

  get elapsedMs() {
    if (!this.isRunning) {
      return this.#elapsedMs;
    }

    return this.#elapsedMs + Math.max(0, this.#now() - this.#startedAt);
  }

  start() {
    if (!this.isRunning) {
      this.#startedAt = this.#now();
    }
  }

  pause() {
    if (this.isRunning) {
      this.#elapsedMs = this.elapsedMs;
      this.#startedAt = null;
    }
  }

  toggle() {
    if (this.isRunning) {
      this.pause();
    } else {
      this.start();
    }
  }

  reset() {
    this.#elapsedMs = 0;
    this.#startedAt = null;
  }
}

export const MAX_COUNTDOWN_MS = (99 * 3_600 + 59 * 60 + 59) * 1_000;

/** A countdown derived from the same monotonic clock as the stopwatch. */
export class Countdown {
  #durationMs;

  #stopwatch;

  constructor({ durationMs = 5 * 60_000, now } = {}) {
    this.#stopwatch = new Stopwatch({ now });
    this.setDuration(durationMs);
  }

  get durationMs() {
    return this.#durationMs;
  }

  get remainingMs() {
    return Math.max(0, this.#durationMs - this.#stopwatch.elapsedMs);
  }

  get isFinished() {
    return this.remainingMs === 0;
  }

  get isRunning() {
    return this.#stopwatch.isRunning && !this.isFinished;
  }

  setDuration(durationMs) {
    if (!Number.isInteger(durationMs) || durationMs < 1_000 || durationMs > MAX_COUNTDOWN_MS) {
      throw new RangeError("Countdown duration must be between 1 second and 99:59:59.");
    }
    this.#durationMs = durationMs;
    this.reset();
  }

  start() {
    if (!this.isFinished) this.#stopwatch.start();
  }

  pause() {
    this.#stopwatch.pause();
  }

  toggle() {
    if (this.isRunning) this.pause();
    else this.start();
  }

  reset() {
    this.#stopwatch.reset();
  }
}

/** Accept only whole minutes; reject mixed units, empty or zero durations. */
export function parseDuration(value) {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!/^\d+$/.test(text)) return null;
  const durationMs = Number(text) * 60_000;
  return durationMs > 0 && durationMs <= MAX_COUNTDOWN_MS ? durationMs : null;
}

export function formatRemaining(milliseconds) {
  // Keep 00:01 visible until the actual deadline, rather than showing zero early.
  return formatElapsed(Math.ceil(Math.max(0, milliseconds) / 1_000) * 1_000);
}

const pad = (value) => String(value).padStart(2, "0");

export function formatElapsed(milliseconds) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1_000));
  const hours = Math.floor(seconds / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`;
  }

  return `${pad(minutes)}:${pad(remainingSeconds)}`;
}
