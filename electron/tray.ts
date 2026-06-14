import { Tray, Menu, BrowserWindow, app, nativeImage, dialog } from 'electron'
import { join } from 'path'

/**
 * Resolve asset path correctly in both dev and production.
 * In dev: assets live at src/assets/ relative to project root.
 * In production: assets are copied to resources/assets/ by electron-builder extraResources.
 */
function assetPath(...parts: string[]): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'assets', ...parts)
  }
  return join(__dirname, '../../src/assets', ...parts)
}

export function createTray(
  spriteWindow: BrowserWindow,
  dashboardWindow: BrowserWindow
): Tray {
  let icon: Electron.NativeImage
  try {
    icon = nativeImage.createFromPath(assetPath('sprites', 'lenny-idle.png')).resize({ width: 16, height: 16 })
    if (icon.isEmpty()) icon = nativeImage.createEmpty()
  } catch {
    icon = nativeImage.createEmpty()
  }

  const tray = new Tray(icon)
  tray.setToolTip('fumii')

  const buildMenu = () => Menu.buildFromTemplate([
    {
      label: 'Show fumii',
      click: () => { spriteWindow.show(); spriteWindow.focus() }
    },
    {
      label: 'Open Dashboard',
      click: () => { dashboardWindow.show(); dashboardWindow.focus() }
    },
    { type: 'separator' },
    {
      label: 'Settings',
      click: () => {
        dashboardWindow.show()
        dashboardWindow.focus()
        dashboardWindow.webContents.send('navigate', '/settings')
      }
    },
    {
      label: 'Clear memory...',
      click: async () => {
        const { response } = await dialog.showMessageBox({
          type:      'warning',
          title:     'Clear memory',
          message:   'Erase everything fumii remembers?',
          detail:    'Deletes your profile, episodes, and mood log. Cannot be undone.',
          buttons:   ['Cancel', 'Clear everything'],
          defaultId: 0
        })
        if (response === 1) {
          const { clearAllMemory } = await import('../src/memory/MemoryStore')
          clearAllMemory()
          spriteWindow.webContents.send('memory:cleared')
          dashboardWindow.webContents.send('memory:cleared')
        }
      }
    },
    { type: 'separator' },
    {
      label: 'About fumii',
      click: () => {
        dialog.showMessageBox({
          title:   'fumii',
          message: "fumii v1.0.0\nyou're never really alone",
          detail:  'A persistent AI companion that lives on your desktop.\n\nElectron + React + TypeScript'
        })
      }
    },
    {
      label: 'Quit',
      click: () => app.exit(0)
    }
  ])

  tray.setContextMenu(buildMenu())
  tray.on('double-click', () => {
    if (spriteWindow.isVisible()) {
      dashboardWindow.show()
      dashboardWindow.focus()
    } else {
      spriteWindow.show()
    }
  })

  return tray
}
