import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';
import { isTrustedRendererNavigation, safeExternalHttpUrl } from '../electron/rendererNavigationPolicy.mjs';

test('allows the exact trusted renderer document in development', () => {
  assert.equal(
    isTrustedRendererNavigation('http://localhost:5173/dashboard.html?hot=1#home', 'http://localhost:5173/dashboard.html'),
    true
  );
});

test('rejects another path, origin, or port in development', () => {
  const trusted = 'http://localhost:5173/dashboard.html';
  assert.equal(isTrustedRendererNavigation('http://localhost:5173/other.html', trusted), false);
  assert.equal(isTrustedRendererNavigation('http://localhost:5174/dashboard.html', trusted), false);
  assert.equal(isTrustedRendererNavigation('https://localhost:5173/dashboard.html', trusted), false);
});

test('allows only the same packaged file, not a neighboring file', () => {
  const rendererDir = resolve('test-fixtures', 'renderer');
  const trusted = pathToFileURL(resolve(rendererDir, 'dashboard.html')).href;
  const sameDocumentWithFragment = `${trusted}#settings`;
  const neighboringDocument = pathToFileURL(resolve(rendererDir, 'sprite.html')).href;
  assert.equal(isTrustedRendererNavigation(sameDocumentWithFragment, trusted), true);
  assert.equal(isTrustedRendererNavigation(neighboringDocument, trusted), false);
});

test('normalizes safe external HTTP(S) links', () => {
  assert.equal(safeExternalHttpUrl('https://example.com/docs'), 'https://example.com/docs');
  assert.equal(safeExternalHttpUrl('http://example.com'), 'http://example.com/');
});

test('rejects unsafe schemes, malformed URLs, and credential-bearing URLs', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,hello', 'file:///etc/passwd', 'https://user:pass@example.com', 'not a url']) {
    assert.equal(safeExternalHttpUrl(url), null, `expected ${url} to be rejected`);
  }
});
