import React, { useState, useEffect } from 'react'
import { Page } from './DashboardApp'

interface SidebarProps {
  currentPage: Page
  onNavigate: (page: Page) => void
}

// ── Consistent SVG icon set ────────────────────────────────────────────────
// All icons: 16×16 viewport, 1.5px stroke, round caps/joins, no fill.
// Same visual weight across all five nav items.

const S = { fill: 'none', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

const IconHome = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" {...S}>
    <path d="M3 12L12 3l9 9" />
    <path d="M9 21V12h6v9" />
    <path d="M3 12v9h18v-9" />
  </svg>
)

const IconMemory = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" {...S}>
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <path d="M6 6V4" /><path d="M10 6V4" /><path d="M14 6V4" /><path d="M18 6V4" />
    <path d="M6 18v2" /><path d="M10 18v2" /><path d="M14 18v2" /><path d="M18 18v2" />
    <path d="M6 11h.01M10 11h.01M14 11h.01M18 11h.01M6 14h.01M10 14h.01M14 14h.01M18 14h.01" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const IconMood = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" {...S}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 14s1 1.5 3.5 1.5 3.5-1.5 3.5-1.5" />
    <line x1="9" y1="9.5" x2="9.01" y2="9.5" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="15" y1="9.5" x2="15.01" y2="9.5" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
)

const IconConversations = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" {...S}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)

const IconSettings = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" {...S}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

const NAV_ITEMS: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: 'home',          label: 'Home',          icon: <IconHome /> },
  { id: 'memory',        label: 'Memory',        icon: <IconMemory /> },
  { id: 'mood',          label: 'Mood',          icon: <IconMood /> },
  { id: 'conversations', label: 'Conversations', icon: <IconConversations /> },
  { id: 'settings',      label: 'Settings',      icon: <IconSettings /> }
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
      width: 220,
      height: '100%',
      background: 'var(--color-bg)',
      borderRight: '1px solid var(--color-border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 0',
      flexShrink: 0,
      overflow: 'hidden'
    }}>
      {/* fumii wordmark */}
      <div style={{
        padding: '0 20px 24px',
        marginBottom: 8,
        flexShrink: 0
      }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 22,
          fontWeight: 700,
          color: 'var(--color-primary)',
          letterSpacing: '-0.03em'
        }}>fumii</div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 11,
          color: 'var(--color-text-secondary)',
          letterSpacing: '0.02em',
          marginTop: 3,
          opacity: 0.8
        }}>you're never really alone</div>
      </div>

      {/* Nav items — scrollable so they never push agent panel off-screen */}
      <nav style={{ flex: 1, padding: '0 10px', overflowY: 'auto', minHeight: 0 }}>
        {NAV_ITEMS.map(item => {
          const active = currentPage === item.id
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
                  ? 'var(--color-primary-soft)'
                  : hovered
                    ? 'rgba(45, 107, 177, 0.05)'
                    : 'transparent',
                border: 'none',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                color: active ? 'var(--color-primary)' : hovered ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                fontFamily: 'var(--font-display)',
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                textAlign: 'left',
                marginBottom: 2,
                transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              <span style={{
                fontSize: 14,
                opacity: active ? 1 : 0.6,
                transition: 'opacity 180ms'
              }}>{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Agent Controls — always pinned at bottom, flexShrink:0 prevents it from being pushed off-screen */}
      <div style={{
        padding: '12px 14px 12px',
        flexShrink: 0,
        borderTop: '1px solid var(--color-border)',
        marginTop: 8
      }}>
        <div style={{
          fontSize: 10,
          fontFamily: 'var(--font-display)',
          color: 'var(--color-text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 8,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          <span style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: lennyStatus === 'awake' ? '#34C749' : 'var(--color-text-secondary)',
            display: 'inline-block',
            animation: lennyStatus === 'awake' ? 'pulse-dot 2s ease-in-out infinite' : 'none'
          }} />
          agent · {lennyStatus === 'awake' ? 'active' : 'sleeping'}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => window.fumiiAPI?.sprite?.wake()}
            style={{
              flex: 1,
              background: lennyStatus === 'awake' ? 'var(--color-surface-raised)' : 'var(--color-primary-soft)',
              border: '1px solid var(--color-border)',
              color: lennyStatus === 'awake' ? 'var(--color-text-secondary)' : 'var(--color-primary)',
              padding: '7px 0',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 12,
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              transition: 'all 180ms ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--color-accent)'
              e.currentTarget.style.color = 'var(--color-text-primary)'
              e.currentTarget.style.borderColor = 'var(--color-accent)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = lennyStatus === 'awake' ? 'var(--color-surface-raised)' : 'var(--color-primary-soft)'
              e.currentTarget.style.color = lennyStatus === 'awake' ? 'var(--color-text-secondary)' : 'var(--color-primary)'
              e.currentTarget.style.borderColor = 'var(--color-border)'
            }}
          >
            ☀ wake
          </button>
          <button
            onClick={() => window.fumiiAPI?.sprite?.sleep()}
            style={{
              flex: 1,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-secondary)',
              padding: '7px 0',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 12,
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              transition: 'all 180ms ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(229, 62, 62, 0.08)'
              e.currentTarget.style.color = 'var(--color-danger)'
              e.currentTarget.style.borderColor = 'rgba(229, 62, 62, 0.2)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--color-surface)'
              e.currentTarget.style.color = 'var(--color-text-secondary)'
              e.currentTarget.style.borderColor = 'var(--color-border)'
            }}
          >
            🌙 sleep
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '8px 20px 0',
        flexShrink: 0,
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        color: 'var(--color-text-secondary)',
        letterSpacing: '0.04em',
        opacity: 0.6
      }}>
        v1.0.4 — phase 1
      </div>
    </aside>
  )
}
