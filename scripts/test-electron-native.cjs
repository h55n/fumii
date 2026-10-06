const assert = require('node:assert/strict');

assert.ok(process.versions.electron, 'must run under Electron');

const Database = require('better-sqlite3');
const db = new Database(':memory:');
try {
  assert.deepEqual(db.prepare('SELECT 42 AS answer').get(), { answer: 42 });
} finally {
  db.close();
}

const keytar = require('keytar');
assert.equal(typeof keytar.getPassword, 'function');
assert.equal(typeof keytar.setPassword, 'function');
assert.equal(typeof keytar.deletePassword, 'function');

console.log(
  `Native addon smoke test passed under Electron ${process.versions.electron} ` +
  `(Node ${process.versions.node}, ABI ${process.versions.modules}, N-API ${process.versions.napi}).`
);
