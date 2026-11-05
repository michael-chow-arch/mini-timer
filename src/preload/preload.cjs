const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('miniTimer', {
  hide: () => ipcRenderer.send('mini-timer:hide'),
});
