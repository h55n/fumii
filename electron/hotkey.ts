import { globalShortcut, app } from 'electron';

export function registerHotkeys(handlers: {
  onToggleChat: () => void;
  onOpenDashboard: () => void;
  onHideSprite: () => void;
}) {
  app.whenReady().then(() => {
    globalShortcut.register('CommandOrControl+Shift+F', handlers.onToggleChat);
    globalShortcut.register('CommandOrControl+Shift+D', handlers.onOpenDashboard);
    globalShortcut.register('CommandOrControl+Shift+H', handlers.onHideSprite);
  });

  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });
}
