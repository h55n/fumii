# Changelog

All notable changes to the `fumii` project, from initialization to the current release, are documented here.

## [v1.0.5] - 2026-06-19 (Current Release)
### Features & Redesign
- **Dark Mode Overhaul:** Redesigned the entire dashboard interface to a premium dark theme. Replaced flat styling with deep `#0D0F14` backgrounds, glassmorphism, and subtle layout borders.
- **Enhanced Sidebar:** Upgraded sidebar items with crisp SVG icons (replacing unicode characters), dynamic active pill indicators, and a vibrant violet-to-pink gradient wordmark.
- **Premium Agent Controls:** Revamped the Lenny Wake/Sleep panel using structured pill buttons, hover state transitions, and a pulsating status dot.

### Bug Fixes
- **Fatal GPU Crash:** Resolved an issue where transparent windows caused the application to instantly crash (Exception `0x80000003`) by appending surgical Chromium switches (`--disable-gpu-sandbox`, `--disable-software-rasterizer`, `--no-sandbox`) without breaking transparency.
- **Native ABI Mismatch:** Fixed a critical bug causing silent failures during the NSIS installer launch by forcing `@electron/rebuild` to synchronize `better-sqlite3` and `keytar` native modules to `NODE_MODULE_VERSION 121` (Electron 29.4.6).

## [v1.0.4] - 2026-06-16
- **App Icon:** Fixed an issue where the Windows installer and application used the default Electron icon. Implemented a sharp-based multi-resolution `icon.ico` generator during the build pipeline and wired it into `electron-builder`.
- **Agent Controls:** Fixed a sidebar layout flex overflow issue that caused the "agent" (Lenny) controls at the bottom of the dashboard to be pushed off-screen and rendered invisible on smaller window sizes.
- **Chat Continuity:** Prevented chat history from clearing completely every time the chat window is toggled. Chat memory now correctly persists throughout an application session. Added an explicit "Clear Chat" button to the chat header for user-initiated resets.
- **Markdown Rendering:** Fixed a `marked.js` configuration issue that caused the LLM's assistant messages to render as `[object Promise]` instead of formatted HTML.

## [v1.0.3] - 2026-06-14
### Initialization & Architecture
- **Project Setup:** Initialized the codebase using `electron-vite` (React + TypeScript).
- **Core Architecture:** Set up a dual-window system: a transparent, frameless, click-through window for the desktop sprite, and a standard framed window for the main dashboard.

### Features
- **Desktop Sprite (Lenny):** Built an autonomous desktop companion that wanders the screen using custom physics and bounding box logic. Includes idle and walking animations.
- **Interactive Dashboard:** Created a React-based UI featuring tabs for Chat, Memory, and Settings.
- **LLM Integration:** Integrated the Mistral AI API for conversational capabilities and intelligent responses.
- **Memory System:** Implemented a persistent local SQLite database (`better-sqlite3`) to store chat history, contextual memory, and user configurations securely (`keytar`).
- **System Tray:** Added a native Windows system tray icon with context menus for quick actions (Wake, Sleep, Dashboard, Quit).

### Bug Fixes & Polish
- **UI & Branding:** Converted the provided `fumii.svg` logo into native production `.ico`/`.png` assets, replacing the default Electron icons across the app, taskbar, and installers.
- **Sprite Rendering (Windows 11):** Patched a native Electron bug where transparent windows drop their rendering layer by injecting a `#00000000` background and explicitly awaiting the `ready-to-show` event.
- **Hardware Acceleration:** Removed `disableHardwareAcceleration` overrides that caused GPU process crashes (exit code 34) on certain Windows configurations.
- **Multi-Monitor Support:** Fixed an issue where the sprite would teleport off-screen by dynamically clamping coordinates to `screen.getDisplayMatching()`.
- **Ghost Processes:** Updated local `LAUNCH.bat` scripts to automatically run `taskkill` sweeps, preventing invisible `electron.exe` instances from locking the app's startup sequence.

### Deployment
- **Packaging:** Configured `electron-builder` to generate one-click NSIS installers for Windows (`.exe`).
- **GitHub Releases:** Automated the build and deployment process to push full executable releases (`v1.0.0` through `v1.0.3`) directly to the GitHub repository.
