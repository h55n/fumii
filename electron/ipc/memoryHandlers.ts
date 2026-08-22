import type { IpcMain } from 'electron';
import type Database from 'better-sqlite3';
import { MemoryService } from '../services/MemoryService';
import {
  getMoodLog,
  getTodayMood,
  getSessions,
  getTranscripts,
  getMemoryProvenance,
  getMemorySummary,
  deleteMemoryProvenance
} from '../db/queries';

type Deps = { memory: MemoryService; db: Database.Database };

export function registerMemoryHandlers(ipcMain: IpcMain, deps: Deps) {
  const { memory, db } = deps;

  ipcMain.handle('memory:getProfile', async () => {
    const { profile } = await memory.profile('');
    return profile;
  });

  ipcMain.handle('memory:search', async (_e, query: string) => {
    return memory.listAll().then((all) =>
      query ? all.filter((m) => m.content.toLowerCase().includes(query.toLowerCase())) : all
    );
  });

  ipcMain.handle('memory:delete', async (_e, id: string) => {
    await memory.delete(id);
    // Clean up any provenance tracking for this memory
    deleteMemoryProvenance(db, id);
    return true;
  });

  ipcMain.handle('memory:clearAll', async () => {
    await memory.clearAll();
    // Wipe all provenance records too — clean slate
    db.prepare('DELETE FROM memory_interactions').run();
    return true;
  });

  // ─── Provenance Handlers ────────────────────────────────────────────────────

  /**
   * Returns provenance data for a single memory ID.
   * Used by the ProvenanceSheet (single-delete confirmation) to show how many
   * times this specific memory has shaped fumii's responses.
   */
  ipcMain.handle('memory:getProvenance', async (_e, id: string) => {
    return getMemoryProvenance(db, id);
  });

  /**
   * Returns an aggregate summary across ALL memories.
   * Used by the ProvenanceAuditModal (clear-all confirmation) to give the user
   * a full picture of what they're about to erase.
   */
  ipcMain.handle('memory:getSummary', async () => {
    const all = await memory.listAll();
    return getMemorySummary(db, all);
  });

  // ─── Mood / Sessions / Transcripts ─────────────────────────────────────────

  ipcMain.handle('mood:getLog', async (_e, days: number) => getMoodLog(db, days));
  ipcMain.handle('mood:getToday', async () => getTodayMood(db));

  ipcMain.handle('sessions:list', async (_e, limit: number) => getSessions(db, limit));
  ipcMain.handle('sessions:transcripts', async (_e, sessionId: number) => getTranscripts(db, sessionId));
}
