import React, { useState, useEffect } from 'react'
import { Page } from './DashboardApp'

interface SidebarProps {
  currentPage: Page
  onNavigate: (page: Page) => void
}

// SVG icons — clean, minimal, consistent stroke width
const ICONS: Record<string, React.ReactNode> = {
  home: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  memory: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 1 0 10 10"/>
      <path d="M12 6v6l4 2"/>
      <path d="M20 2v6h-6"/>
    </svg>
  ),
  mood: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
      <line x1="9" y1="9" x2="9.01" y2="9"/>
      <line x1="15" y1="9" x2="15.01" y2="9"/>
    </svg>
  ),
  conversations: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  settings: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
}

const NAV_ITEMS: { id: Page; label: string }[] = [
  { id: 'home',          label: 'Home'          },
  { id: 'memory',        label: 'Memory'        },
  { id: 'mood',          label: 'Mood'          },
  { id: 'conversations', label: 'Conversations' },
  { id: 'settings',      label: 'Settings'      },
]

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [lennyStatus, setLennyStatus] = useState<'awake' | 'sleeping'>('awake')

  useEffect(() => {
    window.fumiiAPI?.on('sprite:status', (...args: unknown[]) => {
      setLennyStatus(args[0] as 'awake' | 'sleeping')
    })
  }, [])

  return (
    <aside style={{
      width: 224,
      height: '100%',
      background: 'var(--color-sidebar, #0A0C11)',
      borderRight: '1px solid var(--color-sidebar-border, rgba(255,255,255,0.06))',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      overflow: 'hidden',
      position: 'relative',
    }}>

      {/* Subtle top glow */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 120,
        background: 'radial-gradient(ellipse at 50% 0%, rgba(124,110,250,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Wordmark */}
      <div style={{
        padding: '28px 20px 24px',
        flexShrink: 0,
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: '-0.04em',
          background: 'linear-gradient(135deg, #A78BFA 0%, #7C6EFA 50%, #EC4899 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1,
          marginBottom: 6,
        }}>fumii</div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 10.5,
          color: 'var(--color-text-secondary)',
          letterSpacing: '0.01em',
          fontWeight: 400,
        }}>you're never really alone</div>
      </div>

      {/* Divider */}
      <div style={{
        height: 1,
        margin: '0 16px 12px',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
        flexShrink: 0,
      }} />

      {/* Nav */}
      <nav style={{
        flex: 1,
        padding: '4px 10px',
        overflowY: 'auto',
        minHeight: 0,
        position: 'relative',
        zIndex: 1,
      }}>
        {NAV_ITEMS.map(item => {
          const active  = currentPage === item.id
          const hovered = hoveredItem === item.id

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              style={{
                width: '100%',
                padding: '9px 12px',
                background: active
                  ? 'rgba(124, 110, 250, 0.14)'
                  : hovered
                    ? 'rgba(255, 255, 255, 0.04)'
                    : 'transparent',
                border: 'none',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                color: active
                  ? '#A78BFA'
                  : hovered
                    ? 'rgba(240, 242, 255, 0.85)'
                    : 'var(--color-text-secondary)',
                fontFamily: 'var(--font-display)',
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                textAlign: 'left',
                marginBottom: 2,
                transition: 'all 160ms cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
              }}
            >
              {/* Active left-bar indicator */}
              {active && (
                <span style={{
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 3,
                  height: 20,
                  borderRadius: '0 3px 3px 0',
                  background: 'linear-gradient(180deg, #A78BFA, #7C6EFA)',
                  boxShadow: '0 0 8px rgba(124,110,250,0.5)',
                }} />
              )}
              <span style={{
                opacity: active ? 1 : hovered ? 0.7 : 0.45,
                transition: 'opacity 160ms',
                display: 'flex',
                alignItems: 'center',
              }}>
                {ICONS[item.id]}
              </span>
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Agent Controls */}
      <div style={{
        padding: '12px 12px 14px',
        flexShrink: 0,
        borderTop: '1px solid rgba(255,255,255,0.05)',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Agent status label */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          marginBottom: 10,
          padding: '0 2px',
        }}>
          <span style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: lennyStatus === 'awake' ? '#34D399' : 'rgba(255,255,255,0.2)',
            display: 'inline-block',
            flexShrink: 0,
            boxShadow: lennyStatus === 'awake' ? '0 0 6px rgba(52, 211, 153, 0.6)' : 'none',
            animation: lennyStatus === 'awake' ? 'pulse-dot 2.5s ease-in-out infinite' : 'none',
          }} />
          <span style={{
            fontSize: 10,
            fontFamily: 'var(--font-display)',
            color: 'var(--color-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontWeight: 500,
          }}>
            agent · <span style={{ color: lennyStatus === 'awake' ? '#34D399' : 'var(--color-text-muted, rgba(240,242,255,0.25))' }}>
              {lennyStatus === 'awake' ? 'active' : 'sleeping'}
            </span>
          </span>
        </div>

        {/* Wake / Sleep buttons */}
        <div style={{ display: 'flex', gap: 6 }}>
          <AgentButton
            label="Wake"
            emoji="☀"
            onClick={() => window.fumiiAPI?.sprite?.wake()}
            variant={lennyStatus === 'awake' ? 'active' : 'primary'}
          />
          <AgentButton
            label="Sleep"
            emoji="🌙"
            onClick={() => window.fumiiAPI?.sprite?.sleep()}
            variant="danger"
          />
        </div>
      </div>

      {/* Footer version */}
      <div style={{
        padding: '6px 16px 12px',
        flexShrink: 0,
        fontFamily: 'var(--font-mono)',
        fontSize: 9.5,
        color: 'var(--color-text-muted, rgba(240,242,255,0.2))',
        letterSpacing: '0.06em',
        position: 'relative',
        zIndex: 1,
      }}>
        v1.0.5 · phase 1
      </div>
    </aside>
  )
}

// ─── Sub-component: agent action button ─────────────────────────────────────

interface AgentButtonProps {
  label: string
  emoji: string
  onClick: () => void
  variant: 'primary' | 'active' | 'danger'
}

function AgentButton({ label, emoji, onClick, variant }: AgentButtonProps) {
  const [hov, setHov] = useState(false)

  const bg = hov
    ? variant === 'danger'
      ? 'rgba(248, 113, 113, 0.12)'
      : 'rgba(124, 110, 250, 0.18)'
    : variant === 'active'
      ? 'rgba(255,255,255,0.04)'
      : 'rgba(124, 110, 250, 0.08)'

  const col = hov
    ? variant === 'danger'
      ? '#F87171'
      : '#A78BFA'
    : variant === 'active'
      ? 'rgba(240,242,255,0.35)'
      : '#7C6EFA'

  const border = hov
    ? variant === 'danger'
      ? 'rgba(248, 113, 113, 0.25)'
      : 'rgba(124,110,250,0.35)'
    : 'rgba(255,255,255,0.07)'

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flex: 1,
        background: bg,
        border: `1px solid ${border}`,
        color: col,
        padding: '7px 0',
        borderRadius: 7,
        cursor: 'pointer',
        fontSize: 11.5,
        fontFamily: 'var(--font-display)',
        fontWeight: 500,
        transition: 'all 160ms ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        letterSpacing: '0.01em',
      }}
    >
      <span style={{ fontSize: 12 }}>{emoji}</span>
      {label}
    </button>
  )
}
