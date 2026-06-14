import React, { useEffect, useState } from 'react'
import { MoodLog } from '../../memory/types'
import { MoodPill } from '../components/MoodPill'
import { MoodChart } from '../components/MoodChart'

export function MoodTimeline() {
  const [moods, setMoods] = useState<MoodLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await window.fumiiAPI.memory.getMoodLog(30)
        setMoods(data || [])
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const last7 = moods.slice(0, 7).reverse()

  return (
    <div style={{ maxWidth: 720 }}>
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 28,
        fontWeight: 600,
        letterSpacing: '-0.025em',
        color: 'var(--color-text-primary)',
        margin: '0 0 6px'
      }}>mood</h1>
      <p style={{
        fontFamily: 'var(--font-display)',
        fontSize: 14,
        color: 'var(--color-text-secondary)',
        margin: '0 0 28px'
      }}>how you've been feeling lately, as fumii reads it</p>

      {loading ? (
        <div style={{
          color: 'var(--color-text-secondary)',
          fontFamily: 'var(--font-display)',
          textAlign: 'center',
          padding: '40px 0',
          fontSize: 14
        }}>loading...</div>
      ) : moods.length === 0 ? (
        <div className="card" style={{
          padding: 36,
          textAlign: 'center',
          color: 'var(--color-text-secondary)',
          fontFamily: 'var(--font-display)',
          fontSize: 14,
          lineHeight: 1.8
        }}>no mood data yet — fumii will track patterns as you talk</div>
      ) : (
        <>
          {/* 7-day pill row */}
          <div className="card" style={{
            padding: '20px 24px',
            marginBottom: 16,
            animation: 'slideUp 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
            opacity: 0
          }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 11,
              color: 'var(--color-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 16,
              fontWeight: 500
            }}>last 7 days</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {last7.map((m, i) => (
                <div
                  key={m.date}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    animation: `scaleIn 300ms cubic-bezier(0.16, 1, 0.3, 1) ${i * 60}ms forwards`,
                    opacity: 0
                  }}
                >
                  <MoodPill signal={m.signal} />
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    color: 'var(--color-text-secondary)',
                    letterSpacing: '0.04em'
                  }}>
                    {new Date(m.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Area chart */}
          <div className="card" style={{
            padding: '20px 24px',
            animation: 'slideUp 400ms cubic-bezier(0.16, 1, 0.3, 1) 100ms forwards',
            opacity: 0
          }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 11,
              color: 'var(--color-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 16,
              fontWeight: 500
            }}>30-day arc</div>
            <MoodChart moods={moods} />
          </div>
        </>
      )}
    </div>
  )
}
