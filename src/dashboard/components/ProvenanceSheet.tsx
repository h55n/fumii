import React, { useEffect, useState } from 'react';

interface MemoryProvenance {
  memoryId: string;
  citeCount: number;
  firstCited: string | null;
  lastCited: string | null;
}

interface Props {
  memory: {
    id: string;
    content: string;
    createdAt: string;
    tags?: string[];
  };
  onConfirm: () => void;
  onCancel: () => void;
}

function fmt(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function ProvenanceSheet({ memory, onConfirm, onCancel }: Props) {
  const [provenance, setProvenance] = useState<MemoryProvenance | null>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Slide in after mount
    const t = setTimeout(() => setVisible(true), 10);

    window.fumii?.getMemoryProvenance?.(memory.id)
      .then((p: MemoryProvenance | null) => {
        setProvenance(p);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    return () => clearTimeout(t);
  }, [memory.id]);

  const handleCancel = () => {
    setVisible(false);
    setTimeout(onCancel, 240);
  };

  const handleConfirm = () => {
    setVisible(false);
    setTimeout(onConfirm, 240);
  };

  const citeCount = provenance?.citeCount ?? 0;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleCancel}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.18)',
          zIndex: 900,
          opacity: visible ? 1 : 0,
          transition: 'opacity 240ms var(--ease-out-smooth)',
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Memory provenance confirmation"
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: visible
            ? 'translateX(-50%) translateY(0)'
            : 'translateX(-50%) translateY(100%)',
          width: '100%',
          maxWidth: 560,
          background: 'var(--color-bg)',
          borderRadius: '24px 24px 0 0',
          border: '1px solid var(--color-border-2)',
          borderBottom: 'none',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.12)',
          zIndex: 901,
          transition: 'transform 280ms var(--ease-out-smooth)',
          padding: '28px 28px 36px',
        }}
      >
        {/* Handle bar */}
        <div style={{
          width: 40,
          height: 4,
          borderRadius: 2,
          background: 'var(--color-border-2)',
          margin: '0 auto 24px',
        }} />

        {/* Origin badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'var(--color-blue-soft)',
          border: '1px solid var(--color-blue-line)',
          borderRadius: 'var(--radius-full)',
          padding: '4px 12px',
          marginBottom: 16,
        }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <circle cx="5" cy="5" r="4" stroke="var(--color-blue)" strokeWidth="1.5" />
            <circle cx="5" cy="5" r="1.5" fill="var(--color-blue)" />
          </svg>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--color-blue)',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            provenance
          </span>
        </div>

        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          margin: '0 0 6px',
          letterSpacing: '-0.01em',
        }}>
          before fumii forgets this
        </h2>

        <p style={{
          fontSize: 13,
          color: 'var(--color-text-secondary)',
          margin: '0 0 20px',
          lineHeight: 1.5,
        }}>
          this memory has shaped how fumii knows you. here's its lineage.
        </p>

        {/* Memory content preview */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderLeft: '3px solid var(--color-blue)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          marginBottom: 16,
          fontSize: 13,
          color: 'var(--color-text-primary)',
          lineHeight: 1.6,
          fontStyle: 'italic',
        }}>
          "{memory.content.length > 160 ? memory.content.slice(0, 157) + '…' : memory.content}"
        </div>

        {/* Provenance stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 10,
          marginBottom: 20,
        }}>
          {[
            {
              label: 'created',
              value: fmt(memory.createdAt),
            },
            {
              label: 'shaped responses',
              value: loading ? '...' : citeCount === 0 ? 'never cited' : `${citeCount}×`,
              highlight: citeCount > 0,
            },
            {
              label: 'last used',
              value: loading ? '...' : fmt(provenance?.lastCited),
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: stat.highlight
                  ? 'var(--color-blue-soft)'
                  : 'var(--color-surface)',
                border: stat.highlight
                  ? '1px solid var(--color-blue-line)'
                  : '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 12px',
                textAlign: 'center',
              }}
            >
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: stat.highlight ? 18 : 14,
                fontWeight: 700,
                color: stat.highlight ? 'var(--color-blue)' : 'var(--color-text-primary)',
                marginBottom: 2,
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

        {/* Tags */}
        {(memory.tags ?? []).length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
            {(memory.tags as string[]).map((t) => (
              <span key={t} className="tag">{t}</span>
            ))}
          </div>
        )}

        {/* Context line */}
        {citeCount > 0 && (
          <p style={{
            fontSize: 12,
            color: 'var(--color-text-secondary)',
            margin: '0 0 20px',
            lineHeight: 1.5,
            padding: '10px 14px',
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-md)',
          }}>
            fumii has drawn on this memory{' '}
            <strong style={{ color: 'var(--color-text-primary)' }}>{citeCount} time{citeCount !== 1 ? 's' : ''}</strong>{' '}
            when forming her responses. removing it means she'll no longer have this as context.
          </p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            id="provenance-sheet-cancel"
            className="btn-pill"
            onClick={handleCancel}
            style={{ flex: 1, justifyContent: 'center', padding: '11px 0' }}
          >
            keep it
          </button>
          <button
            id="provenance-sheet-confirm"
            onClick={handleConfirm}
            style={{
              flex: 1,
              padding: '11px 0',
              background: 'var(--color-danger)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              fontFamily: 'var(--font-display)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 120ms ease, transform 80ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'none')}
          >
            forget it
          </button>
        </div>
      </div>
    </>
  );
}
