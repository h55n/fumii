import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { join } from 'path';
import { appendFileSync } from 'fs';

const logFile = join(app.getPath('userData'), 'fumii-debug.log');
function logStep(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    appendFileSync(logFile, line);
    appendFileSync(join(app.getAppPath(), 'fumii-debug.log'), line);
  } catch {}
  console.log(msg);
}

app.setName('fumii');
if (process.platform === 'win32') {
  app.setAppUserModelId('com.fumii.desktop');
}

logStep('=== FUMII STARTUP INITIATED ===');

process.on('uncaughtException', (err) => {
  logStep(`[FATAL uncaughtException] ${err?.stack || err}`);
  try { dialog.showErrorBox('fumii Fatal Error', String(err?.stack || err)); } catch {}
});

process.on('unhandledRejection', (reason) => {
  logStep(`[FATAL unhandledRejection] ${(reason as any)?.stack || reason}`);
  try { dialog.showErrorBox('fumii Rejection Error', String((reason as any)?.stack || reason)); } catch {}
});

import { SpriteWindowManager } from './windows/SpriteWindowManager';
import { DashboardWindowManager } from './windows/DashboardWindowManager';
import { setupTray, getTray } from './tray';
import { setupUpdater } from './updater';
import { registerHotkeys } from './hotkey';
import { initDb } from './db/schema';
import { LLMService } from './services/LLMService';
import { MemoryService } from './services/MemoryService';
import { PetManager } from './services/PetManager';
import { registerLLMHandlers } from './ipc/llmHandlers';
import { registerMemoryHandlers } from './ipc/memoryHandlers';
import { registerSettingsHandlers } from './ipc/settingsHandlers';
import { registerPetHandlers } from './ipc/petHandlers';
import { registerHardwareHandlers } from './ipc/hardwareHandlers';
import { registerSystemTestHandlers } from './ipc/systemTestHandlers';
import { MQTTBroker } from './services/MQTTBroker';
import { AudioStreamer } from './services/AudioStreamer';
import { WhisperService } from './services/WhisperService';
import { KokoroTTSService } from './services/KokoroTTSService';
import { EdgeTTSService } from './services/EdgeTTSService';
import { registerTTSHandlers } from './ipc/ttsHandlers';
import { getSetting } from './db/queries';

// ── Hardware Services (Always-On by default in packaged & dev mode) ──────────
const ENABLE_HARDWARE = process.env.DISABLE_HARDWARE !== '1';

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  process.exit(0);
}

let spriteManager: SpriteWindowManager;
let dashboardManager: DashboardWindowManager;

app.on('second-instance', () => {
  if (dashboardManager) {
    dashboardManager.show();
  }
  if (spriteManager) {
    if (!spriteManager.window || spriteManager.window.isDestroyed()) {
      spriteManager.create();
    } else {
      spriteManager.window.show();
      spriteManager.window.focus();
    }
  }
});

app.whenReady().then(async () => {
  try {
    logStep('[1/8] app.whenReady triggered');
    const db = initDb();
    logStep('[2/8] initDb completed');
    const llm = new LLMService();
    // Wire per-provider model resolution from settings DB
    llm.setModelResolver((provider) => getSetting(db, `${provider}_model`) ?? '');
    const memory = new MemoryService();
    const pets = new PetManager();
    await pets.ensureDefaultPet();
    logStep('[3/8] PetManager default pet ensured');

    let broker: MQTTBroker | null = null;
    let audioStreamer: AudioStreamer | null = null;
    const whisper = new WhisperService();
    const kokoro = new KokoroTTSService();
    const edgeTTS = new EdgeTTSService();

    if (ENABLE_HARDWARE) {
      broker = new MQTTBroker(1883);
      audioStreamer = new AudioStreamer(8765);
      try {
        await broker.start();
        audioStreamer.start();
        audioStreamer.on('utterance-complete', async (pcm: Buffer) => {
          try {
            const transcript = await whisper.transcribe(pcm);
            spriteManager.window?.webContents.send('device:transcribed', transcript);
          } catch (e) {
            console.warn('[whisper] transcription failed', e);
          }
        });
      } catch (e) {
        console.warn('[hardware] failed to start MQTT/audio services', e);
      }
    }

    spriteManager = new SpriteWindowManager();
    dashboardManager = new DashboardWindowManager();
    logStep('[4/8] Window managers instantiated');

    registerLLMHandlers(ipcMain, {
      llm,
      memory,
      db,
      getSpriteWindow: () => spriteManager.window,
      hardware: ENABLE_HARDWARE && audioStreamer ? { kokoro, audioStreamer } : undefined
    });
    registerMemoryHandlers(ipcMain, { memory, db });
    registerSettingsHandlers(ipcMain, { db, llm, whisper });
    registerPetHandlers(ipcMain, {
      pets,
      getSpriteWindow: () => spriteManager.window,
      getDashboardWindow: () => dashboardManager.window
    });
    const hardwareTeardown = registerHardwareHandlers(ipcMain, {
      db,
      broker,
      getSpriteWindow: () => spriteManager.window,
      getDashboardWindow: () => dashboardManager.window
    });
    registerSystemTestHandlers(ipcMain, {
      db,
      llm,
      memory,
      whisper,
      getDashboardWindow: () => dashboardManager.window
    });
    registerTTSHandlers(edgeTTS);
    logStep('[5/8] IPC handlers registered');

    // Window controls IPC
    ipcMain.on('sprite:setInteractive', (_e, interactive: boolean) =>
      spriteManager.setInteractive(interactive)
    );
    ipcMain.on('sprite:moveBy', (_e, dx: number, dy: number) => {
      spriteManager.moveBy(dx, dy);
    });
    ipcMain.on('sprite:setPosition', (_e, x: number, y: number) => {
      spriteManager.setPosition(x, y);
    });
    ipcMain.on('sprite:setState', (_e, state: string) => {
      spriteManager.window?.webContents.send('sprite:stateChanged', state);
    });
    ipcMain.on('sprite:setBehavior', (_e, behavior: string) => {
      spriteManager.window?.webContents.send('sprite:behaviorChanged', behavior);
    });
    ipcMain.on('window:showSprite', () => {
      if (!spriteManager.window || spriteManager.window.isDestroyed()) {
        spriteManager.create();
      } else {
        spriteManager.window.show();
      }
    });
    ipcMain.on('window:hideSprite', () => {
      spriteManager.window?.hide();
    });
    ipcMain.on('window:openChat', () => spriteManager.toggleChat());
    ipcMain.on('window:closeChat', () => spriteManager.toggleChat());
    ipcMain.on('window:openDashboard', () => dashboardManager.show());
    ipcMain.on('window:minimizeDashboard', () => dashboardManager.window?.minimize());
    ipcMain.on('window:maximizeDashboard', () => {
      const w = dashboardManager.window;
      if (!w) return;
      w.isMaximized() ? w.unmaximize() : w.maximize();
    });
    ipcMain.on('window:closeDashboard', () => {
      app.quit();
    });

    setupTray({
      onOpenChat: () => spriteManager.toggleChat(),
      onOpenDashboard: () => dashboardManager.show(),
      onQuit: () => app.quit()
    });
    setupUpdater(getTray);
    logStep('[6/8] setupTray & setupUpdater completed');

    registerHotkeys({
      onToggleChat: () => spriteManager.toggleChat(),
      onOpenDashboard: () => dashboardManager.show(),
      onHideSprite: () => spriteManager.window?.hide()
    });

    spriteManager.create();
    logStep('[7/8] spriteManager.create() completed');

    dashboardManager.show();
    logStep('[8/8] dashboardManager.show() completed');

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        spriteManager.create();
        dashboardManager.show();
      }
    });

    app.on('before-quit', () => {
      try {
        hardwareTeardown?.cleanup();
      } catch {}
      try {
        broker?.stop();
      } catch {}
      try {
        audioStreamer?.stop();
      } catch {}
      try {
        pets?.unwatch();
      } catch {}
    });
  } catch (err) {
    console.error('[main] Startup error in app.whenReady:', err);
    try {
      const { dialog } = require('electron');
      dialog.showErrorBox('fumii Startup Error', String(err));
    } catch {}
  }
});

app.on('window-all-closed', () => {
  app.quit();
});
