import React, { useEffect, useState } from 'react';
import { ProvenanceSheet } from '../components/ProvenanceSheet';
import { ProvenanceAuditModal } from '../components/ProvenanceAuditModal';

interface MemoryEntry {
  id: string;
  content: string;
  createdAt: string;
  tags?: string[];
}

export function Memory() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MemoryEntry[]>([]);
  const [profile, setProfile] = useState<{ static: string[]; dynamic: string[] } | null>(null);

  // Provenance state — single-memory delete sheet
  const [provenanceTarget, setProvenanceTarget] = useState<MemoryEntry | null>(null);
  // Provenance state — clear-all audit modal
  const [showAudit, setShowAudit] = useState(false);

  // Usage-count cache: memory id → cite count (loaded lazily per visible card)
  const [citeCounts, setCiteCounts] = useState<Record<string, number>>({});

  const runSearch = async (q: string) => {
    try {
      const r = await window.fumii?.searchMemories?.(q);
      if (Array.isArray(r)) setResults(r);
    } catch {}
  };

  useEffect(() => {
    runSearch('');
    window.fumii?.getProfile?.()?.then(setProfile)?.catch?.(() => {});
  }, []);

  // Lazily fetch cite counts for the first batch of visible results
  useEffect(() => {
    if (!results.length) return;
    results.forEach((m) => {
      if (citeCounts[m.id] !== undefined) return; // already fetched
      window.fumii?.getMemoryProvenance?.(m.id)
        .then((p: { citeCount: number } | null) => {
          if (p && p.citeCount > 0) {
            setCiteCounts((prev) => ({ ...prev, [m.id]: p.citeCount }));
          }
        })
        .catch(() => {});
    });
  }, [results]);

  // ── Delete flow: open provenance sheet instead of bare confirm() ─────────
  const handleDeleteClick = (entry: MemoryEntry) => {
    setProvenanceTarget(entry);
  };

  const handleDeleteConfirm = async () => {
    if (!provenanceTarget) return;
    try {
      await window.fumii?.deleteMemory?.(provenanceTarget.id);
      // Remove from cite counts cache
      setCiteCounts((prev) => {
        const next = { ...prev };
        delete next[provenanceTarget.id];
        return next;
      });
      runSearch(query);
    } catch {}
    setProvenanceTarget(null);
  };

  // ── Clear-all flow: open audit modal instead of bare confirm() ────────────
  const handleClearAllClick = () => {
    setShowAudit(true);
  };

  const handleAuditConfirm = async (_reason: string) => {
    setShowAudit(false);
    try {
      await window.fumii?.clearAllMemories?.();
      setCiteCounts({});
      runSearch('');
    } catch {}
  };

  return (
    <div className="page" style={{ maxWidth: 680 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 className="page-title">memory</h1>
          <p className="page-subtitle">everything fumii remembers from your conversations</p>
        </div>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 12,
            background: 'var(--color-surface)',
            border: '1px solid rgba(0,0,0,0.04)',
            borderRadius: 9999,
            padding: '4px 12px',
            color: 'var(--color-text-secondary)',
            marginTop: 6
          }}
        >
          {results.length} {results.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      {/* Profile summary */}
      {profile && (profile.static.length > 0 || profile.dynamic.length > 0) && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="label">what fumii knows about you</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {profile.static.map((s) => (
              <span key={s} className="tag-blue">{s}</span>
            ))}
            {profile.dynamic.map((d) => (
              <span key={d} className="tag">{d}</span>
            ))}
          </div>
        </div>
      )}

      {/* Search input */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="label">search memories</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input
            id="memory-search-input"
            className="input"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              runSearch(e.target.value);
            }}
            placeholder="search by topic, person, or keyword..."
            style={{ flex: 1 }}
          />
          {query && (
            <button
              className="btn-pill"
              onClick={() => { setQuery(''); runSearch(''); }}
            >
              clear
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {results.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.4 }}>◎</div>
          no memories {query ? `matching "${query}"` : 'yet'} — talk to fumii and she'll start remembering.
        </div>
      ) : (
        results.map((m, i) => (
          <div
            key={m.id}
            className="memory-card"
            style={{ animationDelay: `${i * 30}ms` }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-3)', letterSpacing: '0.08em' }}>
                  {new Date(m.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                {/* Provenance usage badge — only shown when citations exist */}
                {citeCounts[m.id] !== undefined && (
                  <span
                    title={`fumii has used this memory ${citeCounts[m.id]} time${citeCounts[m.id] !== 1 ? 's' : ''} in conversations`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9,
                      color: 'var(--color-blue)',
                      background: 'var(--color-blue-soft)',
                      border: '1px solid var(--color-blue-line)',
                      borderRadius: 'var(--radius-full)',
                      padding: '2px 7px',
                      cursor: 'default',
                    }}
                  >
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--color-blue)', display: 'inline-block' }} />
                    cited {citeCounts[m.id]}×
                  </span>
                )}
              </div>
              <button
                onClick={() => handleDeleteClick(m)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-3)', cursor: 'pointer', fontSize: 12, padding: '2px 4px', transition: 'color 120ms' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-danger)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-3)')}
              >
                delete
              </button>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>{m.content}</div>
            {(m.tags ?? []).length > 0 && (
              <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(m.tags as string[]).map((t) => (
                  <span key={t} className="tag">{t}</span>
                ))}
              </div>
            )}
          </div>
        ))
      )}

      {/* Danger zone */}
      {results.length > 0 && (
        <button
          id="memory-clear-all"
          className="btn-danger"
          onClick={handleClearAllClick}
          style={{ marginTop: 20 }}
        >
          clear all memories
        </button>
      )}

      {/* ── Provenance Sheet (single memory delete) ───────────────────────── */}
      {provenanceTarget && (
        <ProvenanceSheet
          memory={provenanceTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setProvenanceTarget(null)}
        />
      )}

      {/* ── Provenance Audit Modal (clear all) ────────────────────────────── */}
      {showAudit && (
        <ProvenanceAuditModal
          onConfirm={handleAuditConfirm}
          onCancel={() => setShowAudit(false)}
        />
      )}
    </div>
  );
}
