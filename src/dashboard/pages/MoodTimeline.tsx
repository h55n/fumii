import React, { useEffect, useState } from 'react';

const MOOD_COLOR: Record<string, string> = {
  happy:   'var(--color-green)',
  stressed:'var(--color-danger)',
  tired:   'var(--color-blue)',
  neutral: 'var(--color-text-secondary)',
  excited: 'var(--color-amber)'
};

const MOOD_VALUE: Record<string, number> = {
  stressed: -1, tired: -1, neutral: 0, happy: 2, excited: 3
};

const MOOD_EMOJI: Record<string, string> = {
  happy: '◕', stressed: '◔', tired: '◑', neutral: '○', excited: '●'
};

export function MoodTimeline() {
  const [log, setLog] = useState<{ date: string; signal: string }[]>([]);

  useEffect(() => {
    window.fumii.getMoodLog(30).then(setLog);
  }, []);

  const last7 = log.slice(0, 7).reverse();
  const max = Math.max(1, ...log.map((d) => Math.abs(MOOD_VALUE[d.signal] ?? 0)));

  return (
    <div className="page">
      <h1 className="page-title">mood</h1>
      <p className="page-subtitle">how you've been feeling lately, as fumii reads it</p>

      {/* Last 7 days pills */}
      <div className="card">
        <div className="label">last 7 days</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          {last7.length === 0 ? (
            <div className="empty-state" style={{ padding: '8px 0' }}>no data yet — keep chatting</div>
          ) : (
            last7.map((d) => (
              <div
                key={d.date}
                title={`${d.date}: ${d.signal}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  padding: '8px 12px',
                  background: 'var(--color-surface-raised)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  minWidth: 60,
                  transition: 'border-color 120ms ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-border-2)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
              >
                <span style={{ fontSize: 16, color: MOOD_COLOR[d.signal] ?? 'var(--color-text-secondary)' }}>
                  {MOOD_EMOJI[d.signal] ?? '○'}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: MOOD_COLOR[d.signal], letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {d.signal.slice(0, 5)}
                </span>
                <span style={{ fontSize: 9, color: 'var(--color-text-3)' }}>
                  {new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 30-day bar chart */}
      <div className="card">
        <div className="label">30-day arc</div>
        {log.length < 2 ? (
          <div className="empty-state" style={{ padding: '16px 0' }}>
            need at least 2 days of data to show the arc
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 100, marginTop: 16 }}>
            {[...log].reverse().map((d, i) => {
              const v = MOOD_VALUE[d.signal] ?? 0;
              const h = Math.max(6, (Math.abs(v) / max) * 90);
              return (
                <div
                  key={d.date}
                  title={`${d.date}: ${d.signal}`}
                  className="mood-bar"
                  style={{
                    flex: 1,
                    minWidth: 4,
                    height: h,
                    background: MOOD_COLOR[d.signal] ?? 'var(--color-text-secondary)',
                    animationDelay: `${i * 15}ms`
                  }}
                />
              );
            })}
          </div>
        )}
        {log.length >= 2 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-3)' }}>
            <span>{new Date([...log].reverse()[0].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            <span>today</span>
          </div>
        )}
      </div>

      {/* Current streak / dominant mood */}
      {log.length > 0 && (() => {
        const counts: Record<string, number> = {};
        log.forEach((d) => { counts[d.signal] = (counts[d.signal] ?? 0) + 1; });
        const [dominant] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
        return (
          <div className="card">
            <div className="label">this month's dominant mood</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
              <span style={{ fontSize: 20, color: MOOD_COLOR[dominant] }}>{MOOD_EMOJI[dominant] ?? '○'}</span>
              <span style={{ fontSize: 14, color: MOOD_COLOR[dominant], fontWeight: 600 }}>{dominant}</span>
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                {counts[dominant]} {counts[dominant] === 1 ? 'day' : 'days'} out of {log.length}
              </span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
