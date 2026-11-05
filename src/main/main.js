import { app } from 'electron';
import { registerIpcHandlers } from './ipc.js';
import { createApplicationMenu, createTray, updateTrayMenu } from './tray.js';
import {
  createMainWindow,
  getMainWindow,
  hideMainWindow,
  isMainWindowVisible,
  showMainWindow,
  watchDisplayChanges,
} from './window.js';

if (process.env.MINI_TIMER_USER_DATA_DIR) {
  app.setPath('userData', process.env.MINI_TIMER_USER_DATA_DIR);
}

let isQuitting = false;

function refreshTrayMenu() {
  updateTrayMenu(windowActions);
}

function hideWindow() {
  hideMainWindow();
  refreshTrayMenu();
}

function showWindow() {
  showMainWindow();
  refreshTrayMenu();
}

function quitApp() {
  isQuitting = true;
  app.quit();
}

const windowActions = {
  hideWindow,
  isWindowVisible: isMainWindowVisible,
  quitApp,
  showWindow,
};

app.whenReady().then(() => {
  const timerWindow = createMainWindow({
    app,
    onClose(event) {
      if (!isQuitting) {
        event.preventDefault();
        hideWindow();
      }
    },
  });

  timerWindow.on('show', refreshTrayMenu);
  timerWindow.on('hide', refreshTrayMenu);

  registerIpcHandlers({
    getWindow: getMainWindow,
    hideWindow,
  });
  createTray(windowActions);
  createApplicationMenu(windowActions);
  watchDisplayChanges();

  app.on('activate', showWindow);
});

app.on('before-quit', () => {
  isQuitting = true;
});
