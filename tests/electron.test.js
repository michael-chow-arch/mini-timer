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
