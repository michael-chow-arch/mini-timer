import { Countdown, formatElapsed, formatRemaining, parseDuration, Stopwatch } from "./timer.js";

function isShortcutTarget(target) {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable;
}

function initializeTimer() {
  const shell = document.querySelector(".timer-shell");
  const timerView = document.querySelector("#timer-view");
  const display = document.querySelector("#time-display");
  const toggleButton = document.querySelector("#toggle-timer");
  const resetButton = document.querySelector("#reset-timer");
  const modeButton = document.querySelector("#timer-mode");
  const editButton = document.querySelector("#edit-duration");
  const status = document.querySelector("#timer-status");
  const form = document.querySelector("#duration-form");
  const input = document.querySelector("#duration-input");
  const error = document.querySelector("#duration-error");
  const cancelButton = document.querySelector("#cancel-duration");

  const stopwatch = new Stopwatch();
  const countdown = new Countdown();
  let mode = "stopwatch";
  let editing = false;
  const activeTimer = () => mode === "countdown" ? countdown : stopwatch;

  const render = () => {
    const isCountdown = mode === "countdown";
    const timer = activeTimer();
    const time = isCountdown ? formatRemaining(countdown.remainingMs) : formatElapsed(stopwatch.elapsedMs);
    const finished = isCountdown && countdown.isFinished;
    const running = timer.isRunning;
    display.textContent = time;
    display.classList.toggle("has-hours", time.length > 5);
    shell.classList.toggle("is-finished", finished);
    const message = finished ? "时间到" : "";
    // Announce the completion once; do not repeatedly replace live-region text.
    if (status.textContent !== message) status.textContent = message;
    toggleButton.setAttribute("aria-pressed", String(running));
    toggleButton.setAttribute("aria-label", running ? "暂停计时" : finished ? "重新开始倒计时" : "开始计时");
    toggleButton.title = running ? "暂停" : finished ? "重新开始" : "开始";
    resetButton.title = isCountdown ? "重置为设定时长" : "重置";
    const modeLabel = isCountdown ? "倒计时" : "正计时";
    if (modeButton.textContent !== modeLabel) modeButton.textContent = modeLabel;
    modeButton.setAttribute("aria-label", isCountdown ? "切换为正计时" : "切换为倒计时");
    modeButton.title = running ? "暂停后可切换模式" : "切换模式并重置计时";
    modeButton.disabled = running;
    editButton.hidden = !isCountdown;
    editButton.disabled = running;
    editButton.title = running ? "暂停后可设置时长" : "设置倒计时时长";
  };

  const toggle = () => {
    if (mode === "countdown" && countdown.isFinished) countdown.reset();
    activeTimer().toggle();
    render();
  };
  const reset = () => {
    activeTimer().reset();
    render();
  };
  const closeEditor = (focusTarget = editButton) => {
    editing = false;
    form.hidden = true;
    timerView.hidden = false;
    render();
    focusTarget.focus();
  };
  const validate = () => {
    const duration = parseDuration(input.value);
    input.setAttribute("aria-invalid", String(duration === null));
    const message = duration === null ? "请输入有效时长，如 5 或 02:30" : "";
    if (error.textContent !== message) error.textContent = message;
    return duration;
  };

  toggleButton.addEventListener("click", toggle);
  resetButton.addEventListener("click", reset);
  modeButton.addEventListener("click", () => {
    stopwatch.reset();
    countdown.reset();
    mode = mode === "stopwatch" ? "countdown" : "stopwatch";
    render();
  });
  editButton.addEventListener("click", () => {
    editing = true;
    timerView.hidden = true;
    form.hidden = false;
    input.value = countdown.durationMs % 60_000 === 0
      ? String(countdown.durationMs / 60_000)
      : formatRemaining(countdown.durationMs);
    input.setAttribute("aria-invalid", "false");
    error.textContent = "";
    input.focus();
    input.select();
  });
  input.addEventListener("input", () => {
    // Give users time to finish typing; revalidate immediately when correcting an error.
    if (input.getAttribute("aria-invalid") === "true") validate();
  });
  input.addEventListener("blur", (event) => {
    if (editing && event.relatedTarget !== cancelButton) validate();
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const duration = validate();
    if (duration === null) {
      input.focus();
      return;
    }
    countdown.setDuration(duration);
    closeEditor(toggleButton);
  });
  cancelButton.addEventListener("click", () => closeEditor());

  window.addEventListener("keydown", (event) => {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    if (editing) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeEditor();
      }
      return;
    }
    if (isShortcutTarget(event.target)) return;

    if (event.code === "Space") {
      // Let Space activate focused mode/settings buttons using native semantics.
      if (event.target instanceof HTMLButtonElement && event.target !== toggleButton && event.target !== resetButton) return;
      event.preventDefault();
      toggle();
    } else if (event.key.toLowerCase() === "r") {
      event.preventDefault();
      reset();
    } else if (event.key === "Escape") {
      event.preventDefault();
      window.miniTimer.hide();
    }
  });

  render();
  window.setInterval(render, 100);
}

document.addEventListener("DOMContentLoaded", initializeTimer, { once: true });
