import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import electronExecutable from 'electron';
import { _electron as electron } from 'playwright';

const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

test('runs as a compact always-on-top timer window', { timeout: 30_000 }, async () => {
  const userDataPath = await mkdtemp(path.join(os.tmpdir(), 'mini-timer-test-'));
  const electronApp = await electron.launch({
    executablePath: electronExecutable,
    args: ['.'],
    env: {
      ...process.env,
      MINI_TIMER_USER_DATA_DIR: userDataPath,
    },
  });

  try {
    const window = await electronApp.firstWindow();
    await window.waitForFunction(() => window.miniTimer !== undefined);

    const nativeState = await electronApp.evaluate(({ app, BrowserWindow, nativeImage }) => {
      const timerWindow = BrowserWindow.getAllWindows()[0];
      const trayIconName = process.platform === 'win32' ? 'icon.ico' : 'tray-icon.png';
      const trayIcon = nativeImage.createFromPath(`${app.getAppPath()}/assets/${trayIconName}`);
      return {
        alwaysOnTop: timerWindow.isAlwaysOnTop(),
        bounds: timerWindow.getBounds(),
        trayIconEmpty: trayIcon.isEmpty(),
        trayIconSize: trayIcon.getSize(),
        trayIconScales: trayIcon.getScaleFactors(),
      };
    });
    assert.equal(nativeState.alwaysOnTop, true);
    assert.equal(nativeState.trayIconEmpty, false);
    assert.deepEqual(
      { width: nativeState.bounds.width, height: nativeState.bounds.height },
      { width: 260, height: 60 },
    );
    if (process.platform === 'darwin') {
      assert.deepEqual(nativeState.trayIconSize, { width: 18, height: 18 });
      assert.deepEqual(nativeState.trayIconScales, [1, 2]);
    }

    assert.equal(await window.locator('#time-display').textContent(), '00:00');
    assert.equal(await window.locator('.icon-button').count(), 2);
    assert.equal(await window.locator('button[title="关闭"]').count(), 0);
    assert.equal(
      await window.locator('.timer-shell').evaluate((element) => getComputedStyle(element).borderRadius),
      '16px',
    );

    await window.locator('#toggle-timer').click();
    assert.equal(await window.locator('#toggle-timer').getAttribute('aria-label'), '暂停计时');
    await window.locator('#toggle-timer').click();
    assert.equal(await window.locator('#toggle-timer').getAttribute('aria-label'), '开始计时');

    const toggleButton = window.locator('#toggle-timer');
    const toggleBounds = await toggleButton.boundingBox();
    const originalSymbol = await toggleButton.locator('svg').elementHandle();
    // A normal click may cross a timer refresh between mouse-down and mouse-up.
    for (const delay of [50, 120, 180, 250]) {
      const before = await toggleButton.getAttribute('aria-label');
      await window.mouse.click(
        toggleBounds.x + toggleBounds.width / 2,
        toggleBounds.y + toggleBounds.height / 2,
        { delay },
      );
      assert.notEqual(await toggleButton.getAttribute('aria-label'), before, `click with ${delay} ms between down/up`);
    }

    for (const [x, y] of [[2, 16], [30, 16], [16, 2], [16, 30]]) {
      const before = await toggleButton.getAttribute('aria-label');
      await toggleButton.click({ position: { x, y }, delay: 80 });
      assert.notEqual(await toggleButton.getAttribute('aria-label'), before, `button hit area at ${x},${y}`);
    }
    assert.equal(await originalSymbol.evaluate((symbol) => symbol.isConnected), true, 'timer updates preserve input targets');
    await originalSymbol.dispose();

    const beforeCancelledClick = await toggleButton.getAttribute('aria-label');
    await window.mouse.move(toggleBounds.x + 16, toggleBounds.y + 16);
    await window.mouse.down();
    await pause(250);
    const resetBounds = await window.locator('#reset-timer').boundingBox();
    await window.mouse.move(resetBounds.x + 16, resetBounds.y + 16);
    await window.mouse.up();
    assert.equal(await toggleButton.getAttribute('aria-label'), beforeCancelledClick, 'releasing outside does not toggle');

    await window.locator('#reset-timer').click();
    await toggleButton.click();
    await window.waitForFunction(() => document.querySelector('#time-display').textContent !== '00:00');
    await toggleButton.click();
    const pausedTime = await window.locator('#time-display').textContent();
    await pause(1100);
    assert.equal(await window.locator('#time-display').textContent(), pausedTime);
    await toggleButton.click();
    await window.waitForFunction((previous) => document.querySelector('#time-display').textContent !== previous, pausedTime);
    await toggleButton.click();

    await window.locator('#reset-timer').click();
    assert.equal(await window.locator('#time-display').textContent(), '00:00');
    await window.keyboard.press('Space');
    assert.equal(await window.locator('#toggle-timer').getAttribute('aria-label'), '暂停计时');
    await window.keyboard.press('r');
    assert.equal(await window.locator('#toggle-timer').getAttribute('aria-label'), '开始计时');
    assert.equal(await window.locator('#time-display').textContent(), '00:00');

    await window.keyboard.press('Escape');
    await pause(100);
    const isVisible = await electronApp.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].isVisible());
    assert.equal(isVisible, false);
  } finally {
    await electronApp.close();
    await rm(userDataPath, { force: true, recursive: true });
  }
});

test('configures and runs a countdown with completion feedback', { timeout: 30_000 }, async () => {
  const userDataPath = await mkdtemp(path.join(os.tmpdir(), 'mini-timer-countdown-'));
  const electronApp = await electron.launch({
    executablePath: electronExecutable,
    args: ['.'],
    env: { ...process.env, MINI_TIMER_USER_DATA_DIR: userDataPath },
  });
  try {
    const window = await electronApp.firstWindow();
    const errors = [];
    window.on('pageerror', (error) => errors.push(error.message));
    const mode = window.locator('#timer-mode');
    const edit = window.locator('#edit-duration');
    const input = window.locator('#duration-input');
    const toggle = window.locator('#toggle-timer');
    const display = window.locator('#time-display');
    const configure = async (duration) => {
      await edit.click();
      await input.fill(duration);
      await window.locator('#duration-form button[type="submit"]').click();
    };

    await mode.click();
    assert.equal(await display.textContent(), '05:00');
    await configure('00:00');
    assert.equal(await input.getAttribute('aria-invalid'), 'true');
    assert.equal(await window.locator('#duration-form').isVisible(), true);
    assert.match(await window.locator('#duration-error').textContent(), /00:01/);
    await window.keyboard.press('Escape');
    assert.equal(await window.locator('#duration-form').isVisible(), false);
    assert.equal(await display.textContent(), '05:00');
    assert.equal(await edit.evaluate((element) => element === document.activeElement), true);
    assert.equal(await electronApp.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].isVisible()), true);

    await configure('01:02:03');
    assert.equal(await display.textContent(), '01:02:03');
    assert.equal(await display.evaluate((element) => element.classList.contains('has-hours')), true);
    // The existing minimum window size must still fit the hour display and controls.
    await electronApp.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setSize(200, 48));
    await window.waitForFunction(() => innerWidth === 200);
    const fits = await window.evaluate(() => {
      const readout = document.querySelector('#time-display').getBoundingClientRect();
      const controls = document.querySelector('.controls').getBoundingClientRect();
      return readout.right <= controls.left && readout.bottom <= innerHeight && readout.left >= 0;
    });
    assert.equal(fits, true);
    await edit.click();
    await input.fill('00:03');
    await window.keyboard.press('Enter');
    assert.equal(await display.textContent(), '00:03');
    await toggle.click();
    assert.equal(await mode.isDisabled(), true);
    assert.equal(await edit.isDisabled(), true);
    await window.waitForFunction(() => document.querySelector('#time-display').textContent === '00:02');
    await toggle.click();
    const pausedTime = await display.textContent();
    await pause(1_100);
    assert.equal(await display.textContent(), pausedTime);
    await edit.click();
    await input.fill('r'); // Typing a shortcut in the editor must not reset the timer.
    await window.locator('#cancel-duration').click();
    assert.equal(await display.textContent(), pausedTime);
    await toggle.click();
    await window.waitForFunction(() => document.querySelector('#timer-status').textContent === '时间到');
    assert.equal(await display.textContent(), '00:00');
    assert.equal(await toggle.getAttribute('aria-pressed'), 'false');
    assert.equal(await toggle.getAttribute('aria-label'), '重新开始倒计时');
    assert.equal(await mode.isEnabled(), true);
    assert.equal(await edit.isEnabled(), true);
    await pause(300);
    assert.equal(await display.textContent(), '00:00');

    await toggle.click();
    assert.equal(await toggle.getAttribute('aria-pressed'), 'true');
    assert.equal(await window.locator('#timer-status').textContent(), '');
    await window.keyboard.press('r');
    assert.equal(await display.textContent(), '00:03');
    assert.equal(await toggle.getAttribute('aria-pressed'), 'false');
    await mode.click();
    assert.equal(await display.textContent(), '00:00');
    assert.equal(await edit.isVisible(), false);
    await mode.click();
    assert.equal(await display.textContent(), '00:03');

    await configure('00:01');
    await toggle.click();
    await window.keyboard.press('Escape');
    await pause(1_500);
    await electronApp.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].show());
    await window.waitForFunction(() => document.querySelector('#timer-status').textContent === '时间到');
    assert.equal(await display.textContent(), '00:00');
    await configure('00:05');
    assert.equal(await display.textContent(), '00:05');
    assert.equal(await window.locator('#timer-status').textContent(), '');
    assert.deepEqual(errors, []);
  } finally {
    await electronApp.close();
    await rm(userDataPath, { force: true, recursive: true });
  }
});
