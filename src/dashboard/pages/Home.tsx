import React, { useEffect, useState } from 'react'
import { Page } from '../DashboardApp'
import { MoodPill } from '../components/MoodPill'
import { CoreIdentity, Episode, MoodLog } from '../../memory/types'

interface HomeProps {
  onNavigate: (page: Page) => void
}

export function Home({ onNavigate }: HomeProps) {
  const [identity, setIdentity] = useState<CoreIdentity | null>(null)
  const [recentEpisode, setRecentEpisode] = useState<Episode | null>(null)
  const [todayMood, setTodayMood] = useState<MoodLog | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [id, episodes, moods] = await Promise.all([
          window.fumiiAPI.memory.getCoreIdentity(),
          window.fumiiAPI.memory.getEpisodes(1),
          window.fumiiAPI.memory.getMoodLog(1)
        ])
        setIdentity(id)
        setRecentEpisode(episodes?.[0] || null)
        setTodayMood(moods?.[0] || null)
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'good morning'
    if (hour < 17) return 'hey'
    return 'good evening'
  }

  const name = identity?.name
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  })

  if (loading) return (
    <div style={{
      color: 'var(--color-text-secondary)',
      fontFamily: 'var(--font-display)',
      padding: '60px 0',
      textAlign: 'center',
      fontSize: 14
    }}>loading...</div>
  )

  return (
    <div style={{ maxWidth: 680 }}>
      {/* Header */}
      <div className="stagger-1" style={{
        marginBottom: 36,
        animation: 'slideUp 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        opacity: 0
      }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 30,
          fontWeight: 600,
          letterSpacing: '-0.025em',
          color: 'var(--color-text-primary)',
          margin: 0
        }}>
          {greeting()}{name ? `, ${name}` : ''} ✦
        </h1>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: 14,
          color: 'var(--color-text-secondary)',
          margin: '6px 0 0'
        }}>{today}</p>
      </div>

      {/* Today's mood card */}
      <div className="card stagger-2" style={{
        padding: '20px 24px',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        animation: 'slideUp 400ms cubic-bezier(0.16, 1, 0.3, 1) 60ms forwards',
        opacity: 0,
        background: 'linear-gradient(135deg, var(--color-surface) 0%, rgba(186, 201, 141, 0.12) 100%)'
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 11,
            color: 'var(--color-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 8,
            fontWeight: 500
          }}>today's mood</div>
          <MoodPill signal={todayMood?.signal || 'neutral'} large />
        </div>
        <button
          onClick={() => onNavigate('mood')}
          style={{
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            color: 'var(--color-text-secondary)',
            fontFamily: 'var(--font-display)',
            fontSize: 12,
            padding: '7px 16px',
            cursor: 'pointer',
            transition: 'all 180ms ease',
            fontWeight: 500
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = 'var(--color-primary)'
            e.currentTarget.style.borderColor = 'var(--color-primary)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'var(--color-text-secondary)'
            e.currentTarget.style.borderColor = 'var(--color-border)'
          }}
        >view timeline →</button>
      </div>

      {/* Recent memory */}
      {recentEpisode && (
        <div className="card stagger-3" style={{
          padding: '20px 24px',
          marginBottom: 16,
          animation: 'slideUp 400ms cubic-bezier(0.16, 1, 0.3, 1) 120ms forwards',
          opacity: 0
        }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 11,
            color: 'var(--color-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 12,
            fontWeight: 500
          }}>last conversation</div>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: 14,
            color: 'var(--color-text-primary)',
            lineHeight: 1.65,
            margin: '0 0 12px'
          }}>{recentEpisode.summary}</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {recentEpisode.tags.split(',').filter(Boolean).map(tag => (
              <span key={tag} style={{
                color: 'var(--color-primary)',
                background: 'var(--color-primary-soft)',
                borderRadius: 99,
                fontSize: 10,
                fontFamily: 'var(--font-display)',
                fontWeight: 500,
                padding: '3px 10px',
                letterSpacing: '0.04em'
              }}>{tag.trim()}</span>
            ))}
          </div>
        </div>
      )}

      {/* No conversations yet */}
      {!recentEpisode && (
        <div className="card stagger-3" style={{
          padding: '36px 24px',
          textAlign: 'center',
          color: 'var(--color-text-secondary)',
          fontFamily: 'var(--font-display)',
          fontSize: 14,
          lineHeight: 1.8,
          animation: 'slideUp 400ms cubic-bezier(0.16, 1, 0.3, 1) 120ms forwards',
          opacity: 0
        }}>
          no conversations yet.<br />
          press <kbd style={{
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 5,
            padding: '2px 8px',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            fontWeight: 500
          }}>Ctrl+Shift+F</kbd> to say hi to fumii.
        </div>
      )}

      {/* Quick links */}
      <div style={{
        display: 'flex',
        gap: 10,
        marginTop: 8,
        animation: 'slideUp 400ms cubic-bezier(0.16, 1, 0.3, 1) 180ms forwards',
        opacity: 0
      }}>
        {[
          { label: 'view memories', page: 'memory' as Page },
          { label: 'all conversations', page: 'conversations' as Page }
        ].map(item => (
          <button
            key={item.page}
            onClick={() => onNavigate(item.page)}
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 99,
              color: 'var(--color-text-secondary)',
              fontFamily: 'var(--font-display)',
              fontSize: 12,
              fontWeight: 500,
              padding: '8px 18px',
              cursor: 'pointer',
              transition: 'all 180ms ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--color-primary-soft)'
              e.currentTarget.style.color = 'var(--color-primary)'
              e.currentTarget.style.borderColor = 'var(--color-primary)'
              e.currentTarget.style.transform = 'scale(1.02)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--color-surface)'
              e.currentTarget.style.color = 'var(--color-text-secondary)'
              e.currentTarget.style.borderColor = 'var(--color-border)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >{item.label} →</button>
        ))}
      </div>
    </div>
  )
}
