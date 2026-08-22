import React, { useEffect, useState } from 'react';

export function Conversations() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [transcript, setTranscript] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.fumii.getSessions(50).then(setSessions);
  }, []);

  const openSession = async (id: number) => {
    setOpenId(id);
    setLoading(true);
    const t = await window.fumii.getTranscripts(id);
    setTranscript(t);
    setLoading(false);
  };

  const duration = (s: any) => {
    if (!s.ended_at) return 'ongoing';
    const ms = new Date(s.ended_at).getTime() - new Date(s.started_at).getTime();
    const m = Math.round(ms / 60000);
    return m < 1 ? '< 1 min' : `${m} min`;
  };

  return (
    <div className="page">
      <h1 className="page-title">conversations</h1>
      <p className="page-subtitle">past sessions with fumii</p>

      {sessions.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.4 }}>⌥</div>
          no conversations yet — open chat and say hello.
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 16, marginTop: 4, height: 'calc(100vh - 220px)', minHeight: 300 }}>
          {/* Session list */}
          <div
            className="scroll-panel"
            style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 }}
          >
            {sessions.map((s, i) => (
              <div
                key={s.id}
                id={`session-${s.id}`}
                onClick={() => openSession(s.id)}
                style={{
                  background: openId === s.id ? 'var(--color-surface-raised)' : 'var(--color-surface)',
                  border: `1px solid ${openId === s.id ? 'var(--color-amber-line)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  cursor: 'pointer',
                  transition: 'border-color 120ms ease, background 120ms ease',
                  animationDelay: `${i * 25}ms`
                }}
                onMouseEnter={(e) => { if (openId !== s.id) (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-2)'; }}
                onMouseLeave={(e) => { if (openId !== s.id) (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)'; }}
              >
                <div style={{ fontSize: 12, color: 'var(--color-text-primary)', marginBottom: 4 }}>
                  {new Date(s.started_at).toLocaleString(undefined, {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span className="tag-amber" style={{ fontSize: 10 }}>{s.mode}</span>
                  <span className="tag" style={{ fontSize: 10 }}>{s.turn_count} turns</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-3)' }}>
                    {duration(s)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Transcript panel */}
          {openId ? (
            <div
              className="scroll-panel"
              style={{
                flex: 1,
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 6
              }}
            >
              {loading && (
                <div style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>loading...</div>
              )}
              {!loading && transcript.length === 0 && (
                <div style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
                  transcripts disabled in settings
                </div>
              )}
              {transcript.map((t) => (
                <div
                  key={t.id}
                  className={t.role === 'user' ? 'transcript-user' : 'transcript-assistant'}
                >
                  <strong style={{ opacity: 0.6, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)' }}>
                    {t.role === 'user' ? 'you' : 'fumii'}
                  </strong>
                  <div style={{ marginTop: 2 }}>{t.content}</div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-secondary)',
                fontSize: 13,
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              select a session to view the transcript
            </div>
          )}
        </div>
      )}
    </div>
  );
}
