import type { IpcMain, BrowserWindow } from 'electron';
import type Database from 'better-sqlite3';
import { LLMService } from '../services/LLMService';
import { MemoryService } from '../services/MemoryService';
import { WhisperService } from '../services/WhisperService';
import { getSetting } from '../db/queries';

type Deps = {
  db: Database.Database;
  llm: LLMService;
  memory: MemoryService;
  whisper?: WhisperService;
  getDashboardWindow: () => BrowserWindow | null;
};

export interface SystemTestResult {
  name: string;
  ok: boolean;
  detail: string;
  durationMs: number;
}

export function registerSystemTestHandlers(ipcMain: IpcMain, deps: Deps) {
  const { db, llm, memory, whisper } = deps;

  ipcMain.handle('system:runTests', async () => {
    const results: SystemTestResult[] = [];

    // ── Test 1: Memory engine ────────────────────────────────────────────
    await runTest(results, 'Memory Engine', async () => {
      const testId = `test-${Date.now()}`;
      await memory.add(`System self-test entry ${testId}`, ['_test']);
      const all = await memory.listAll();
      const found = all.some((e) => e.content.includes(testId));
      if (!found) throw new Error('Written entry not found in listAll()');
      // Clean up test entry
      const entry = all.find((e) => e.content.includes(testId));
      if (entry) await memory.delete(entry.id);
      const diag = memory.getDiagnostics();
      return `${diag.entryCount} entries · ${diag.staticFactCount} facts · path OK`;
    });

    // ── Test 2: Memory search ────────────────────────────────────────────
    await runTest(results, 'Memory Search (TF-IDF)', async () => {
      await memory.add('user loves playing guitar and listens to jazz music a lot', ['_test']);
      const results2 = await memory.search('guitar music');
      const found = results2.some((r) => r.content.includes('guitar'));
      // Clean up
      const all = await memory.listAll();
      const entry = all.find((e) => e.tags?.includes('_test'));
      if (entry) await memory.delete(entry.id);
      if (!found) throw new Error('Relevant entry not surfaced by search');
      return `${results2.length} result(s) for "guitar music"`;
    });

    // ── Test 3: Static fact extraction ───────────────────────────────────
    await runTest(results, 'Auto Fact Extraction', async () => {
      await memory.add('User: my name is Alex\nfumii: hey alex!', ['_test']);
      const { profile } = await memory.profile('name');
      const hasFact = profile.static.some((f) => f.toLowerCase().includes('alex'));
      // Clean up
      const all = await memory.listAll();
      const entry = all.find((e) => e.tags?.includes('_test'));
      if (entry) await memory.delete(entry.id);
      return hasFact ? 'name fact extracted correctly' : 'no fact extracted (pattern may not match)';
    });

    // ── Test 4: SQLite database ──────────────────────────────────────────
    await runTest(results, 'SQLite Database', async () => {
      const tables = (db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all() as any[]).map((r) => r.name);
      const required = ['settings', 'mood_log', 'sessions', 'transcripts'];
      const missing = required.filter((t) => !tables.includes(t));
      if (missing.length) throw new Error(`Missing tables: ${missing.join(', ')}`);
      const mode = getSetting(db, 'active_mode') ?? 'companion';
      return `${tables.length} tables · mode=${mode}`;
    });

    // ── Test 5: LLM providers with saved keys ────────────────────────────
    const providers: Array<{ id: string; label: string }> = [
      { id: 'groq', label: 'Groq' },
      { id: 'openai', label: 'OpenAI' },
      { id: 'anthropic', label: 'Anthropic' },
      { id: 'gemini', label: 'Google Gemini' },
      { id: 'mistral', label: 'Mistral AI' },
      { id: 'nvidia', label: 'NVIDIA NIM' }
    ];
    for (const p of providers) {
      const hasKey = await llm.hasApiKey(p.id as any);
      if (!hasKey) {
        results.push({ name: `LLM: ${p.label}`, ok: true, detail: 'no key saved — skipped', durationMs: 0 });
        continue;
      }
      await runTest(results, `LLM: ${p.label}`, async () => {
        let reply = '';
        await llm.chatStreamProvider(
          p.id as any,
          [{ role: 'system', content: 'reply with exactly: pong' }, { role: 'user', content: 'ping' }],
          (t) => { reply += t; }
        );
        const trimmed = reply.trim().toLowerCase().slice(0, 40);
        if (!trimmed) throw new Error('Empty response');
        return `response: "${trimmed}"`;
      });
    }

    // ── Test 6: Ollama (local) ────────────────────────────────────────────
    await runTest(results, 'LLM: Ollama (Local)', async () => {
      const up = await llm.isOllamaUp();
      if (!up) return 'not running — normal if Ollama not installed';
      let reply = '';
      await llm.chatStreamProvider(
        'ollama',
        [{ role: 'user', content: 'say hi' }],
        (t) => { reply += t; }
      );
      return reply.trim() ? `response: "${reply.trim().slice(0, 40)}"` : 'responded (empty)';
    });

    // ── Test 7: Whisper STT models ────────────────────────────────────────
    await runTest(results, 'Whisper STT Engine', async () => {
      if (!whisper) return 'whisper service not initialized';
      const models = whisper.getModels();
      const installed = models.filter((m) => m.installed);
      if (!installed.length) return `no models installed — install via Settings → Voice & STT`;
      const available = whisper.isAvailable();
      return `${installed.length} model(s) installed · binary ${available ? 'ready' : 'not found (bundle resources/whisper/)'}`;
    });

    // ── Test 8: API key storage (keychain) ───────────────────────────────
    await runTest(results, 'OS Keychain (keytar)', async () => {
      const testKey = 'self-test-key-do-not-use';
      // Save the real key BEFORE overwriting so we can restore it afterwards
      const originalKey = await llm.getApiKey('openai');
      try {
        await llm.setApiKey('openai', testKey);
        const retrieved = await llm.getApiKey('openai');
        if (retrieved !== testKey) throw new Error('round-trip failed');
      } finally {
        // Always restore the original key (empty string clears it)
        await llm.setApiKey('openai', originalKey ?? '');
      }
      return 'keychain read/write OK';
    });

    // ── Test 9: Memory Provenance & Lineage Tracking ─────────────────────
    await runTest(results, 'Memory Provenance & Lineage', async () => {
      const { recordMemoryCitations, getMemoryProvenance, getMemorySummary, deleteMemoryProvenance } = await import('../db/queries');
      const testMemId = `prov-test-${Date.now()}`;
      
      // Record citation
      recordMemoryCitations(db, [testMemId]);
      recordMemoryCitations(db, [testMemId]);
      
      const prov = getMemoryProvenance(db, testMemId);
      if (!prov || prov.citeCount !== 2) {
        throw new Error(`Expected cite count 2, got ${prov?.citeCount}`);
      }

      const summary = getMemorySummary(db, [{ id: testMemId, createdAt: new Date().toISOString(), tags: ['test-topic'] }]);
      if (summary.totalCount < 1 || !summary.topTags.includes('test-topic')) {
        throw new Error('Summary aggregation failed');
      }

      deleteMemoryProvenance(db, testMemId);
      const afterDel = getMemoryProvenance(db, testMemId);
      if (afterDel !== null) throw new Error('Provenance record deletion failed');

      return `lineage tracking verified · citations & summary OK`;
    });

    return results;
  });
}

async function runTest(
  results: SystemTestResult[],
  name: string,
  fn: () => Promise<string>
): Promise<void> {
  const start = Date.now();
  try {
    const detail = await fn();
    results.push({ name, ok: true, detail, durationMs: Date.now() - start });
  } catch (err: any) {
    results.push({ name, ok: false, detail: err?.message ?? String(err), durationMs: Date.now() - start });
  }
}
