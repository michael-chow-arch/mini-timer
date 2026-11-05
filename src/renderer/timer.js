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
