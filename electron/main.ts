import { app, BrowserWindow, ipcMain, globalShortcut, dialog, screen } from 'electron'
import { join } from 'path'
import { appendFileSync, mkdirSync } from 'fs'

function getCrashLogPath(): string {
  // app may not be ready yet when uncaughtException fires during startup
  const dir = app?.isReady?.() ? app.getPath('userData') : (process.env.APPDATA ? join(process.env.APPDATA, 'fumii') : '.')
  try { mkdirSync(dir, { recursive: true }) } catch {}
  return join(dir, 'crash.log')
}

process.on('uncaughtException', (err) => {
  try { appendFileSync(getCrashLogPath(), `[${new Date().toISOString()}] UNCAUGHT: ${err.stack || err.message}\n`) } catch {}
})
process.on('unhandledRejection', (reason) => {
  try { appendFileSync(getCrashLogPath(), `[${new Date().toISOString()}] REJECTION: ${String(reason)}\n`) } catch {}
})

// Disable CSP warnings in DevTools (Vite requires unsafe-eval for HMR in dev)
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'
// Hardware acceleration is REQUIRED to be disabled on some Windows GPUs for transparent windows to render
// Hardware acceleration is required on Windows for transparent windows
// app.disableHardwareAcceleration()

// Single-instance lock — no duplicate fumii processes
if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

import { registerHotkeys } from './hotkey'
import { createTray } from './tray'
import { registerMemoryHandlers } from './ipc/memoryHandlers'
import { registerLLMHandlers, destroyClaudeCode } from './ipc/llmHandlers'
import { registerSettingsHandlers } from './ipc/settingsHandlers'
import { initDatabase } from '../src/memory/MemoryStore'

let spriteWindow: BrowserWindow | null = null
let dashboardWindow: BrowserWindow | null = null

const SPRITE_W_CLOSED = 280
const SPRITE_W_OPEN   = 380   // 360 chat + 20px padding
const SPRITE_H_CLOSED = 220
const SPRITE_H_OPEN   = 680

// ── Wander system ─────────────────────────────────────────────────────────
// Moves the sprite window smoothly across the work area, like lenny-lil-agents.

const WALK_SPEED_PX = 1.5     // px per tick
const WALK_TICK_MS  = 33      // ~30 fps (sufficient for slow walk animation)
const PAUSE_MIN_MS  = 2500
const PAUSE_MAX_MS  = 7000

let walkTarget:    number | null = null
let walkTimerId:   ReturnType<typeof setInterval> | null = null
let wanderPause:   ReturnType<typeof setTimeout>  | null = null
let chatOpen       = false
let isQuitting     = false
let lastWalkDir: 'left' | 'right' | 'idle' = 'idle'

function getWorkArea() {
  if (spriteWindow && !spriteWindow.isDestroyed()) {
    return screen.getDisplayMatching(spriteWindow.getBounds()).workArea
  }
  return screen.getPrimaryDisplay().workArea
}

function sendWalkDir(dir: 'left' | 'right' | 'idle') {
  if (dir === lastWalkDir) return
  lastWalkDir = dir
  spriteWindow?.webContents.send('sprite:walk-direction', dir)
}

/** Clear all wander timers and reset references to null */
function stopWander() {
  if (walkTimerId) { clearInterval(walkTimerId); walkTimerId = null }
  if (wanderPause) { clearTimeout(wanderPause);  wanderPause = null }
  walkTarget = null
  sendWalkDir('idle')
}

function scheduleNextWalk() {
  if (wanderPause) { clearTimeout(wanderPause); wanderPause = null }
  const delay = PAUSE_MIN_MS + Math.random() * (PAUSE_MAX_MS - PAUSE_MIN_MS)
  wanderPause = setTimeout(pickTarget, delay)
}

function pickTarget() {
  if (!spriteWindow || chatOpen) { scheduleNextWalk(); return }
  const wa = getWorkArea()
  const minX = wa.x + 20
  const maxX = wa.x + wa.width - SPRITE_W_CLOSED - 20
  if (maxX <= minX) return  // screen too small
  walkTarget = Math.floor(minX + Math.random() * (maxX - minX))
}

/** Clamp x so the window never leaves the visible work area */
function clampX(x: number): number {
  const wa = getWorkArea()
  const min = wa.x
  const max = wa.x + wa.width - SPRITE_W_CLOSED
  return Math.max(min, Math.min(max, x))
}

function startWander() {
  stopWander()  // always clear first to prevent stacking
  scheduleNextWalk()
  walkTimerId = setInterval(() => {
    if (!spriteWindow || chatOpen || walkTarget === null) return
    const [cx, cy] = spriteWindow.getPosition()
    const dx = walkTarget - cx
    if (Math.abs(dx) < WALK_SPEED_PX) {
      spriteWindow.setPosition(clampX(walkTarget), cy)
      walkTarget = null
      sendWalkDir('idle')
      scheduleNextWalk()
    } else {
      const step = Math.sign(dx) * WALK_SPEED_PX
      const nextX = clampX(Math.round(cx + step))
      spriteWindow.setPosition(nextX, cy)
      sendWalkDir(dx > 0 ? 'right' : 'left')
    }
  }, WALK_TICK_MS)
}

// ── Window helpers ─────────────────────────────────────────────────────────

function getSpritePos(isOpen: boolean): { x: number; y: number } {
  const wa = getWorkArea()
  const w = isOpen ? SPRITE_W_OPEN : SPRITE_W_CLOSED
  const h = isOpen ? SPRITE_H_OPEN : SPRITE_H_CLOSED
  return {
    x: wa.x + wa.width  - w - 16,
    y: wa.y + wa.height - h - 16
  }
}

function createSpriteWindow(): BrowserWindow {
  const { x, y } = getSpritePos(false)

  const win = new BrowserWindow({
    width:           SPRITE_W_CLOSED,
    height:          SPRITE_H_CLOSED,
    x,
    y,
    transparent:     true,
    backgroundColor: '#00000000',
    frame:           false,
    alwaysOnTop:     true,
    skipTaskbar:     true,
    resizable:       false,
    movable:         true,
    webPreferences: {
      preload:          join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
      sandbox:          false,
      webSecurity:      true,
      devTools:         !app.isPackaged
    }
  })

  win.setIgnoreMouseEvents(true, { forward: true })

  const devUrl = process.env['ELECTRON_RENDERER_URL']
  if (devUrl) {
    win.loadURL(`${devUrl}/public/sprite.html`)
  } else {
    win.loadFile(join(__dirname, '../renderer/public/sprite.html'))
  }

  // Force close DevTools if they were left open from a previous session,
  // because DevTools permanently resizes the window and breaks the wander bounds.
  win.webContents.once('did-finish-load', () => {
    win.webContents.closeDevTools()
  })

  win.once('ready-to-show', () => {
    win.show()
  })

  return win
}

function createDashboardWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width:           1100,
    height:          720,
    minWidth:        860,
    minHeight:       560,
    frame:           false,
    titleBarStyle:   'hidden',
    backgroundColor: '#FCFCF0',
    icon:            app.isPackaged ? join(process.resourcesPath, 'assets/sprites/fumii_icon.png') : join(__dirname, '../../src/assets/sprites/fumii_icon.png'),
    show:            true,
    webPreferences: {
      preload:          join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
      sandbox:          false,
      webSecurity:      true,
      devTools:         !app.isPackaged
    }
  })

  win.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault()
      win.hide()
    }
  })

  const devUrl = process.env['ELECTRON_RENDERER_URL']
  if (devUrl) {
    win.loadURL(`${devUrl}/public/dashboard.html`)
  } else {
    win.loadFile(join(__dirname, '../renderer/public/dashboard.html'))
  }

  return win
}

// ── App ready ──────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  // Init DB schema before any window opens
  await initDatabase()

  spriteWindow    = createSpriteWindow()
  dashboardWindow = createDashboardWindow()

  // Register IPC handlers
  registerMemoryHandlers()
  registerLLMHandlers()
  registerSettingsHandlers()

  // ── Sprite / hover IPC ─────────────────────────────────────────────────

  ipcMain.on('sprite:set-mouse-events', (_e, enabled: boolean) => {
    spriteWindow?.setIgnoreMouseEvents(!enabled, { forward: true })
  })

  ipcMain.on('chat:toggle', (_e, open: boolean) => {
    if (!spriteWindow) return
    chatOpen = open
    if (open) {
      // Snap back to home corner when chat opens, pause wander
      stopWander()
      const { x, y } = getSpritePos(true)
      spriteWindow.setBounds({ x, y, width: SPRITE_W_OPEN, height: SPRITE_H_OPEN })
      spriteWindow.setIgnoreMouseEvents(false)
    } else {
      const { x, y } = getSpritePos(false)
      spriteWindow.setBounds({ x, y, width: SPRITE_W_CLOSED, height: SPRITE_H_CLOSED })
      setTimeout(() => {
        if (spriteWindow && !spriteWindow.isDestroyed()) {
          spriteWindow.setIgnoreMouseEvents(true, { forward: true })
        }
      }, 350)
      // Resume wander after chat closes
      startWander()
    }
  })

  ipcMain.on('sprite:sleep', () => {
    if (!spriteWindow) return
    stopWander()
    spriteWindow.hide()
    // Notify dashboard of sleep state
    dashboardWindow?.webContents.send('sprite:status', 'sleeping')
  })

  ipcMain.on('sprite:wake', () => {
    if (!spriteWindow) return
    const { x, y } = getSpritePos(false)
    spriteWindow.setBounds({ x, y, width: SPRITE_W_CLOSED, height: SPRITE_H_CLOSED })
    spriteWindow.show()
    startWander()
    // Notify dashboard of wake state
    dashboardWindow?.webContents.send('sprite:status', 'awake')
  })

  // ── Dashboard IPC ──────────────────────────────────────────────────────

  ipcMain.on('dashboard:open', () => {
    dashboardWindow?.show()
    dashboardWindow?.focus()
  })

  ipcMain.on('window:minimize', () => dashboardWindow?.minimize())

  ipcMain.on('window:maximize', () => {
    if (dashboardWindow?.isMaximized()) dashboardWindow.unmaximize()
    else dashboardWindow?.maximize()
  })

  ipcMain.on('window:close', () => dashboardWindow?.hide())

  // ── Emotion broadcast ──────────────────────────────────────────────────

  ipcMain.on('emotion:update', (_e, state: string) => {
    dashboardWindow?.webContents.send('emotion:update', state)
  })

  // ── Clear memory (confirmation dialog lives in main) ───────────────────

  ipcMain.handle('memory:clear-all', async () => {
    if (!dashboardWindow || dashboardWindow.isDestroyed()) return false
    const { response } = await dialog.showMessageBox(dashboardWindow, {
      type:      'warning',
      title:     'Clear all memory',
      message:   'This will erase everything fumii remembers about you.',
      detail:    'Episodes, mood logs, transcripts, and your profile will be permanently deleted.',
      buttons:   ['Cancel', 'Clear everything'],
      defaultId: 0,
      cancelId:  0
    })

    if (response === 1) {
      const { clearAllMemory } = await import('../src/memory/MemoryStore')
      clearAllMemory()
      spriteWindow?.webContents.send('memory:cleared')
      return true
    }
    return false
  })

  // ── Tray & hotkeys ─────────────────────────────────────────────────────

  createTray(spriteWindow, dashboardWindow)
  registerHotkeys(spriteWindow, dashboardWindow)

  // Start the wander system once the sprite renderer is ready
  spriteWindow.webContents.once('did-finish-load', () => {
    startWander()
  })

  // macOS activate — show sprite if all windows are hidden
  app.on('activate', () => {
    if (!spriteWindow || spriteWindow.isDestroyed()) {
      spriteWindow = createSpriteWindow()
    } else {
      spriteWindow.show()
    }
  })
})

// Keep app alive in tray even when all windows are closed
app.on('window-all-closed', () => {
  // intentionally empty — quit only via tray → Quit
})

app.on('before-quit', () => {
  isQuitting = true
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  stopWander()
  destroyClaudeCode()
})
