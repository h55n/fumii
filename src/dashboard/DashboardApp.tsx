import React, { useState, useEffect, useRef } from 'react'
import { Sidebar } from './Sidebar'
import { Home } from './pages/Home'
import { Memory } from './pages/Memory'
import { MoodTimeline } from './pages/MoodTimeline'
import { Conversations } from './pages/Conversations'
import { Settings } from './pages/Settings'
import { useSettingsStore } from '../store/settingsStore'

export type Page = 'home' | 'memory' | 'mood' | 'conversations' | 'settings'

export function DashboardApp() {
  const [page, setPage] = useState<Page>('home')
  const [pageKey, setPageKey] = useState(0)
  const { load }        = useSettingsStore()

  useEffect(() => {
    load()

    // Listen for navigation events pushed from main (e.g. tray → Settings)
    window.fumiiAPI?.on('navigate', (...args: unknown[]) => {
      const path = args[0]
      if (path === '/settings') handleNavigate('settings')
    })

    // Re-load data after memory clear
    window.fumiiAPI?.on('memory:cleared', () => {
      handleNavigate('home')
    })
  }, [])

  const handleNavigate = (p: Page) => {
    setPage(p)
    setPageKey(k => k + 1)  // force re-mount for animation
  }

  const renderPage = () => {
    switch (page) {
      case 'home':          return <Home onNavigate={handleNavigate} />
      case 'memory':        return <Memory />
      case 'mood':          return <MoodTimeline />
      case 'conversations': return <Conversations />
      case 'settings':      return <Settings />
      default:              return <Home onNavigate={handleNavigate} />
    }
  }

  return (
    <div style={{
      display:    'flex',
      height:     '100vh',
      background: 'var(--color-bg)',
      color:      'var(--color-text-primary)',
      fontFamily: 'var(--font-display)',
      overflow:   'hidden'
    }}>

      {/* Custom frameless title bar */}
      <div
        className="drag-region"
        style={{
          position:   'fixed',
          top: 0, left: 0, right: 0,
          height:     38,
          background: 'var(--color-bg)',
          display:    'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding:    '0 16px',
          zIndex:     200,
          borderBottom: '1px solid var(--color-border)'
        }}
      >
        <span style={{
          fontFamily:    'var(--font-display)',
          fontSize:       13,
          fontWeight:     700,
          color:          'var(--color-primary)',
          letterSpacing: '-0.02em'
        }}>fumii</span>

        {/* Window controls — macOS-style dots */}
        <div className="no-drag" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {([
            { color: '#FDBC40', action: 'minimize' },
            { color: '#34C749', action: 'maximize' },
            { color: '#FC5753', action: 'close' }
          ] as const).map(({ color, action }) => (
            <button
              key={action}
              onClick={() => {
                if (action === 'minimize') window.fumiiAPI.window.minimize()
                else if (action === 'maximize') window.fumiiAPI.window.maximize()
                else window.fumiiAPI.window.close()
              }}
              style={{
                width:        12,
                height:       12,
                borderRadius: '50%',
                background:   color,
                border:       'none',
                cursor:       'pointer',
                padding:      0,
                transition:   'opacity 150ms, transform 150ms'
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; e.currentTarget.style.transform = 'scale(1.15)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)' }}
            />
          ))}
        </div>
      </div>

      {/* Main content area below titlebar */}
      <div style={{ display: 'flex', flex: 1, paddingTop: 38 }}>
        <Sidebar currentPage={page} onNavigate={handleNavigate} />
        <main style={{
          flex:          1,
          overflow:      'auto',
          padding:       '36px 44px',
          scrollbarWidth:'thin',
          scrollbarColor: 'var(--color-surface-raised) transparent'
        }}>
          {/* Page transition wrapper */}
          <div key={pageKey} className="page-enter">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  )
}
