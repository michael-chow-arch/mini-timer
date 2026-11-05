import { formatElapsed, Stopwatch } from "./timer.js";

const playIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.4" />
    <path d="m10 8 6 4-6 4Z" fill="currentColor" />
  </svg>`;

const pauseIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.4" />
    <path d="M9 8h2.4v8H9zm3.6 0H15v8h-2.4z" fill="currentColor" />
  </svg>`;

const resetIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M4.8 9.5A8 8 0 1 1 5 15.3" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2.4" />
    <path d="M4.8 4.8v4.7h4.7" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.4" />
  </svg>`;

function isShortcutTarget(target) {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable;
}

function initializeTimer() {
  const display = document.querySelector("#time-display");
  const toggleButton = document.querySelector("#toggle-timer");
  const resetButton = document.querySelector("#reset-timer");

  if (!(display instanceof HTMLElement) || !(toggleButton instanceof HTMLButtonElement) || !(resetButton instanceof HTMLButtonElement)) {
    throw new Error("Mini Timer UI could not be initialized.");
  }

  const stopwatch = new Stopwatch();

  const render = () => {
    const elapsed = formatElapsed(stopwatch.elapsedMs);
    display.textContent = elapsed;
    display.classList.toggle("has-hours", elapsed.length > 5);
    const running = stopwatch.isRunning;
    toggleButton.innerHTML = running ? pauseIcon : playIcon;
    toggleButton.setAttribute("aria-label", running ? "暂停计时" : "开始计时");
    toggleButton.title = running ? "暂停" : "开始";
  };

  const toggle = () => {
    stopwatch.toggle();
    render();
  };

  toggleButton.addEventListener("click", toggle);
  resetButton.addEventListener("click", () => {
    stopwatch.reset();
    render();
  });

  window.addEventListener("keydown", (event) => {
    if (event.repeat || isShortcutTarget(event.target)) {
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();
      toggle();
    } else if (event.key.toLowerCase() === "r") {
      event.preventDefault();
      stopwatch.reset();
      render();
    } else if (event.key === "Escape") {
      event.preventDefault();
      window.miniTimer.hide();
    }
  });

  render();
  window.setInterval(render, 200);
}

document.addEventListener("DOMContentLoaded", initializeTimer, { once: true });
