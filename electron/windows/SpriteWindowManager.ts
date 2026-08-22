import { app, BrowserWindow, screen } from 'electron';
import { join } from 'path';
import { is } from '@electron-toolkit/utils';
import { attachWindowDiagnostics } from '../windowDiagnostics';

const SPRITE_SIZE = { width: 300, height: 260 };
const EXPANDED_SIZE = { width: 300, height: 720 };
const MARGIN = 16;

export class SpriteWindowManager {
  window: BrowserWindow | null = null;
  private chatOpen = false;

  create() {
    if (this.window && !this.window.isDestroyed()) {
      this.window.show();
      this.window.focus();
      return;
    }

    // Close any stray or orphaned companion windows to guarantee strictly 1 companion on screen
    BrowserWindow.getAllWindows().forEach((win) => {
      if (win.getTitle() === 'fumii Companion') {
        try {
          win.destroy();
        } catch {}
      }
    });

    const display = screen.getPrimaryDisplay();
    const { x, y, width, height } = display.workArea;
    const winX = x + width - SPRITE_SIZE.width - MARGIN;
    const winY = y + height - SPRITE_SIZE.height - MARGIN;

    this.window = new BrowserWindow({
      title: 'fumii Companion',
      width: SPRITE_SIZE.width,
      height: SPRITE_SIZE.height,
      x: winX,
      y: winY,
      transparent: true,
      frame: false,
      resizable: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      hasShadow: false,
      show: true,
      backgroundColor: '#00000000',
      icon: join(app.getAppPath(), 'assets/icon.png'),
      webPreferences: {
        preload: join(__dirname, '../preload/preload.js'),
        sandbox: false,
        nodeIntegration: false,
        contextIsolation: true
      }
    });
    attachWindowDiagnostics('sprite', this.window.webContents);

    this.window.setAlwaysOnTop(true, 'floating');
    this.window.setVisibleOnAllWorkspaces(true);

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      this.window.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/sprite.html`).catch(console.error);
    } else {
      this.window.loadFile(join(__dirname, '../renderer/sprite.html')).catch(console.error);
    }

    this.window.once('ready-to-show', () => {
      this.window?.show();
    });

    this.window.on('closed', () => {
      this.window = null;
    });

    this.window.webContents.on('did-finish-load', () => {
      this.window?.show();
      // By default, ignore mouse events on transparent background so everything behind is clickable
      this.window?.setIgnoreMouseEvents(true, { forward: true });
      this.window?.webContents.send('sprite:ready');
    });
  }

  setInteractive(interactive: boolean) {
    if (this.window && !this.window.isDestroyed()) {
      // When interactive (hovering pet or chat open), capture mouse clicks; otherwise click through
      const shouldIgnore = !interactive && !this.chatOpen;
      this.window.setIgnoreMouseEvents(shouldIgnore, { forward: true });
    }
  }

  moveBy(deltaX: number, deltaY: number) {
    if (!this.window || this.window.isDestroyed()) return;
    const [currX, currY] = this.window.getPosition();
    this.window.setPosition(Math.round(currX + deltaX), Math.round(currY + deltaY));
  }

  setPosition(x: number, y: number) {
    if (!this.window || this.window.isDestroyed()) return;
    this.window.setPosition(Math.round(x), Math.round(y));
  }

  toggleChat() {
    if (!this.window || this.window.isDestroyed()) return this.create();
    this.chatOpen = !this.chatOpen;
    const { width } = this.window.getBounds();
    const display = screen.getPrimaryDisplay();
    const { y, height } = display.workArea;
    const targetHeight = this.chatOpen ? EXPANDED_SIZE.height : SPRITE_SIZE.height;
    const winY = y + height - targetHeight - MARGIN;

    this.window.setBounds(
      { x: this.window.getBounds().x, y: winY, width, height: targetHeight },
      false
    );

    // Keep window interactive while chat is open
    this.setInteractive(this.chatOpen);
    this.window.webContents.send('chat:toggled', this.chatOpen);
  }
}

