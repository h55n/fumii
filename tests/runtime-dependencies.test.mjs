import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createRequire } from 'node:module';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const require = createRequire(import.meta.url);

test('Aedes starts a local broker with the patched UUID dependency', async () => {
  const broker = require('aedes')();
  const server = createServer(broker.handle);

  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });

    const address = server.address();
    assert.ok(address && typeof address === 'object');
    assert.ok(address.port > 0);
  } finally {
    if (server.listening) {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
    await new Promise((resolve) => broker.close(resolve));
  }
});

test('chokidar watches a pet directory and closes cleanly', { timeout: 12_000 }, async () => {
  const directory = await mkdtemp(join(tmpdir(), 'fumii-chokidar-'));
  const watcher = require('chokidar').watch(directory, { depth: 1, ignoreInitial: true });

  try {
    await once(watcher, 'ready', { signal: AbortSignal.timeout(5_000) });
    const addedFile = once(watcher, 'add', { signal: AbortSignal.timeout(5_000) });
    const expectedPath = join(directory, 'pet.json');
    await writeFile(expectedPath, '{}');

    const [actualPath] = await addedFile;
    assert.equal(actualPath, expectedPath);
  } finally {
    await watcher.close();
    await rm(directory, { recursive: true, force: true });
  }
});
