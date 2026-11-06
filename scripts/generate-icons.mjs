import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Requires librsvg's rsvg-convert; macOS also generates ICNS with iconutil.
const assets = fileURLToPath(new URL('../assets/', import.meta.url));
const temporaryDirectory = mkdtempSync(path.join(os.tmpdir(), 'mini-timer-icons-'));

function render(source, size, destination) {
  execFileSync('rsvg-convert', ['-w', String(size), '-h', String(size),
    path.join(assets, source), '-o', destination]);
}

try {
  render('icon.svg', 512, path.join(assets, 'icon.png'));
  render('tray-icon.svg', 18, path.join(assets, 'tray-icon.png'));
  render('tray-icon.svg', 36, path.join(assets, 'tray-icon@2x.png'));

  const sizes = [16, 24, 32, 48, 64, 128, 256];
  const images = sizes.map((size) => {
    const destination = path.join(temporaryDirectory, `windows-${size}.png`);
    render('icon.svg', size, destination);
    return readFileSync(destination);
  });
  const header = Buffer.alloc(6 + sizes.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  let imageOffset = header.length;
  sizes.forEach((size, index) => {
    const entry = 6 + index * 16;
    header[entry] = size === 256 ? 0 : size;
    header[entry + 1] = header[entry];
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(images[index].length, entry + 8);
    header.writeUInt32LE(imageOffset, entry + 12);
    imageOffset += images[index].length;
  });
  writeFileSync(path.join(assets, 'icon.ico'), Buffer.concat([header, ...images]));

  if (process.platform === 'darwin') {
    const iconset = path.join(temporaryDirectory, 'MiniTimer.iconset');
    mkdirSync(iconset);
    for (const size of [16, 32, 128, 256, 512]) {
      render('icon.svg', size, path.join(iconset, `icon_${size}x${size}.png`));
      render('icon.svg', size * 2, path.join(iconset, `icon_${size}x${size}@2x.png`));
    }
    execFileSync('iconutil', ['-c', 'icns', iconset, '-o', path.join(assets, 'icon.icns')]);
  }
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
