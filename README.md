# Mini Timer

一个用于演讲、会议汇报和培训演示的极简全局悬浮正向计时器。它离线运行，将计时器保持在普通应用窗口之上，并尽可能覆盖 PowerPoint、WPS、Keynote 和 PDF 阅读器的演示画面。

## 功能

- 深色半透明、无标题栏的 260 × 60 px 悬浮窗
- 始终置顶，可通过空白区域拖动；按钮区域不会触发拖动
- 精确的正向计时：以 `performance.now()` 的单调时钟为基准，不以 `setInterval` 累加时间
- 开始 / 暂停、重置；`Space`、`R`、`Esc` 分别控制开始暂停、重置、隐藏（计时器窗口获得焦点时）
- 记住窗口位置；多显示器变化后会自动将窗口移回可见区域
- Windows 托盘图标和 macOS 菜单栏图标均提供显示 / 隐藏与退出菜单
- `contextIsolation` 已开启，`nodeIntegration` 已关闭，无网络服务和遥测依赖

## 运行与打包

环境要求：Node.js 22 或更高版本。

```bash
npm install
npm run dev
```

常用校验与构建命令：

```bash
npm test
npm run check
npm run build             # 构建当前平台的未打包目录
npm run dist              # 在 macOS 构建 x64 和 arm64 DMG
npm run dist:win          # 在 Windows 构建 x64 NSIS 安装程序
```

首次启动时计时器会出现于主屏幕右上角。窗口空白处可拖动；关闭浮窗请使用系统托盘/菜单栏图标中的“退出 Mini Timer”。

## 全屏演示说明

Mini Timer 在 macOS 使用 `setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })` 和较高的窗口层级；Windows 使用 Electron 的 always-on-top 窗口层级。这覆盖 PowerPoint、WPS 等常见“幻灯片放映”窗口模式的最佳努力场景。

操作系统的独占全屏、受保护内容、安全桌面（如 Windows UAC）或会议软件的特殊全屏模式可以拒绝其他应用绘制在其上方，因此无法承诺在这些场景中显示。请在正式演讲所用的设备和投影模式上先试放一次。

## 项目结构

```text
src/
├── main/       Electron 主进程：窗口、位置持久化、托盘和 IPC
├── preload/    最小化、安全的 IPC 桥接
└── renderer/   无框悬浮 UI 与计时逻辑
tests/          基于 Node 的计时逻辑单元测试
assets/         应用与托盘图标源文件
```

## 构建说明

`electron-builder` 配置在 `electron-builder.yml` 中。macOS 的 x64 与 arm64 DMG 可在 macOS 构建；Windows NSIS 安装程序应在 Windows 环境构建。发布版签名和公证需要各平台对应的开发者证书，未配置证书时构建出的包会是未签名包。
