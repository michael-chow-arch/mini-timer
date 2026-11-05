import { ipcMain } from 'electron';

const HIDE_CHANNEL = 'mini-timer:hide';

export function registerIpcHandlers({ getWindow, hideWindow }) {
  ipcMain.on(HIDE_CHANNEL, (event) => {
    const mainWindow = getWindow();

    if (mainWindow && event.sender === mainWindow.webContents) {
      hideWindow();
    }
  });
}
