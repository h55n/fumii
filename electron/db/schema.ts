import Database from 'better-sqlite3';
import { app } from 'electron';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

let db: Database.Database;

export function initDb(): Database.Database {
  const dir = app?.getPath ? app.getPath('userData') : '.';
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const dbPath = join(dir, 'fumii.db');

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS mood_log (
      id     INTEGER PRIMARY KEY AUTOINCREMENT,
      date   TEXT    NOT NULL UNIQUE,
      signal TEXT    NOT NULL DEFAULT 'neutral'
                     CHECK (signal IN ('stressed','happy','tired','neutral','excited')),
      source TEXT    NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ended_at   DATETIME,
      mode       TEXT NOT NULL DEFAULT 'companion'
                      CHECK (mode IN ('companion', 'assistant')),
      turn_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS transcripts (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      role       TEXT    NOT NULL CHECK (role IN ('user', 'assistant')),
      content    TEXT    NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Provenance tracking: counts how many times each memory ID has been
    -- cited in an assembled LLM prompt. Keyed by memory ID (string from
    -- MemoryService). ON CONFLICT updates citation count & last-used timestamp.
    CREATE TABLE IF NOT EXISTS memory_interactions (
      memory_id    TEXT     PRIMARY KEY,
      cite_count   INTEGER  NOT NULL DEFAULT 0,
      first_cited  DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_cited   DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const defaults: [string, string][] = [
    ['active_mode', 'companion'],
    ['llm_provider', 'ollama'],
    ['llm_model', 'qwen2.5:1.5b'],
    ['active_pet', 'fumii-default'],
    ['sprite_position', 'bottom-right'],
    ['sprite_scale', '1.0'],
    ['tts_enabled', 'true'],
    ['tts_in_assistant', 'false'],
    ['save_transcripts', 'true'],
    ['voice_input', 'true'],
    ['hotkey_chat', 'CommandOrControl+Shift+F'],
    ['hotkey_dashboard', 'CommandOrControl+Shift+D'],
    ['hotkey_hide', 'CommandOrControl+Shift+H'],
    ['device_mqtt_port', '1883'],
    ['device_ws_port', '8765'],
    ['desktop_id', require('crypto').randomUUID()],
    ['paired_device_id', ''],
    ['paired_token', '']
  ];

  const insert = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  const tx = db.transaction((rows: [string, string][]) => {
    for (const [k, v] of rows) insert.run(k, v);
  });
  tx(defaults);

  return db;
}

export function getDb(): Database.Database {
  if (!db) throw new Error('DB not initialized — call initDb() first');
  return db;
}
