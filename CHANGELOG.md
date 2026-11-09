# Changelog

## Unreleased

- Kept completion and validation feedback white to match the minimal timer appearance.
- Simplified duration entry: type minutes directly, then Enter and Space to start; avoid premature validation errors.
- Fixed Windows presentation overlay stacking and verified full-screen PowerPoint playback in a Windows 11 POC.

- Added countdown mode with editable duration, pause/resume, reset, and silent completion feedback.
- Added duration validation, keyboard editing, and countdown unit/Electron integration coverage.
- Repaired missing optional Windows signing dependencies in the lockfile for clean installs.

新增倒计时模式、时长设置、暂停续计、重置和安静的到时提醒，补充自动化测试并修复干净安装所需的依赖锁文件。

## 1.0.1 — 2026-11-06

- Fixed intermittent missed start/pause clicks.
- Enabled first-click controls for inactive macOS windows.
- Added a Windows portable executable; no installation required.

修复开始/暂停偶尔点击无响应，支持 macOS 窗口未激活时直接点击操作，新增 Windows 绿色免安装版。

## 1.0.0 — 2026-11-06

- Draggable, always-on-top elapsed-time window for presentations.
- Start, pause/resume, reset, and window-position persistence.
- macOS menu bar and Windows system tray controls.
- Fully offline operation, MIT license, and Chinese / English documentation.

首次开源发布：免费离线的 PPT 悬浮计时助手，支持开始、暂停、重置和位置记忆。
