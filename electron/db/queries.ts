import type Database from 'better-sqlite3';

export type MoodSignal = 'stressed' | 'happy' | 'tired' | 'neutral' | 'excited';
export type MoodEntry = { id: number; date: string; signal: MoodSignal; source: string };
export type Session = {
  id: number;
  started_at: string;
  ended_at: string | null;
  mode: 'companion' | 'assistant';
  turn_count: number;
};
export type Transcript = { id: number; session_id: number; role: 'user' | 'assistant'; content: string; created_at: string };

export function getSetting(db: Database.Database, key: string): string | null {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setSetting(db: Database.Database, key: string, value: string) {
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(
    key,
    value
  );
}

export function getAllSettings(db: Database.Database): Record<string, string> {
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export function upsertTodayMood(db: Database.Database, signal: MoodSignal, source: string) {
  const today = new Date().toISOString().slice(0, 10);
  db.prepare(
    `INSERT INTO mood_log (date, signal, source) VALUES (?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET signal = excluded.signal, source = excluded.source`
  ).run(today, signal, source.slice(0, 80));
}

export function getMoodLog(db: Database.Database, days: number): MoodEntry[] {
  return db.prepare('SELECT * FROM mood_log ORDER BY date DESC LIMIT ?').all(days) as MoodEntry[];
}

export function getTodayMood(db: Database.Database): MoodEntry | null {
  const today = new Date().toISOString().slice(0, 10);
  return (db.prepare('SELECT * FROM mood_log WHERE date = ?').get(today) as MoodEntry) ?? null;
}

export function startSession(db: Database.Database, mode: 'companion' | 'assistant'): number {
  const info = db.prepare('INSERT INTO sessions (mode) VALUES (?)').run(mode);
  return Number(info.lastInsertRowid);
}

export function bumpSessionTurn(db: Database.Database, sessionId: number) {
  db.prepare('UPDATE sessions SET turn_count = turn_count + 1 WHERE id = ?').run(sessionId);
}

export function endSession(db: Database.Database, sessionId: number) {
  db.prepare("UPDATE sessions SET ended_at = CURRENT_TIMESTAMP WHERE id = ?").run(sessionId);
}

export function getSessions(db: Database.Database, limit: number): Session[] {
  return db.prepare('SELECT * FROM sessions ORDER BY started_at DESC LIMIT ?').all(limit) as Session[];
}

export function addTranscript(db: Database.Database, sessionId: number, role: 'user' | 'assistant', content: string) {
  db.prepare('INSERT INTO transcripts (session_id, role, content) VALUES (?, ?, ?)').run(sessionId, role, content);
}

export function getTranscripts(db: Database.Database, sessionId: number): Transcript[] {
  return db.prepare('SELECT * FROM transcripts WHERE session_id = ? ORDER BY created_at ASC').all(sessionId) as Transcript[];
}

// ─── Provenance Queries ────────────────────────────────────────────────────────

export interface MemoryProvenance {
  memoryId: string;
  citeCount: number;
  firstCited: string | null;
  lastCited: string | null;
}

export interface MemorySummary {
  totalCount: number;
  oldestDate: string | null;
  newestDate: string | null;
  daysCovered: number;
  topTags: string[];
  totalCitations: number;
}

/** Record that a set of memory IDs were cited in an LLM prompt. Called from llmHandlers. */
export function recordMemoryCitations(db: Database.Database, memoryIds: string[]) {
  if (!memoryIds.length) return;
  const stmt = db.prepare(`
    INSERT INTO memory_interactions (memory_id, cite_count, first_cited, last_cited)
    VALUES (?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(memory_id) DO UPDATE
      SET cite_count = cite_count + 1,
          last_cited = CURRENT_TIMESTAMP
  `);
  const tx = db.transaction((ids: string[]) => {
    for (const id of ids) stmt.run(id);
  });
  tx(memoryIds);
}

/** Get provenance data for a single memory ID. Returns null if no citations yet. */
export function getMemoryProvenance(db: Database.Database, memoryId: string): MemoryProvenance | null {
  const row = db.prepare(
    'SELECT memory_id, cite_count, first_cited, last_cited FROM memory_interactions WHERE memory_id = ?'
  ).get(memoryId) as { memory_id: string; cite_count: number; first_cited: string; last_cited: string } | undefined;
  if (!row) return null;
  return {
    memoryId: row.memory_id,
    citeCount: row.cite_count,
    firstCited: row.first_cited,
    lastCited: row.last_cited
  };
}

/** Aggregate stats across all memories — used by the clear-all audit modal. */
export function getMemorySummary(
  db: Database.Database,
  allMemories: Array<{ id: string; createdAt: string; tags?: string[] }>
): MemorySummary {
  const totalCount = allMemories.length;
  const dates = allMemories.map((m) => m.createdAt).filter(Boolean).sort();
  const oldestDate = dates[0] ?? null;
  const newestDate = dates[dates.length - 1] ?? null;

  let daysCovered = 0;
  if (oldestDate && newestDate) {
    daysCovered = Math.round(
      (new Date(newestDate).getTime() - new Date(oldestDate).getTime()) / 86_400_000
    );
  }

  // Collect all tags, rank by frequency
  const tagFreq: Record<string, number> = {};
  for (const m of allMemories) {
    for (const t of (m.tags ?? [])) {
      tagFreq[t] = (tagFreq[t] ?? 0) + 1;
    }
  }
  const topTags = Object.entries(tagFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([tag]) => tag);

  const citationRow = db.prepare('SELECT COALESCE(SUM(cite_count), 0) as total FROM memory_interactions').get() as { total: number };
  const totalCitations = citationRow?.total ?? 0;

  return { totalCount, oldestDate, newestDate, daysCovered, topTags, totalCitations };
}

/** Clean up provenance data for a deleted memory. */
export function deleteMemoryProvenance(db: Database.Database, memoryId: string) {
  db.prepare('DELETE FROM memory_interactions WHERE memory_id = ?').run(memoryId);
}
