import { globalShortcut, BrowserWindow } from 'electron'

export function registerHotkeys(
  spriteWindow: BrowserWindow,
  dashboardWindow: BrowserWindow
): void {
  // Ctrl+Shift+F — toggle chat overlay
  globalShortcut.register('CommandOrControl+Shift+F', () => {
    spriteWindow.webContents.send('hotkey:toggle-chat')
  })

  // Ctrl+Shift+D — open dashboard
  globalShortcut.register('CommandOrControl+Shift+D', () => {
    dashboardWindow.show()
    dashboardWindow.focus()
  })

  // Ctrl+Shift+H — hide/show sprite window
  globalShortcut.register('CommandOrControl+Shift+H', () => {
    if (spriteWindow.isVisible()) {
      spriteWindow.hide()
    } else {
      spriteWindow.show()
    }
  })
}

export function unregisterAll(): void {
  globalShortcut.unregisterAll()
}
