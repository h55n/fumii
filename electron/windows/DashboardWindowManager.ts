import { BrowserWindow, app } from 'electron';
import { join } from 'path';
import { is } from '@electron-toolkit/utils';
import { attachWindowDiagnostics } from '../windowDiagnostics';

export class DashboardWindowManager {
  window: BrowserWindow | null = null;

  private create() {
    this.window = new BrowserWindow({
      title: 'fumii — Desktop Companion',
      width: 1100,
      height: 720,
      minWidth: 860,
      minHeight: 560,
      center: true,
      frame: false,
      autoHideMenuBar: true,
      icon: join(app.getAppPath(), 'assets/icon.png'),
      backgroundColor: '#0F0F14',
      show: true,
      skipTaskbar: false,
      webPreferences: {
        preload: join(__dirname, '../preload/preload.js'),
        sandbox: false,
        nodeIntegration: false,
        contextIsolation: true
      }
    });
    attachWindowDiagnostics('dashboard', this.window.webContents);

    this.window.once('ready-to-show', () => {
      if (this.window && !this.window.isDestroyed()) {
        this.window.show();
        this.window.focus();
        this.window.moveTop();
      }
    });

    this.window.webContents.on('did-finish-load', () => {
      if (this.window && !this.window.isDestroyed()) {
        this.window.show();
        this.window.focus();
      }
    });

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      this.window.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/dashboard.html`).catch(console.error);
    } else {
      this.window.loadFile(join(__dirname, '../renderer/dashboard.html')).catch(console.error);
    }

    this.window.on('closed', () => {
      this.window = null;
      app.quit();
    });
  }

  show() {
    if (!this.window || this.window.isDestroyed()) {
      this.create();
      return;
    }
    if (this.window.isMinimized()) {
      this.window.restore();
    }
    this.window.show();
    this.window.setAlwaysOnTop(true);
    this.window.center();
    this.window.focus();
    this.window.moveTop();
    setTimeout(() => {
      if (this.window && !this.window.isDestroyed()) {
        this.window.setAlwaysOnTop(false);
      }
    }, 150);
  }

  hide() {
    this.window?.hide();
  }
}
