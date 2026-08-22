import React, { useState } from 'react';

interface TestResult {
  name: string;
  ok: boolean;
  detail: string;
  durationMs: number;
}

type Status = 'idle' | 'running' | 'done';

function TestRow({ result, running }: { result?: TestResult; index?: number; name?: string; running: boolean }) {
  if (!result && !running) return null;
  if (!result) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--color-border)', display: 'inline-block', flexShrink: 0 }} />
        <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>—</span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '11px 0',
        borderBottom: '1px solid var(--color-border)',
        animation: 'fadeIn 200ms ease'
      }}
    >
      {/* Status dot */}
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: result.ok ? 'var(--color-green)' : 'var(--color-danger)',
          display: 'inline-block',
          flexShrink: 0,
          marginTop: 3
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {result.name}
          </span>
          <span
            style={{
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              color: result.ok ? 'var(--color-green)' : 'var(--color-danger)',
              letterSpacing: '0.05em'
            }}
          >
            {result.ok ? '✓ PASS' : '✗ FAIL'}
          </span>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)', marginLeft: 'auto' }}>
            {result.durationMs}ms
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2, fontFamily: 'var(--font-mono)', wordBreak: 'break-word' }}>
          {result.detail}
        </div>
      </div>
    </div>
  );
}

export function SystemTest() {
  const [status, setStatus] = useState<Status>('idle');
  const [results, setResults] = useState<TestResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  const runTests = async () => {
    setStatus('running');
    setResults([]);
    setError(null);
    setStartedAt(Date.now());

    try {
      const res: TestResult[] = await (window.fumii as any).runSystemTests();
      setResults(res);
      setStatus('done');
    } catch (err: any) {
      setError(err?.message ?? String(err));
      setStatus('done');
    }
  };

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  const totalMs = startedAt && status === 'done' ? Date.now() - startedAt : null;

  return (
    <div className="page" style={{ maxWidth: 680 }}>
      <h1 className="page-title">system test</h1>
      <p className="page-subtitle">validates every subsystem — memory, llm, database, stt</p>

      {/* Run button */}
      <div className="card" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <button
          id="sysTest-run"
          className="btn-pill"
          disabled={status === 'running'}
          onClick={runTests}
          style={{ minWidth: 140, position: 'relative', overflow: 'hidden' }}
        >
          {status === 'running' ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Spinner /> running tests...
            </span>
          ) : status === 'done' ? 'run again' : 'run all tests'}
        </button>

        {status === 'done' && (
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--color-green)' }}>
              <strong>{passed}</strong> passed
            </span>
            {failed > 0 && (
              <span style={{ fontSize: 13, color: 'var(--color-danger)' }}>
                <strong>{failed}</strong> failed
              </span>
            )}
            {totalMs && (
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                {(totalMs / 1000).toFixed(1)}s total
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {(status !== 'idle' || results.length > 0) && (
        <div className="card">
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 4 }}>
            test results
          </div>

          {status === 'running' && results.length === 0 && (
            <div style={{ padding: '20px 0', color: 'var(--color-text-secondary)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Spinner /> initializing...
            </div>
          )}

          {results.map((r, i) => (
            <TestRow key={r.name + i} result={r} index={i} name={r.name} running={false} />
          ))}

          {error && (
            <div
              style={{
                marginTop: 12,
                padding: '10px 14px',
                borderRadius: 10,
                background: 'var(--color-danger-dim)',
                border: '1px solid rgba(255,107,107,0.2)',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: 'var(--color-danger)'
              }}
            >
              ✗ runner error: {error}
            </div>
          )}
        </div>
      )}

      {/* What each test does */}
      {status === 'idle' && (
        <div className="card" style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 14 }}>
            what gets tested
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['Memory Engine', 'Write entry, read it back, verify persistence — no process needed'],
              ['Memory Search', 'TF-IDF relevance search over episodic entries'],
              ['Auto Fact Extraction', 'Detects user facts (name, location, etc.) from conversation text'],
              ['SQLite Database', 'Verifies all tables exist and settings are readable'],
              ['LLM: each provider', 'Sends a ping/pong to each provider that has an API key saved'],
              ['LLM: Ollama (Local)', 'Checks if Ollama is running at localhost:11434'],
              ['Whisper STT', 'Checks which local models are installed and whether binary is bundled'],
              ['OS Keychain', 'Verifies keytar can round-trip a secret through the Windows keychain'],
            ].map(([name, desc]) => (
              <div key={name} style={{ display: 'flex', gap: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', minWidth: 160, flexShrink: 0 }}>{name}</span>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg
      width={14} height={14}
      viewBox="0 0 24 24" fill="none"
      style={{ animation: 'spin 800ms linear infinite', flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40" strokeDashoffset="15" strokeLinecap="round" />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }`}</style>
    </svg>
  );
}
