import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Permit only the renderer document the BrowserWindow was created to load. */
export function isTrustedRendererNavigation(candidateUrl, trustedUrl) {
  try {
    const candidate = new URL(candidateUrl);
    const trusted = new URL(trustedUrl);

    if (candidate.protocol !== trusted.protocol) return false;

    if (candidate.protocol === 'file:') {
      return resolve(fileURLToPath(candidate)) === resolve(fileURLToPath(trusted));
    }

    return candidate.origin === trusted.origin && candidate.pathname === trusted.pathname;
  } catch {
    return false;
  }
}

/** Return a normalized HTTP(S) URL suitable for handing to the operating system. */
export function safeExternalHttpUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    if ((url.protocol !== 'http:' && url.protocol !== 'https:') || !url.hostname || url.username || url.password) {
      return null;
    }
    return url.href;
  } catch {
    return null;
  }
}
