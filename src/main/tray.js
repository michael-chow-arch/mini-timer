import { Menu, Tray, nativeImage } from 'electron';
import { fileURLToPath } from 'node:url';

let tray = null;

function createTrayIcon() {
  const iconFileName = process.platform === 'win32' ? 'icon.ico' : 'tray-icon.png';
  const iconPath = fileURLToPath(new URL(`../../assets/${iconFileName}`, import.meta.url));
  const icon = nativeImage.createFromPath(iconPath);

  if (process.platform === 'darwin') {
    icon.setTemplateImage(true);
  }

  return icon;
}

function buildTrayMenu({ showWindow, hideWindow, isWindowVisible, quitApp }) {
  const isVisible = isWindowVisible();

  return Menu.buildFromTemplate([
    {
      label: isVisible ? '隐藏 Mini Timer' : '显示 Mini Timer',
      click: isVisible ? hideWindow : showWindow,
    },
    { type: 'separator' },
    {
      label: '退出 Mini Timer',
      click: quitApp,
    },
  ]);
}

export function createTray(actions) {
  tray = new Tray(createTrayIcon());
  tray.setToolTip('Mini Timer');
  tray.on('click', () => {
    if (actions.isWindowVisible()) {
      actions.hideWindow();
    } else {
      actions.showWindow();
    }
  });
  updateTrayMenu(actions);

  return tray;
}

export function updateTrayMenu(actions) {
  if (tray && !tray.isDestroyed()) {
    tray.setContextMenu(buildTrayMenu(actions));
  }
}

export function createApplicationMenu(actions) {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: 'Mini Timer',
      submenu: [
        {
          label: '显示 Mini Timer',
          click: actions.showWindow,
        },
        {
          label: '隐藏 Mini Timer',
          click: actions.hideWindow,
        },
        { type: 'separator' },
        {
          label: '退出 Mini Timer',
          click: actions.quitApp,
        },
      ],
    },
  ]));
}
