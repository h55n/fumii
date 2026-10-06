import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);

test('better-sqlite3 loads and executes a query', () => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');

  try {
    assert.deepEqual(db.prepare('SELECT 42 AS answer').get(), { answer: 42 });
  } finally {
    db.close();
  }
});

test('keytar native addon loads without accessing the credential store', () => {
  const keytar = require('keytar');

  assert.equal(typeof keytar.getPassword, 'function');
  assert.equal(typeof keytar.setPassword, 'function');
  assert.equal(typeof keytar.deletePassword, 'function');
});
