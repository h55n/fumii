import React, { useEffect, useState } from 'react';

const PAGE_TITLES: Record<string, string> = {
  home: 'home',
  memory: 'memory',
  mood: 'mood',
  conversations: 'conversations',
  device: 'fumii device',
  pets: 'pets',
  settings: 'settings',
};

export function TitleBar({ page }: { page?: string }) {
  const [mode, setMode] = useState<'companion' | 'assistant'>('companion');

  useEffect(() => {
    let off: (() => void) | undefined;
    try {
      window?.fumii?.getAllSettings?.()?.then((s: any) => {
        if (s?.active_mode === 'assistant') setMode('assistant');
      })?.catch(() => {});
      off = window?.fumii?.on?.('device:modeChanged', (m: string) => {
        setMode(m as 'companion' | 'assistant');
      });
    } catch {}
    return () => {
      if (typeof off === 'function') off();
    };
  }, []);

  return (
    <div
      style={{
        height: 42,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px 0 12px',
        WebkitAppRegion: 'drag',
        borderBottom: '1px solid var(--color-border)',
        flexShrink: 0,
        background: 'var(--color-bg)'
      } as React.CSSProperties}
    >
      {/* Left: logo + current page */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <img
          src="./icon.png"
          style={{ width: 18, height: 18, borderRadius: 4, objectFit: 'contain' }}
          alt="fumii logo"
        />
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            color: 'var(--color-amber)',
            fontSize: 13,
            letterSpacing: '0.05em'
          }}
        >
          fumii
        </span>
        {page && PAGE_TITLES[page] && (
          <>
            <span style={{ color: 'var(--color-border-2)', fontSize: 14 }}>›</span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--color-text-secondary)',
                letterSpacing: '0.08em'
              }}
            >
              {PAGE_TITLES[page]}
            </span>
          </>
        )}
      </div>

      {/* Right: mode badge + window controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          WebkitAppRegion: 'no-drag'
        } as React.CSSProperties}
      >
        {/* Mode badge */}
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '3px 7px',
            borderRadius: 4,
            background: mode === 'companion' ? 'var(--color-amber-dim)' : 'var(--color-blue-dim)',
            color: mode === 'companion' ? 'var(--color-amber)' : 'var(--color-blue)',
            border: `1px solid ${mode === 'companion' ? 'var(--color-amber-line)' : 'rgba(169,224,241,0.18)'}`,
            lineHeight: 1
          }}
        >
          {mode}
        </span>

        {/* Window controls */}
        <button
          id="titlebar-minimize"
          onClick={() => window.fumii.minimizeDashboard()}
          style={ctrlBtn}
          title="Minimize"
        >
          –
        </button>
        <button
          id="titlebar-maximize"
          onClick={() => window.fumii.maximizeDashboard()}
          style={ctrlBtn}
          title="Maximize"
        >
          ▢
        </button>
        <button
          id="titlebar-close"
          onClick={() => window.fumii.closeDashboard()}
          style={{ ...ctrlBtn, color: 'var(--color-danger)' }}
          title="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
}

const ctrlBtn: React.CSSProperties = {
  width: 28,
  height: 24,
  border: 'none',
  background: 'transparent',
  color: 'var(--color-text-3)',
  cursor: 'pointer',
  borderRadius: 4,
  fontSize: 14,
  lineHeight: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'color 120ms ease, background 120ms ease'
};
