# Mini Timer

<img src="assets/icon.png" width="80" alt="Mini Timer logo">

[中文](README.md) · [GitHub](https://github.com/michael-chow-arch/mini-timer) · [Releases](https://github.com/michael-chow-arch/mini-timer/releases)

A free, clean floating timer for PowerPoint presentations. Track your speaking time in a small draggable window, visible to the audience, without a second display.

## Preview

![Mini Timer floating window preview](assets/preview.png)

![Mini Timer countdown preview](assets/countdown-preview.png)

## Features

- A draggable, always-on-top window; default size is `260 × 72` px and its position is remembered.
- Visible stopwatch/countdown tabs with a white background and bold text identifying the selected mode.
- Forward elapsed-time tracking with start, pause/resume, and reset.
- Countdown mode with a 5-minute default, editable duration in whole minutes, `MM:SS`, or `HH:MM:SS`, pause/resume, and reset to the configured duration.
- `MM:SS` display that switches to `HH:MM:SS` after one hour.
- Menu bar controls on macOS (the app is hidden from the Dock by default) and a system tray on Windows.
- Fully offline: no account, network service, advertising, or telemetry.
- Countdowns stop at zero and keep white digits and show a “时间到” (time's up) label, without sound or pop-ups.

## Install

### macOS 13+

Download the matching DMG from [Releases](https://github.com/michael-chow-arch/mini-timer/releases): `arm64` for Apple Silicon or `x64` for Intel Macs. Open the DMG, drag `Mini Timer.app` to Applications, then launch it there.

Use the top menu bar to show, hide, or quit the app. It does not appear in the Dock by default. Current packages are unsigned and not notarized; macOS may warn that the developer cannot be verified.

### Windows 10 / 11 (x64)

Choose a download from [Releases](https://github.com/michael-chow-arch/mini-timer/releases):

- **Portable**: download the file ending in `win-x64-portable.exe` and run it directly, without installing.
- **Installer**: download the file ending in `win-x64-setup.exe` and follow the setup wizard.

After launch, use the system tray to show, hide, or quit the app. The app is unsigned, so Windows may display a SmartScreen warning.

## Use

1. The timer starts at the upper-right of the primary screen. Drag its empty area to reposition it.
2. Select the start/pause button to control the timer; select reset to return to `00:00`.
3. Select the “倒计时” (countdown) tab, then the outlined “设置时长” (set duration) button: enter `5` for 5 minutes. Press `Enter` to save and `Space` to start, or `Esc` / “取消” to cancel. For seconds, use `02:30`; `01:30:00` also works. The range is 1 second to `99:59:59`.
4. Select the other tab at any time to stop and reset the timers. Returning to stopwatch shows `00:00`; returning to countdown restores the configured duration. Press Start to begin again. Selecting the current tab leaves timing unchanged. Pause before editing the duration; saving leaves the countdown stopped. The duration is retained for the current app session and returns to the default after quitting.
5. Shortcuts work only while the floating window is focused: `Space` start/pause, `R` reset, and `Esc` hide without quitting. With a mode tab focused, Left/Right switch tabs and Home/End select stopwatch/countdown. Space activates a focused mode/duration button. Timer shortcuts are inactive while editing the duration.
6. Use the menu bar or system tray to show the window again, or quit. Hiding does not pause the timer; completion feedback is visible when the window is shown again.

## Presentation-mode compatibility

Overlay visibility has been tested during full-screen PowerPoint playback and slide changes on macOS and Windows 11. The Windows 11 POC also verified Presenter View, Space/arrow slide navigation, and countdown completion without stealing focus. Exclusive full-screen modes and secure desktops may prevent overlays; rehearse on your actual equipment before a presentation.

## Development

Node.js 22 or newer is required. After cloning:

```bash
npm install
npm run dev
npm test
npm run check
```

Build installers on their respective operating systems:

```bash
npm run dist:mac:arm64  # Apple Silicon macOS
npm run dist:mac:x64    # Intel macOS
npm run dist:win        # Windows x64
```

## License

[MIT License](LICENSE). [Report a problem](https://github.com/michael-chow-arch/mini-timer/issues) or see [contribution guidelines](CONTRIBUTING.md).
