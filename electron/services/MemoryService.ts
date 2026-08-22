import { app } from 'electron';
import { join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';

/**
 * MemoryService — Fully In-Process Memory Engine
 * ───────────────────────────────────────────────
 * Zero external processes. Zero localhost servers. Zero npx commands.
 * All memory lives in %APPDATA%/fumii/fumii-memory/local-memory.json
 * and is processed entirely inside the Electron main process.
 *
 * Architecture:
 *   1. Episodic entries — raw conversation summaries stored as they happen
 *   2. Static facts — extracted long-term facts about the user (name, prefs, etc.)
 *   3. Dynamic context — recent entries from last 48h for immediate context
 *   4. Semantic search — TF-IDF + recency-weighted scoring, no ML needed
 *   5. Auto-extraction — passively detects facts from conversation content
 *   6. Deduplication — prevents identical or near-identical entries piling up
 */

const MEMORY_VERSION = 2;
const MAX_EPISODIC_ENTRIES = 500;   // rolling window — oldest pruned after this
const MAX_STATIC_FACTS = 80;       // hard cap on long-term facts
const RECENT_WINDOW_HOURS = 48;    // entries within this window are "dynamic context"

export type RelationshipStage = 'new' | 'familiar' | 'close';

interface MemoryEntry {
  id: string;
  content: string;
  createdAt: string;        // ISO 8601
  tags: string[];
  score?: number;           // set transiently during search
}

interface MemoryStore {
  version: number;
  staticFacts: string[];
  entries: MemoryEntry[];
}

// ── Fact extraction patterns ───────────────────────────────────────────────
// Passively detects autobiographical, emotional, and contextual facts from conversation summaries.
const FACT_PATTERNS: Array<{ pattern: RegExp; extract: (m: RegExpMatchArray) => string }> = [
  { pattern: /my name is (\w+)/i,                               extract: (m) => `user's name is ${m[1]}` },
  { pattern: /i(?:'m| am) (\d+) years? old/i,                   extract: (m) => `user is ${m[1]} years old` },
  { pattern: /i(?:'m| am) (?:a |an )?(\w+) student/i,           extract: (m) => `user is a ${m[1]} student` },
  { pattern: /i(?:'m| am) studying (.+?)(?:\.|,|$)/i,            extract: (m) => `user studies ${m[1].trim()}` },
  { pattern: /i work (?:at|for|as) (.+?)(?:\.|,|$)/i,            extract: (m) => `user works at/as ${m[1].trim()}` },
  { pattern: /my (?:job|role|career) is (.+?)(?:\.|,|$)/i,       extract: (m) => `user's work is ${m[1].trim()}` },
  { pattern: /i live in (.+?)(?:\.|,|$)/i,                       extract: (m) => `user lives in ${m[1].trim()}` },
  { pattern: /i(?:'m| am) from (.+?)(?:\.|,|$)/i,                extract: (m) => `user is from ${m[1].trim()}` },
  { pattern: /i love (.+?)(?:\.|,|$)/i,                          extract: (m) => `user loves ${m[1].trim()}` },
  { pattern: /my (?:favourite|favorite) (.+?) is (.+?)(?:\.|,|$)/i, extract: (m) => `user's favourite ${m[1]} is ${m[2].trim()}` },
  { pattern: /my (?:supervisor|boss|manager) (?:is|keep|keeps|told) (.+?)(?:\.|,|$)/i, extract: (m) => `user's supervisor/boss ${m[1].trim()}` },
  { pattern: /my (?:partner|husband|wife|boyfriend|girlfriend|friend) (?:name is|is) (.+?)(?:\.|,|$)/i, extract: (m) => `user's partner/friend is ${m[1].trim()}` },
  { pattern: /i(?:'m| am) working on (.+?)(?:\.|,|$)/i,          extract: (m) => `user is working on ${m[1].trim()}` },
  { pattern: /my (?:deadline|exam|presentation|interview) is (.+?)(?:\.|,|$)/i, extract: (m) => `user's deadline/event is ${m[1].trim()}` },
  { pattern: /i(?:'m| am) allergic to (.+?)(?:\.|,|$)/i,         extract: (m) => `user is allergic to ${m[1].trim()}` },
  { pattern: /i (?:struggle with|have trouble with) (.+?)(?:\.|,|$)/i, extract: (m) => `user struggles with ${m[1].trim()}` }
];

// ── TF-IDF scoring ─────────────────────────────────────────────────────────
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function tfidfScore(query: string[], doc: string, docCount: number, allDocs: string[]): number {
  const docTokens = tokenize(doc);
  const docLen = Math.max(1, docTokens.length);
  const tf: Record<string, number> = {};
  for (const t of docTokens) tf[t] = (tf[t] ?? 0) + 1;

  let score = 0;
  for (const qWord of query) {
    const termTf = (tf[qWord] ?? 0) / docLen;
    const docsWithTerm = allDocs.filter((d) => d.toLowerCase().includes(qWord)).length;
    const idf = Math.log((docCount + 1) / (docsWithTerm + 1)) + 1;
    score += termTf * idf;
  }
  return score;
}

function recencyBoost(createdAt: string): number {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const ageHours = ageMs / 3_600_000;
  // Exponential decay: 1.0 at 0h, ~0.5 at 72h, ~0.1 at 1 week
  return Math.exp(-ageHours / 120);
}

// ── Stop words (common English words that add no search value) ─────────────
const STOPWORDS = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','with',
  'by','from','up','out','is','are','was','were','be','been','being',
  'have','has','had','do','does','did','will','would','could','should',
  'may','might','shall','this','that','these','those','it','its','i',
  'me','my','we','our','you','your','he','his','she','her','they','their'
]);

// ── Main class ─────────────────────────────────────────────────────────────
export class MemoryService {
  private localPath: string;
  private _cache: MemoryStore | null = null;
  private _dirty = false;
  private _saveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    const dir = join(app?.getPath ? app.getPath('userData') : '.', 'fumii-memory');
    mkdirSync(dir, { recursive: true });
    this.localPath = join(dir, 'local-memory.json');
    this._ensureStore();
    // Periodic flush every 10s if dirty (debounced writes)
    setInterval(() => this._flushIfDirty(), 10_000);
  }

  // ── Internal read/write ──────────────────────────────────────────────────

  private _ensureStore(): MemoryStore {
    if (this._cache) return this._cache;
    if (existsSync(this.localPath)) {
      try {
        const raw = JSON.parse(readFileSync(this.localPath, 'utf-8'));
        // Migrate v1 format
        if (!raw.version || raw.version < MEMORY_VERSION) {
          this._cache = {
            version: MEMORY_VERSION,
            staticFacts: raw.staticFacts ?? [],
            entries: (raw.entries ?? []).map((e: any) => ({ ...e, tags: e.tags ?? [] }))
          };
          this._dirty = true;
        } else {
          this._cache = raw as MemoryStore;
        }
      } catch {
        this._cache = { version: MEMORY_VERSION, staticFacts: [], entries: [] };
      }
    } else {
      this._cache = { version: MEMORY_VERSION, staticFacts: [], entries: [] };
    }
    return this._cache!;
  }

  private _get(): MemoryStore {
    return this._ensureStore();
  }

  private _markDirty() {
    this._dirty = true;
    // Debounce: schedule a write 2s after last change
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this._flushIfDirty(), 2000);
  }

  private _flushIfDirty() {
    if (!this._dirty || !this._cache) return;
    try {
      writeFileSync(this.localPath, JSON.stringify(this._cache, null, 2));
      this._dirty = false;
    } catch (err) {
      console.error('[MemoryService] flush failed:', err);
    }
  }

  // ── Public API ───────────────────────────────────────────────────────────

  /**
   * Calculates the current relationship arc stage based on cumulative interactions (PRD §1).
   * - new: 0–10 turns
   * - familiar: 10–50 turns
   * - close: 50+ turns
   */
  getRelationshipStage(): RelationshipStage {
    const store = this._get();
    const count = store.entries.length;
    if (count >= 50) return 'close';
    if (count >= 10) return 'familiar';
    return 'new';
  }

  /**
   * Returns identity profile + top-N relevant memories + relationship stage.
   * Called before every LLM request to supply Least Available Context.
   */
  async profile(query: string): Promise<{
    profile: { static: string[]; dynamic: string[] };
    relationshipStage: RelationshipStage;
    searchResults: MemoryEntry[];
  }> {
    const store = this._get();

    // Dynamic context = entries from last 48h (recent interaction context)
    const cutoff = new Date(Date.now() - RECENT_WINDOW_HOURS * 3_600_000).toISOString();
    const dynamic = store.entries
      .filter((e) => e.createdAt >= cutoff)
      .slice(0, 5)
      .map((e) => e.content);

    // Semantic search for relevant memories
    const searchResults = query ? this._search(query, 3) : [];
    const relationshipStage = this.getRelationshipStage();

    return {
      profile: { static: store.staticFacts.slice(0, 8), dynamic },
      relationshipStage,
      searchResults
    };
  }

  private _search(query: string, topN: number): MemoryEntry[] {
    const store = this._get();
    if (!store.entries.length) return [];

    const qTokens = tokenize(query);
    if (!qTokens.length) return store.entries.slice(0, topN);

    const allContent = store.entries.map((e) => e.content);
    const docCount = allContent.length;

    const scored = store.entries.map((entry) => ({
      entry,
      score: tfidfScore(qTokens, entry.content, docCount, allContent) + recencyBoost(entry.createdAt) * 0.3
    }));

    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topN)
      .map((s) => ({ ...s.entry, score: s.score }));
  }

  /**
   * Adds a new episodic memory entry from a conversation turn.
   * Automatically extracts static facts, deduplicates, and prunes.
   */
  async add(content: string, tags: string[] = []): Promise<void> {
    const store = this._get();

    // Deduplication: skip if very similar entry exists in last 5 entries
    const recent5 = store.entries.slice(0, 5).map((e) => e.content.toLowerCase());
    const norm = content.toLowerCase();
    const isDuplicate = recent5.some((prev) => {
      const overlap = tokenize(norm).filter((w) => prev.includes(w)).length;
      return overlap / Math.max(1, tokenize(norm).length) > 0.8;
    });
    if (isDuplicate) return;

    // Extract static facts from conversation content
    for (const { pattern, extract } of FACT_PATTERNS) {
      const match = content.match(pattern);
      if (match) {
        const fact = extract(match);
        if (!store.staticFacts.includes(fact)) {
          store.staticFacts.unshift(fact);
          if (store.staticFacts.length > MAX_STATIC_FACTS) {
            store.staticFacts = store.staticFacts.slice(0, MAX_STATIC_FACTS);
          }
        }
      }
    }

    // Add entry
    store.entries.unshift({
      id: randomUUID(),
      content,
      createdAt: new Date().toISOString(),
      tags
    });

    // Prune old entries beyond rolling window
    if (store.entries.length > MAX_EPISODIC_ENTRIES) {
      store.entries = store.entries.slice(0, MAX_EPISODIC_ENTRIES);
    }

    this._markDirty();
  }

  async search(query: string): Promise<MemoryEntry[]> {
    return this._search(query, 10);
  }

  async listAll(): Promise<MemoryEntry[]> {
    return this._get().entries;
  }

  async delete(id: string): Promise<void> {
    const store = this._get();
    store.entries = store.entries.filter((e) => e.id !== id);
    this._markDirty();
  }

  async clearAll(): Promise<void> {
    this._cache = { version: MEMORY_VERSION, staticFacts: [], entries: [] };
    this._dirty = true;
    this._flushIfDirty();
  }

  async setStaticFact(fact: string): Promise<void> {
    const store = this._get();
    if (!store.staticFacts.includes(fact)) {
      store.staticFacts.unshift(fact);
    }
    this._markDirty();
  }

  /** Diagnostics: returns a health snapshot for the system test panel */
  getDiagnostics(): {
    ok: boolean;
    entryCount: number;
    staticFactCount: number;
    storePath: string;
    storeExists: boolean;
    lastEntry?: string;
  } {
    const store = this._get();
    return {
      ok: true,
      entryCount: store.entries.length,
      staticFactCount: store.staticFacts.length,
      storePath: this.localPath,
      storeExists: existsSync(this.localPath),
      lastEntry: store.entries[0]?.createdAt
    };
  }
}
