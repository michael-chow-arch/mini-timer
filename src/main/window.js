import { BrowserWindow, screen } from 'electron';
import { fileURLToPath } from 'node:url';
import {
  MINIMUM_WINDOW_SIZE,
  loadWindowBounds,
  resolveWindowBounds,
  saveWindowBounds,
} from './window-state.js';

const rendererEntryPath = fileURLToPath(new URL('../renderer/index.html', import.meta.url));
const preloadPath = fileURLToPath(new URL('../preload/preload.cjs', import.meta.url));

let mainWindow = null;
let persistBoundsTimer = null;
let userDataPath = null;

function persistWindowBounds() {
  if (!mainWindow || mainWindow.isDestroyed() || !userDataPath) {
    return;
  }

  saveWindowBounds(userDataPath, mainWindow.getBounds());
}

function scheduleWindowBoundsPersistence() {
  clearTimeout(persistBoundsTimer);
  persistBoundsTimer = setTimeout(() => {
    persistBoundsTimer = null;
    persistWindowBounds();
  }, 250);
}

function ensureWindowIsVisible() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  const displays = screen.getAllDisplays();

  if (displays.length === 0) {
    return;
  }

  const currentBounds = mainWindow.getBounds();
  const resolvedBounds = resolveWindowBounds(currentBounds, displays, screen.getPrimaryDisplay());
  const changed = Object.keys(resolvedBounds).some((key) => resolvedBounds[key] !== currentBounds[key]);

  if (changed) {
    mainWindow.setBounds(resolvedBounds);
    persistWindowBounds();
  }
}

export function createMainWindow({ app, onClose }) {
  userDataPath = app.getPath('userData');

  const displays = screen.getAllDisplays();
  const initialBounds = resolveWindowBounds(
    loadWindowBounds(userDataPath),
    displays,
    screen.getPrimaryDisplay(),
  );

  mainWindow = new BrowserWindow({
    ...initialBounds,
    minWidth: MINIMUM_WINDOW_SIZE.width,
    minHeight: MINIMUM_WINDOW_SIZE.height,
    frame: false,
    transparent: true,
    resizable: true,
    alwaysOnTop: true,
    acceptFirstMouse: true,
    backgroundColor: '#00000000',
    show: false,
    title: 'Mini Timer',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  const alwaysOnTopLevel = process.platform === 'darwin' ? 'screen-saver' : 'floating';
  mainWindow.setAlwaysOnTop(true, alwaysOnTopLevel);
  if (process.platform === 'darwin') {
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('move', scheduleWindowBoundsPersistence);
  mainWindow.on('resize', scheduleWindowBoundsPersistence);
  mainWindow.on('close', (event) => {
    persistWindowBounds();
    onClose(event);
  });
  mainWindow.on('closed', () => {
    clearTimeout(persistBoundsTimer);
    persistBoundsTimer = null;
    mainWindow = null;
  });

  mainWindow.loadFile(rendererEntryPath);
  return mainWindow;
}

export function getMainWindow() {
  return mainWindow;
}

export function showMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }

  mainWindow.show();
  mainWindow.focus();
}

export function hideMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  persistWindowBounds();
  mainWindow.hide();
}

export function isMainWindowVisible() {
  return Boolean(mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible());
}

export function watchDisplayChanges() {
  screen.on('display-added', ensureWindowIsVisible);
  screen.on('display-removed', ensureWindowIsVisible);
  screen.on('display-metrics-changed', ensureWindowIsVisible);
}
