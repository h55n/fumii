import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'

let db: Database.Database

// Re-export shared types so importers only need MemoryStore
export type {
  CoreIdentity,
  Episode,
  MoodLog,
  Transcript,
  Setting,
  MoodSignal
} from './types'
import type { CoreIdentity, Episode, MoodLog, Transcript } from './types'

export async function initDatabase(): Promise<void> {
  const userDataPath = app.getPath('userData')
  const dbPath = join(userDataPath, 'fumii.db')

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS core_identity (
      id           INTEGER PRIMARY KEY,
      name         TEXT DEFAULT '',
      age_hint     TEXT DEFAULT '',
      mood_baseline TEXT DEFAULT '',
      key_context  TEXT DEFAULT '{}',
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS episodes (
      id           INTEGER PRIMARY KEY,
      summary      TEXT NOT NULL,
      tags         TEXT DEFAULT '',
      mood_signal  TEXT DEFAULT 'neutral',
      turn_count   INTEGER DEFAULT 0,
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS mood_log (
      id     INTEGER PRIMARY KEY,
      date   TEXT UNIQUE,
      signal TEXT DEFAULT 'neutral',
      source TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS transcripts (
      id         INTEGER PRIMARY KEY,
      episode_id INTEGER REFERENCES episodes(id) ON DELETE CASCADE,
      role       TEXT NOT NULL,
      content    TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT DEFAULT ''
    );

    -- Seed default identity row if missing
    INSERT OR IGNORE INTO core_identity (id, name) VALUES (1, '');

    -- Seed default settings
    INSERT OR IGNORE INTO settings (key, value) VALUES ('llm_provider', 'mistral');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('llm_model', 'mistral-small-latest');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('sprite_position', 'bottom-right');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('sprite_scale', '1.0');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('voice_enabled', 'true');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('tts_enabled', 'true');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('save_transcripts', 'true');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('hotkey_chat', 'Ctrl+Shift+F');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('chat_theme', 'midnight');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('completion_chime', 'true');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('sprite_drift', 'true');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('claude_code_path', 'claude');
  `)
}

// ── Core Identity ──────────────────────────────────────────────────────────

export function getCoreIdentity(): CoreIdentity | null {
  return db.prepare('SELECT * FROM core_identity WHERE id = 1').get() as CoreIdentity | null
}

const IDENTITY_COLUMNS = new Set(['name', 'age_hint', 'mood_baseline', 'key_context', 'updated_at'])

export function setCoreIdentity(data: Partial<CoreIdentity>): void {
  const fields = Object.keys(data)
    .filter(k => k !== 'id' && k !== 'created_at' && IDENTITY_COLUMNS.has(k))
    .map(k => `${k} = @${k}`)
    .join(', ')

  if (!fields) return // nothing valid to update

  db.prepare(`
    UPDATE core_identity SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = 1
  `).run(data)
}

// ── Episodes ───────────────────────────────────────────────────────────────

export function getEpisodes(limit = 50): Episode[] {
  return db.prepare(
    'SELECT * FROM episodes ORDER BY created_at DESC LIMIT ?'
  ).all(limit) as Episode[]
}

export function searchEpisodes(query: string): Episode[] {
  if (!query.trim()) return getEpisodes(20)
  const terms = query.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  if (terms.length === 0) return []
  const conditions = terms.map(() => `(tags LIKE ? OR summary LIKE ?)`).join(' OR ')
  const params = terms.flatMap(t => [`%${t}%`, `%${t}%`])
  return db.prepare(
    `SELECT * FROM episodes WHERE ${conditions} ORDER BY created_at DESC LIMIT 20`
  ).all(...params) as Episode[]
}

export function insertEpisode(
  summary: string,
  tags: string,
  mood_signal: string,
  turn_count: number
): number {
  const result = db.prepare(
    'INSERT INTO episodes (summary, tags, mood_signal, turn_count) VALUES (?, ?, ?, ?)'
  ).run(summary, tags, mood_signal, turn_count)
  return Number(result.lastInsertRowid)
}

export function fetchRelevantEpisodes(userMessage: string, limit = 3): Episode[] {
  const stopWords = new Set([
    'the','a','an','is','are','was','i','you','my','me','and','to','of',
    'in','on','it','that','this','was','were','be','have','had','has',
    'what','how','when','where','why','who','do','did','can','could','would'
  ])
  const keywords = userMessage
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w))

  if (keywords.length === 0) return []

  const conditions = keywords.map(() => `tags LIKE ?`).join(' OR ')
  const params = keywords.map(k => `%${k}%`)
  return db.prepare(
    `SELECT * FROM episodes WHERE ${conditions} ORDER BY created_at DESC LIMIT ?`
  ).all(...params, limit) as Episode[]
}

// ── Mood Log ───────────────────────────────────────────────────────────────

export function getMoodLog(days = 30): MoodLog[] {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceStr = since.toISOString().split('T')[0]
  return db.prepare(
    'SELECT * FROM mood_log WHERE date >= ? ORDER BY date DESC'
  ).all(sinceStr) as MoodLog[]
}

export function upsertMoodLog(signal: string, source = ''): void {
  const today = new Date().toISOString().split('T')[0]
  db.prepare(`
    INSERT INTO mood_log (date, signal, source) VALUES (?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET signal = excluded.signal, source = excluded.source
  `).run(today, signal, source)
}

export function getMoodWindow(days = 7): MoodLog[] {
  return getMoodLog(days)
}

// ── Transcripts ────────────────────────────────────────────────────────────

export function insertTranscript(
  episode_id: number,
  role: 'user' | 'assistant',
  content: string
): void {
  db.prepare(
    'INSERT INTO transcripts (episode_id, role, content) VALUES (?, ?, ?)'
  ).run(episode_id, role, content)
}

export function getTranscripts(episodeId: number): Transcript[] {
  return db.prepare(
    'SELECT * FROM transcripts WHERE episode_id = ? ORDER BY created_at ASC'
  ).all(episodeId) as Transcript[]
}

// ── Settings ───────────────────────────────────────────────────────────────

export function getSetting(key: string): string | null {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
  return row?.value ?? null
}

export function setSetting(key: string, value: string): void {
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run(key, value)
}

export function getAllSettings(): Record<string, string> {
  const rows = db.prepare('SELECT key, value FROM settings').all() as Setting[]
  return Object.fromEntries(rows.map(r => [r.key, r.value]))
}

// ── Clear All ──────────────────────────────────────────────────────────────

export function clearAllMemory(): void {
  const clearTransaction = db.transaction(() => {
    db.exec(`
      DELETE FROM transcripts;
      DELETE FROM episodes;
      DELETE FROM mood_log;
      UPDATE core_identity SET name='', age_hint='', mood_baseline='', key_context='{}', updated_at=CURRENT_TIMESTAMP WHERE id=1;
    `)
  })
  clearTransaction()
}
