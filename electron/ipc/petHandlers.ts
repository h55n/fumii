import { BrowserWindow, type IpcMain } from 'electron';
import { PetManager } from '../services/PetManager';

type Deps = {
  pets: PetManager;
  getSpriteWindow: () => BrowserWindow | null;
  getDashboardWindow?: () => BrowserWindow | null;
};

export function registerPetHandlers(ipcMain: IpcMain, deps: Deps) {
  const { pets, getSpriteWindow, getDashboardWindow } = deps;

  const broadcastAll = (channel: string, data: any) => {
    try {
      getSpriteWindow()?.webContents.send(channel, data);
      getDashboardWindow?.()?.webContents.send(channel, data);
      BrowserWindow.getAllWindows().forEach((win) => {
        if (!win.isDestroyed()) {
          win.webContents.send(channel, data);
        }
      });
    } catch {}
  };

  pets.watch((list) => {
    broadcastAll('pet:updated', list);
    const active = pets.getActive();
    broadcastAll('pet:activeChanged', active);
  });

  ipcMain.handle('pets:list', async () => pets.list());
  ipcMain.handle('pets:registry', async () => pets.getRegistry());
  ipcMain.handle('pets:fetchLibrary', async (_e, params: any) => {
    return pets.fetchCodexPets(params);
  });
  ipcMain.handle('pets:active', async () => {
    return pets.getActive();
  });
  ipcMain.handle('pets:setActive', async (_e, slug: string) => {
    const active = pets.setActive(slug);
    const list = pets.list();
    broadcastAll('pet:activeChanged', active);
    broadcastAll('pet:updated', list);
    return active;
  });
  ipcMain.handle('pets:install', async (_e, petData: any) => {
    const res = pets.install(petData);
    broadcastAll('pet:updated', pets.list());
    return res;
  });
  ipcMain.handle('pets:installCustom', async (_e, slugOrUrl: string) => {
    const res = await pets.installCustom(slugOrUrl);
    broadcastAll('pet:activeChanged', res);
    broadcastAll('pet:updated', pets.list());
    return res;
  });
  ipcMain.handle('pets:downloadAndInstall', async (_e, petIdentifierOrData: any) => {
    const res = await pets.downloadAndInstallPet(petIdentifierOrData);
    broadcastAll('pet:activeChanged', res);
    broadcastAll('pet:updated', pets.list());
    return res;
  });
  ipcMain.handle('pets:remove', async (_e, slug: string) => {
    pets.remove(slug);
    broadcastAll('pet:updated', pets.list());
    return true;
  });
}

