import { autoUpdater } from 'electron-updater';
import { app, Tray } from 'electron';

/**
 * setupUpdater
 * ────────────
 * Wires electron-updater (PRD Phase 3, §6 "Launch").
 *
 * - Checks for updates once on startup (60s after app ready so the main
 *   window has time to render and the user isn't immediately interrupted).
 * - If an update is found, the tray tooltip changes to alert the user.
 * - The update downloads in the background and installs on the next quit.
 *
 * Requires GH_TOKEN env var at build time and a valid `publish` config in
 * electron-builder.json. Safe to run without it — autoUpdater will log a
 * warning and exit silently; the rest of the app is unaffected.
 */
export function setupUpdater(getTray: () => Tray | null) {
  // Disable in dev — no update server to check against.
  if (!app.isPackaged) {
    console.log('[updater] skipped in dev mode');
    return;
  }

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    console.log('[updater] checking for updates...');
  });

  autoUpdater.on('update-available', (info) => {
    console.log(`[updater] update available: ${info.version}`);
    const tray = getTray();
    if (tray) {
      tray.setToolTip(`fumii — update available: v${info.version} (downloads in background)`);
    }
  });

  autoUpdater.on('update-not-available', () => {
    console.log('[updater] up to date');
  });

  autoUpdater.on('download-progress', (progress) => {
    console.log(`[updater] downloading... ${Math.round(progress.percent)}%`);
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log(`[updater] update downloaded: ${info.version} — will install on quit`);
    const tray = getTray();
    if (tray) {
      tray.setToolTip(`fumii — v${info.version} ready. Quit to update.`);
    }
  });

  autoUpdater.on('error', (err) => {
    // Non-fatal: log and move on. Common causes: no GH_TOKEN at build time,
    // no internet connection, or dev build. Never crash the app over this.
    console.warn('[updater] error (non-fatal):', err?.message ?? err);
  });

  // Defer first check — let the app finish launching before hitting the network.
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      console.warn('[updater] check failed:', err?.message ?? err);
    });
  }, 60_000);
}

/** Call to manually trigger an update check (e.g. from the tray menu). */
export function checkForUpdatesManual() {
  if (!app.isPackaged) {
    console.log('[updater] manual check skipped in dev mode');
    return;
  }
  autoUpdater.checkForUpdates().catch((err) => {
    console.warn('[updater] manual check failed:', err?.message ?? err);
  });
}
