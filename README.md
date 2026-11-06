# Mini Timer

<img src="assets/icon.png" width="80" alt="Mini Timer logo">

[English](README.en.md) · [GitHub](https://github.com/michael-chow-arch/mini-timer) · [Releases](https://github.com/michael-chow-arch/mini-timer/releases)

免费、纯净的 PPT 悬浮计时助手。无需扩展屏幕，用一个可拖动的小窗查看演讲用时，观众也能看到。

## 预览

![Mini Timer 悬浮窗预览](assets/preview.png)

深色半透明悬浮条；仅显示时间、开始/暂停和重置两个图标。

## 功能

- 默认 `260 × 60` px，可拖动、始终置顶，并记住上次窗口位置。
- 正向计时，基于单调时钟计算；开始、暂停后续计，重置归零。
- `MM:SS` 显示，超过一小时自动切换为 `HH:MM:SS`。
- macOS 从菜单栏操作（应用默认不显示在 Dock）；Windows 从系统托盘操作。
- 完全离线：无需注册、无需网络服务，不含广告或遥测。
- 当前版本为正向计时，不含倒计时或超时提醒。

## 安装

### macOS 13+

在 [Releases](https://github.com/michael-chow-arch/mini-timer/releases) 下载与芯片匹配的 DMG：Apple Silicon 选择 `arm64`，Intel 选择 `x64`。打开 DMG 后将 `Mini Timer.app` 拖到「应用程序」文件夹，再从中启动。

启动后，屏幕顶部菜单栏的单色小秒表是显示、隐藏或退出应用的入口。应用默认不会出现在 Dock 中。当前安装包未做开发者签名或 Apple 公证，macOS 可能提示无法验证开发者。

### Windows 10 / 11（x64）

从 [Releases](https://github.com/michael-chow-arch/mini-timer/releases) 下载以 `win-x64-setup.exe` 结尾的安装程序，按向导安装。启动后可从通知区域的系统托盘图标显示、隐藏或退出。当前安装程序未签名，Windows 可能显示 SmartScreen 提示。

## 使用

1. 启动后，计时器默认出现在主屏幕右上角；拖动空白区域可移动它。
2. 点击圆形播放/暂停图标控制计时，点击回转箭头重置为 `00:00`。
3. 只有悬浮窗获得焦点时，快捷键才生效：`Space` 开始/暂停，`R` 重置，`Esc` 隐藏窗口但不退出应用。
4. 通过菜单栏或系统托盘可再次显示窗口，或彻底退出应用。

## 演示模式兼容性

macOS 和 Windows 均通过自动化测试与安装包构建。已在 macOS 的 PowerPoint 全屏播放和翻页时验证悬浮显示；Windows 的实际放映场景尚未验证。独占全屏、安全桌面等特殊模式可能阻止窗口覆盖，正式演讲前请在实际设备上试放。

## 开发

需要 Node.js 22 或更高版本。克隆后运行：

```bash
npm install
npm run dev
npm test
npm run check
```

在对应操作系统构建安装包：

```bash
npm run dist:mac:arm64  # Apple Silicon macOS
npm run dist:mac:x64    # Intel macOS
npm run dist:win        # Windows x64（待实机验证）
```

应用图标为蓝白秒表。修改 `assets/icon.svg` 或 `assets/tray-icon.svg` 后执行 `node scripts/generate-icons.mjs` 重新生成平台图标；该脚本需要 `rsvg-convert`，在 macOS 上还需要系统自带的 `iconutil`。

## 许可证

[MIT License](LICENSE)。欢迎 [反馈问题](https://github.com/michael-chow-arch/mini-timer/issues) 和 [参与贡献](CONTRIBUTING.md)。
