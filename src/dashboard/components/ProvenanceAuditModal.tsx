import React, { useEffect, useState } from 'react';

interface MemorySummary {
  totalCount: number;
  oldestDate: string | null;
  newestDate: string | null;
  daysCovered: number;
  topTags: string[];
  totalCitations: number;
}

interface Props {
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

function fmt(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** A compact horizontal bar — width driven by proportion */
function StatBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{
      height: 4,
      width: '100%',
      background: 'var(--color-border)',
      borderRadius: 2,
      overflow: 'hidden',
      marginTop: 4,
    }}>
      <div style={{
        height: '100%',
        width: `${pct}%`,
        background: color,
        borderRadius: 2,
        transition: 'width 600ms var(--ease-out-smooth)',
      }} />
    </div>
  );
}

export function ProvenanceAuditModal({ onConfirm, onCancel }: Props) {
  const [summary, setSummary] = useState<MemorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState('');
  const [visible, setVisible] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);

    window.fumii?.getMemorySummary?.()
      .then((s: MemorySummary) => {
        setSummary(s);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    return () => clearTimeout(t);
  }, []);

  const handleCancel = () => {
    setVisible(false);
    setTimeout(onCancel, 280);
  };

  const handleConfirm = () => {
    setVisible(false);
    setTimeout(() => onConfirm(reason.trim()), 280);
  };

  const s = summary;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 950,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Backdrop */}
      <div
        onClick={handleCancel}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.28)',
          backdropFilter: 'blur(4px)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 280ms ease',
        }}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Memory provenance audit"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 520,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border-2)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.16)',
          padding: '32px 32px 28px',
          opacity: visible ? 1 : 0,
          transform: visible ? 'none' : 'translateY(16px) scale(0.97)',
          transition: 'opacity 280ms var(--ease-out-smooth), transform 280ms var(--ease-out-smooth)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'var(--color-danger-dim)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 'var(--radius-full)',
          padding: '4px 12px',
          marginBottom: 16,
        }}>
          <span style={{
            display: 'inline-block',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--color-danger)',
          }} />
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--color-danger)',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            lineage audit · destructive action
          </span>
        </div>

        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 22,
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          margin: '0 0 6px',
          letterSpacing: '-0.01em',
        }}>
          this will erase everything fumii knows about you
        </h2>

        <p style={{
          fontSize: 13,
          color: 'var(--color-text-secondary)',
          margin: '0 0 24px',
          lineHeight: 1.6,
        }}>
          before you do, here's the full provenance of what you'd be removing.
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--color-text-3)', fontSize: 13 }}>
            <span className="thinking-dots">reading lineage</span>
          </div>
        ) : s ? (
          <>
            {/* Stats row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 10,
              marginBottom: 20,
            }}>
              {[
                { label: 'memories', value: String(s.totalCount), color: 'var(--color-blue)' },
                { label: 'days of context', value: s.daysCovered > 0 ? `${s.daysCovered}d` : '< 1d', color: 'var(--color-green)' },
                { label: 'times cited', value: String(s.totalCitations), color: 'var(--color-text-secondary)' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 22,
                    fontWeight: 700,
                    color: stat.color,
                    lineHeight: 1,
                    marginBottom: 4,
                  }}>
                    {stat.value}
                  </div>
                  <div style={{
                    fontSize: 10,
                    color: 'var(--color-text-3)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Date span */}
            <div style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              marginBottom: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                  oldest memory
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {fmt(s.oldestDate)}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 80, height: 1, background: 'var(--color-border-2)', position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%,-50%)',
                    background: 'var(--color-bg)',
                    padding: '0 6px',
                    fontSize: 10,
                    color: 'var(--color-text-3)',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    lineage
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                  most recent
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {fmt(s.newestDate)}
                </div>
              </div>
            </div>

            {/* Top tags */}
            {s.topTags.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div className="label" style={{ marginBottom: 8 }}>what fumii knows about you</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {s.topTags.map((tag) => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Citation depth bar */}
            {s.totalCitations > 0 && (
              <div style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                marginBottom: 20,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    memory influence depth
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-blue)' }}>
                    {s.totalCitations} citations across {s.totalCount} memories
                  </span>
                </div>
                <StatBar
                  value={Math.min(s.totalCitations, 100)}
                  max={100}
                  color="var(--color-blue)"
                />
              </div>
            )}
          </>
        ) : (
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            marginBottom: 20,
            fontSize: 13,
            color: 'var(--color-text-secondary)',
          }}>
            no lineage data available yet — fumii hasn't processed enough conversations.
          </div>
        )}

        {/* Reason input */}
        <div style={{ marginBottom: 20 }}>
          <div className="label" style={{ marginBottom: 6 }}>why are you starting over? (optional)</div>
          <textarea
            id="provenance-reset-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="tell fumii why you're erasing everything..."
            rows={2}
            style={{
              width: '100%',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              fontFamily: 'var(--font-display)',
              fontSize: 13,
              color: 'var(--color-text-primary)',
              outline: 'none',
              resize: 'none',
              lineHeight: 1.5,
              transition: 'border-color 140ms ease',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-border-2)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            id="provenance-audit-cancel"
            className="btn-pill"
            onClick={handleCancel}
            style={{ flex: 1, justifyContent: 'center', padding: '12px 0' }}
          >
            go back
          </button>
          <button
            id="provenance-audit-confirm"
            disabled={confirming}
            onClick={() => { setConfirming(true); handleConfirm(); }}
            style={{
              flex: 1,
              padding: '12px 0',
              background: 'var(--color-danger)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              fontFamily: 'var(--font-display)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 120ms ease, transform 80ms ease',
              opacity: confirming ? 0.6 : 1,
            }}
            onMouseEnter={(e) => !confirming && (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={(e) => !confirming && (e.currentTarget.style.opacity = '1')}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'none')}
          >
            {confirming ? 'erasing…' : 'erase everything'}
          </button>
        </div>
      </div>
    </div>
  );
}
