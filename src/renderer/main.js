import { formatElapsed, Stopwatch } from "./timer.js";

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

  const renderElapsed = () => {
    const elapsed = formatElapsed(stopwatch.elapsedMs);
    display.textContent = elapsed;
    display.classList.toggle("has-hours", elapsed.length > 5);
  };

  const render = () => {
    renderElapsed();
    const running = stopwatch.isRunning;
    toggleButton.setAttribute("aria-pressed", String(running));
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
  window.setInterval(renderElapsed, 200);
}

document.addEventListener("DOMContentLoaded", initializeTimer, { once: true });
