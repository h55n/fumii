import { shell, type BrowserWindow } from 'electron';
import { isTrustedRendererNavigation, safeExternalHttpUrl } from './rendererNavigationPolicy.mjs';

function openExternalSafely(rawUrl: string) {
  const safeUrl = safeExternalHttpUrl(rawUrl);
  if (!safeUrl) return;

  void shell.openExternal(safeUrl).catch((error) => {
    console.warn('[window-security] failed to open external URL:', error);
  });
}

/** Keep privileged preload APIs bound to the expected local renderer document. */
export function secureRendererWindow(window: BrowserWindow, trustedUrl: string) {
  const { webContents } = window;

  webContents.on('will-navigate', (event, url) => {
    if (isTrustedRendererNavigation(url, trustedUrl)) return;
    event.preventDefault();
    openExternalSafely(url);
  });

  webContents.on('will-redirect', (event, url) => {
    if (!isTrustedRendererNavigation(url, trustedUrl)) event.preventDefault();
  });

  webContents.setWindowOpenHandler(({ url }) => {
    openExternalSafely(url);
    return { action: 'deny' };
  });
}
