import fs from 'node:fs';
import path from 'node:path';

const STATE_FILE_NAME = 'window-state.json';

export const DEFAULT_WINDOW_BOUNDS = Object.freeze({
  width: 260,
  height: 60,
});

export const MINIMUM_WINDOW_SIZE = Object.freeze({
  width: 200,
  height: 48,
});

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function getStateFilePath(userDataPath) {
  return path.join(userDataPath, STATE_FILE_NAME);
}

function normaliseBounds(value) {
  if (!value || !isFiniteNumber(value.x) || !isFiniteNumber(value.y)) {
    return null;
  }

  const width = isFiniteNumber(value.width)
    ? Math.max(MINIMUM_WINDOW_SIZE.width, Math.round(value.width))
    : DEFAULT_WINDOW_BOUNDS.width;
  const height = isFiniteNumber(value.height)
    ? Math.max(MINIMUM_WINDOW_SIZE.height, Math.round(value.height))
    : DEFAULT_WINDOW_BOUNDS.height;

  return {
    x: Math.round(value.x),
    y: Math.round(value.y),
    width,
    height,
  };
}

function overlapsWorkArea(bounds, workArea) {
  const overlapWidth = Math.min(bounds.x + bounds.width, workArea.x + workArea.width) - Math.max(bounds.x, workArea.x);
  const overlapHeight = Math.min(bounds.y + bounds.height, workArea.y + workArea.height) - Math.max(bounds.y, workArea.y);

  return overlapWidth > 0 && overlapHeight > 0;
}

function clampToWorkArea(bounds, workArea) {
  const width = Math.min(bounds.width, workArea.width);
  const height = Math.min(bounds.height, workArea.height);
  const maximumX = workArea.x + workArea.width - width;
  const maximumY = workArea.y + workArea.height - height;

  return {
    width,
    height,
    x: Math.min(Math.max(bounds.x, workArea.x), maximumX),
    y: Math.min(Math.max(bounds.y, workArea.y), maximumY),
  };
}

export function loadWindowBounds(userDataPath) {
  try {
    const savedState = JSON.parse(fs.readFileSync(getStateFilePath(userDataPath), 'utf8'));
    return normaliseBounds(savedState.bounds);
  } catch {
    return null;
  }
}

export function saveWindowBounds(userDataPath, bounds) {
  const normalisedBounds = normaliseBounds(bounds);

  if (!normalisedBounds) {
    return;
  }

  try {
    fs.mkdirSync(userDataPath, { recursive: true });
    fs.writeFileSync(getStateFilePath(userDataPath), `${JSON.stringify({ bounds: normalisedBounds }, null, 2)}\n`, 'utf8');
  } catch {
    // The timer remains usable even when the operating system prevents state persistence.
  }
}

export function getFallbackWindowBounds(display) {
  const { workArea } = display;
  const margin = 24;

  return {
    width: DEFAULT_WINDOW_BOUNDS.width,
    height: DEFAULT_WINDOW_BOUNDS.height,
    x: Math.max(workArea.x, workArea.x + workArea.width - DEFAULT_WINDOW_BOUNDS.width - margin),
    y: Math.max(workArea.y, workArea.y + margin),
  };
}

export function resolveWindowBounds(savedBounds, displays, primaryDisplay) {
  const normalisedBounds = normaliseBounds(savedBounds);

  const visibleDisplay = normalisedBounds
    ? displays.find((display) => overlapsWorkArea(normalisedBounds, display.workArea))
    : null;

  if (normalisedBounds && visibleDisplay) {
    return clampToWorkArea(normalisedBounds, visibleDisplay.workArea);
  }

  return getFallbackWindowBounds(primaryDisplay);
}

export function isWindowVisibleOnAnyDisplay(bounds, displays) {
  const normalisedBounds = normaliseBounds(bounds);

  return Boolean(normalisedBounds && displays.some((display) => overlapsWorkArea(normalisedBounds, display.workArea)));
}
