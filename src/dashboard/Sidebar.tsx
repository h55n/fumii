import React from 'react';

/* ── Uniform 16px SVG icons ─────────────────────────────────────────────────
   All icons share: viewBox 0 0 24 24, strokeWidth 1.5, currentColor.
   Active = filled variant, Inactive = outline variant.                       */

function IconHome({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {filled ? (
        <path d="M3 9.5L12 3l9 6.5V20a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 20V9.5z" fill="currentColor" stroke="none" />
      ) : (
        <>
          <path d="M3 9.5L12 3l9 6.5V20a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 20V9.5z" />
          <path d="M9 21.5V14h6v7.5" />
        </>
      )}
    </svg>
  );
}

function IconMemory({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {filled ? (
        <>
          <circle cx="12" cy="12" r="9" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="3" fill="var(--color-bg)" stroke="none" />
        </>
      ) : (
        <>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="3" />
          <line x1="12" y1="3" x2="12" y2="9" />
          <line x1="12" y1="15" x2="12" y2="21" />
        </>
      )}
    </svg>
  );
}

function IconMood({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" fill={filled ? 'currentColor' : 'none'} />
      {!filled && (
        <>
          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
          <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5" />
          <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5" />
        </>
      )}
      {filled && (
        <>
          <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="var(--color-bg)" fill="none" />
          <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5" stroke="var(--color-bg)" />
          <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5" stroke="var(--color-bg)" />
        </>
      )}
    </svg>
  );
}

function IconConversations({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {filled ? (
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" fill="currentColor" stroke="none" />
      ) : (
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
      )}
    </svg>
  );
}

function IconPets({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {filled ? (
        <>
          <circle cx="7" cy="6" r="2.5" fill="currentColor" stroke="none" />
          <circle cx="17" cy="6" r="2.5" fill="currentColor" stroke="none" />
          <circle cx="4.5" cy="13" r="2.5" fill="currentColor" stroke="none" />
          <circle cx="19.5" cy="13" r="2.5" fill="currentColor" stroke="none" />
          <path d="M12 22c-3 0-5.5-2.5-5.5-5.5 0-2 1.5-3.5 3-4.5a4 4 0 015 0c1.5 1 3 2.5 3 4.5 0 3-2.5 5.5-5.5 5.5z" fill="currentColor" stroke="none" />
        </>
      ) : (
        <>
          <circle cx="7" cy="6" r="2.5" />
          <circle cx="17" cy="6" r="2.5" />
          <circle cx="4.5" cy="13" r="2.5" />
          <circle cx="19.5" cy="13" r="2.5" />
          <path d="M12 22c-3 0-5.5-2.5-5.5-5.5 0-2 1.5-3.5 3-4.5a4 4 0 015 0c1.5 1 3 2.5 3 4.5 0 3-2.5 5.5-5.5 5.5z" />
        </>
      )}
    </svg>
  );
}

function IconDevice({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {filled ? (
        <>
          <rect x="2" y="3" width="20" height="14" rx="2" fill="currentColor" stroke="none" />
          <line x1="8" y1="21" x2="16" y2="21" stroke="currentColor" />
          <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" />
        </>
      ) : (
        <>
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </>
      )}
    </svg>
  );
}

function IconSettings({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" fill={filled ? 'currentColor' : 'none'} />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1.08-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1.08 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.6.84 1 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

function IconSystemTest({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {filled ? (
        <>
          <path d="M9 3v2.5L6 10v1h12v-1l-3-4.5V3" />
          <rect x="5" y="11" width="14" height="10" rx="1.5" fill="currentColor" stroke="none" />
          <path d="M9 3h6" />
          <line x1="9" y1="16" x2="15" y2="16" stroke="var(--color-bg)" strokeWidth="1.5" />
        </>
      ) : (
        <>
          <path d="M9 3v2.5L6 10v1h12v-1l-3-4.5V3" />
          <rect x="5" y="11" width="14" height="10" rx="1.5" />
          <path d="M9 3h6" />
          <line x1="9" y1="16" x2="15" y2="16" />
        </>
      )}
    </svg>
  );
}

const NAV_ICONS: Record<string, (filled: boolean) => React.ReactNode> = {
  home: (f) => <IconHome filled={f} />,
  memory: (f) => <IconMemory filled={f} />,
  mood: (f) => <IconMood filled={f} />,
  conversations: (f) => <IconConversations filled={f} />,
  pets: (f) => <IconPets filled={f} />,
  device: (f) => <IconDevice filled={f} />,
  settings: (f) => <IconSettings filled={f} />,
  'system-test': (f) => <IconSystemTest filled={f} />,
};

const NAV = [
  { id: 'home',          label: 'Home' },
  { id: 'memory',        label: 'Memory' },
  { id: 'mood',          label: 'Mood' },
  { id: 'conversations', label: 'Conversations' },
  { id: 'pets',          label: 'Pets' },
  { id: 'device',        label: 'Device' },
  { id: 'settings',      label: 'Settings' },
  { id: 'system-test',   label: 'System Test' },
] as const;

interface Props {
  active: string;
  onSelect: (id: string) => void;
}

export function Sidebar({ active, onSelect }: Props) {
  return (
    <aside
      style={{
        width: 220,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'transparent',
        padding: '36px 18px 24px 28px',
        userSelect: 'none'
      }}
    >
      {/* Brand mark */}
      <div style={{ marginBottom: 36, WebkitAppRegion: 'drag' } as React.CSSProperties}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 28,
            color: 'var(--color-blue)',
            letterSpacing: '-0.03em',
            lineHeight: 1
          }}
        >
          fumii
        </div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 12,
            color: 'var(--color-text-secondary)',
            marginTop: 6,
            letterSpacing: '-0.01em'
          }}
        >
          you're never really alone
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV.map(({ id, label }) => {
          const isActive = active === id;
          return (
            <div
              key={id}
              onClick={() => onSelect(id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSelect(id)}
              id={`nav-${id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--color-blue)' : 'var(--color-text-secondary)',
                background: isActive ? 'var(--color-surface-active)' : 'transparent',
                cursor: 'pointer',
                transition: 'all 140ms ease'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'var(--color-surface)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--color-text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)';
                }
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, flexShrink: 0, color: isActive ? 'var(--color-blue)' : 'var(--color-text-3)' }}>
                {NAV_ICONS[id]?.(isActive)}
              </span>
              <span>{label}</span>
            </div>
          );
        })}
      </nav>

      {/* Quick Companion Summon Button */}
      <div style={{ marginTop: 'auto', paddingTop: 16 }}>
        <button
          onClick={() => window?.fumii?.showSprite?.()}
          id="summon-companion-btn"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-blue-soft)',
            border: '1px solid rgba(37, 99, 235, 0.25)',
            color: 'var(--color-blue)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 140ms ease'
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'var(--color-blue)';
            (e.currentTarget as HTMLElement).style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'var(--color-blue-soft)';
            (e.currentTarget as HTMLElement).style.color = 'var(--color-blue)';
          }}
          title="Bring your floating desktop companion to front"
        >
          <span>🐾</span>
          <span>Show Companion</span>
        </button>
      </div>
    </aside>
  );
}

