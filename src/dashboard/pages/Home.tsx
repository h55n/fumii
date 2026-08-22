import React, { useEffect, useState } from 'react';

export function Home({ onNavigate }: { onNavigate: (k: string) => void }) {
  const [mood, setMood] = useState<{ signal: string } | null>(null);
  const [lastConvSummary, setLastConvSummary] = useState<string>(
    'The conversation starts with casual greetings, then asks for help, follows up with playful banter, and ends with a flirtatious line about coming home.'
  );
  const tags = ['help', 'fun', 'home', 'friendly', 'flirty'];

  useEffect(() => {
    try {
      window?.fumii?.getTodayMood?.()?.then(setMood)?.catch?.(() => {});
      window?.fumii?.getSessions?.(1)?.then((sessions: any[]) => {
        if (Array.isArray(sessions) && sessions.length > 0 && sessions[0].summary) {
          setLastConvSummary(sessions[0].summary);
        }
      })?.catch?.(() => {});
    } catch {}
  }, []);

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  const signal = mood?.signal ?? 'neutral';

  return (
    <div className="page" style={{ maxWidth: 680 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 34,
            fontWeight: 700,
            margin: '0 0 6px 0',
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.02em',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <span>hey</span>
          <span style={{ color: 'var(--color-text-primary)' }}>✦</span>
        </h1>
        <p
          style={{
            fontSize: 14,
            color: 'var(--color-text-secondary)',
            margin: 0,
            fontWeight: 400
          }}
        >
          {formattedDate}
        </p>
      </div>

      {/* TODAY'S MOOD Card */}
      <div
        className="card"
        style={{
          padding: '20px 24px',
          borderRadius: 20,
          background: 'var(--color-surface)',
          border: '1px solid rgba(0, 0, 0, 0.04)',
          marginBottom: 16
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span className="label" style={{ margin: 0, fontSize: 11, letterSpacing: '0.08em', color: 'var(--color-text-3)' }}>
            TODAY'S MOOD
          </span>
          <button
            onClick={() => onNavigate('mood')}
            className="btn-pill"
            style={{ fontSize: 12, padding: '5px 14px' }}
          >
            view timeline →
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--color-surface-raised)',
              padding: '6px 16px',
              borderRadius: 9999,
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--color-text-primary)'
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: signal === 'happy' ? '#10B981' : signal === 'stressed' ? '#EF4444' : 'var(--color-text-secondary)',
                display: 'inline-block'
              }}
            />
            <span>{signal}</span>
          </div>
        </div>
      </div>

      {/* LAST CONVERSATION Card */}
      <div
        className="card"
        style={{
          padding: '22px 24px',
          borderRadius: 20,
          background: 'var(--color-surface)',
          border: '1px solid rgba(0, 0, 0, 0.04)',
          marginBottom: 20
        }}
      >
        <div className="label" style={{ marginBottom: 14, fontSize: 11, letterSpacing: '0.08em', color: 'var(--color-text-3)' }}>
          LAST CONVERSATION
        </div>

        <p
          style={{
            fontSize: 14,
            color: 'var(--color-text-primary)',
            lineHeight: 1.6,
            margin: '0 0 16px 0',
            fontWeight: 400
          }}
        >
          {lastConvSummary}
        </p>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {tags.map((tag) => (
            <span
              key={tag}
              style={{
                background: 'var(--color-blue-tint)',
                color: 'var(--color-blue-dark)',
                fontSize: 12,
                fontWeight: 500,
                padding: '4px 12px',
                borderRadius: 9999
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom Action Pill Buttons */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={() => onNavigate('memory')}
          style={{
            background: 'var(--color-surface)',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            borderRadius: 9999,
            padding: '9px 18px',
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            transition: 'all 120ms ease'
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = 'var(--color-text-primary)';
            (e.currentTarget as HTMLElement).style.background = '#ffffff';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)';
            (e.currentTarget as HTMLElement).style.background = 'var(--color-surface)';
          }}
        >
          view memories →
        </button>

        <button
          onClick={() => onNavigate('conversations')}
          style={{
            background: 'var(--color-surface)',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            borderRadius: 9999,
            padding: '9px 18px',
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            transition: 'all 120ms ease'
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = 'var(--color-text-primary)';
            (e.currentTarget as HTMLElement).style.background = '#ffffff';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)';
            (e.currentTarget as HTMLElement).style.background = 'var(--color-surface)';
          }}
        >
          all conversations →
        </button>
      </div>
    </div>
  );
}
