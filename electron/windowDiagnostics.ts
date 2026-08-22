import { app, WebContents } from 'electron';
import { appendFileSync } from 'fs';
import { join } from 'path';

function log(message: string) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  console.log(message);
  try {
    appendFileSync(join(app.getPath('userData'), 'fumii-debug.log'), line);
  } catch {
    // Diagnostics must never interfere with window creation.
  }
}

/** Persist renderer failures because packaged apps usually have no visible DevTools. */
export function attachWindowDiagnostics(name: string, webContents: WebContents) {
  webContents.on('console-message', (_event, level, message, line, sourceId) =>
    log(`[${name}-console] [L${level}] ${message} (${sourceId}:${line})`)
  );
  webContents.on('did-fail-load', (_event, code, description, validatedURL) =>
    log(`[${name}-window] failed to load ${validatedURL}: ${code} (${description})`)
  );
  webContents.on('render-process-gone', (_event, details) =>
    log(`[${name}-window] renderer gone: ${details.reason} (${details.exitCode})`)
  );
}
