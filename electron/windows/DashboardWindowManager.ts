import { BrowserWindow, app } from 'electron';
import { join } from 'path';
import { pathToFileURL } from 'node:url';
import { is } from '@electron-toolkit/utils';
import { attachWindowDiagnostics } from '../windowDiagnostics';
import { secureRendererWindow } from '../windowSecurity';

export class DashboardWindowManager {
  window: BrowserWindow | null = null;

  private create() {
    const rendererFilePath = join(__dirname, '../renderer/dashboard.html');
    const devUrl = is.dev && process.env['ELECTRON_RENDERER_URL']
      ? `${process.env['ELECTRON_RENDERER_URL'].replace(/\/+$/, '')}/dashboard.html`
      : null;
    const rendererUrl = devUrl ?? pathToFileURL(rendererFilePath).href;

    this.window = new BrowserWindow({
      title: 'fumii — Desktop Companion',
      width: 1100,
      height: 720,
      minWidth: 860,
      minHeight: 560,
      center: true,
      frame: false,
      roundedCorners: false,
      autoHideMenuBar: true,
      icon: join(app.getAppPath(), 'assets/icon.png'),
      backgroundColor: '#0F0F14',
      show: true,
      skipTaskbar: false,
      webPreferences: {
        preload: join(__dirname, '../preload/preload.js'),
        sandbox: true,
        nodeIntegration: false,
        contextIsolation: true
      }
    });
    secureRendererWindow(this.window, rendererUrl);
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

    if (devUrl) {
      this.window.loadURL(rendererUrl).catch(console.error);
    } else {
      this.window.loadFile(rendererFilePath).catch(console.error);
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
