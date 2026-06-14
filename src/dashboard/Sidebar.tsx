import React, { useState, useEffect } from 'react'
import { Page } from './DashboardApp'

interface SidebarProps {
  currentPage: Page
  onNavigate: (page: Page) => void
}

const NAV_ITEMS: { id: Page; label: string; icon: string }[] = [
  { id: 'home',          label: 'Home',          icon: '◈' },
  { id: 'memory',        label: 'Memory',         icon: '◇' },
  { id: 'mood',          label: 'Mood',           icon: '◌' },
  { id: 'conversations', label: 'Conversations',  icon: '◎' },
  { id: 'settings',      label: 'Settings',       icon: '◉' }
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
      background: 'var(--color-bg)',
      borderRight: '1px solid var(--color-border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 0',
      flexShrink: 0
    }}>
      {/* fumii wordmark */}
      <div style={{
        padding: '0 20px 24px',
        marginBottom: 8
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

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '0 10px' }}>
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

      {/* Lenny Controls */}
      <div style={{
        padding: '0 14px',
        marginBottom: 16
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
          Lenny · {lennyStatus === 'awake' ? 'Active' : 'Sleeping'}
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
            ☀ Wake
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
            🌙 Sleep
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 20px 0',
        borderTop: '1px solid var(--color-border)',
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        color: 'var(--color-text-secondary)',
        letterSpacing: '0.04em',
        opacity: 0.6
      }}>
        v1.0.0 — phase 1
      </div>
    </aside>
  )
}
