import React, { useEffect, useState } from 'react'
import { Episode, Transcript } from '../../memory/types'
import { MoodPill } from '../components/MoodPill'
import { TranscriptView } from '../components/TranscriptView'

export function Conversations() {
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [selected, setSelected] = useState<Episode | null>(null)
  const [transcripts, setTranscripts] = useState<Transcript[]>([])
  const [loading, setLoading] = useState(true)
  const [transcriptKey, setTranscriptKey] = useState(0)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await window.fumiiAPI.memory.getEpisodes(50)
        setEpisodes(data || [])
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const handleSelect = async (ep: Episode) => {
    setSelected(ep)
    setTranscriptKey(k => k + 1)
    try {
      const tx = await window.fumiiAPI.memory.getTranscripts(ep.id)
      setTranscripts(tx || [])
    } catch {
      setTranscripts([])
    }
  }

  if (loading) return (
    <div style={{
      color: 'var(--color-text-secondary)',
      fontFamily: 'var(--font-display)',
      textAlign: 'center',
      padding: '60px 0',
      fontSize: 14
    }}>loading...</div>
  )

  return (
    <div style={{ maxWidth: 800 }}>
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 28,
        fontWeight: 600,
        letterSpacing: '-0.025em',
        color: 'var(--color-text-primary)',
        margin: '0 0 6px'
      }}>conversations</h1>
      <p style={{
        fontFamily: 'var(--font-display)',
        fontSize: 14,
        color: 'var(--color-text-secondary)',
        margin: '0 0 28px'
      }}>your conversation history with fumii</p>

      {episodes.length === 0 ? (
        <div className="card" style={{
          padding: 36,
          textAlign: 'center',
          color: 'var(--color-text-secondary)',
          fontFamily: 'var(--font-display)',
          fontSize: 14,
          lineHeight: 1.8
        }}>no conversations logged yet</div>
      ) : (
        <div style={{ display: 'flex', gap: 16 }}>
          {/* List */}
          <div style={{
            width: 280,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            flexShrink: 0
          }}>
            {episodes.map((ep, i) => {
              const isSelected = selected?.id === ep.id
              return (
                <button
                  key={ep.id}
                  onClick={() => handleSelect(ep)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: isSelected ? 'var(--color-primary-soft)' : 'var(--color-surface)',
                    border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    borderRadius: 10,
                    padding: '14px 16px',
                    cursor: 'pointer',
                    transition: 'all 180ms ease',
                    animation: `slideUp 400ms cubic-bezier(0.16, 1, 0.3, 1) ${i * 40}ms forwards`,
                    opacity: 0,
                    transform: isSelected ? 'scale(1)' : undefined
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) e.currentTarget.style.borderColor = 'rgba(45,107,177,0.3)'
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) e.currentTarget.style.borderColor = 'var(--color-border)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                    <MoodPill signal={ep.mood_signal} />
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      color: 'var(--color-text-secondary)'
                    }}>
                      {new Date(ep.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 12,
                    color: 'var(--color-text-primary)',
                    margin: 0,
                    lineHeight: 1.5,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>{ep.summary}</p>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--color-text-secondary)',
                    marginTop: 6
                  }}>{ep.turn_count} turns</div>
                </button>
              )
            })}
          </div>

          {/* Transcript */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {selected ? (
              <div
                key={transcriptKey}
                className="card"
                style={{
                  padding: '20px 24px',
                  animation: 'scaleIn 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards'
                }}
              >
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 12,
                  color: 'var(--color-text-secondary)',
                  marginBottom: 16,
                  fontWeight: 500
                }}>
                  {new Date(selected.created_at).toLocaleDateString('en-US', {
                    weekday: 'long', month: 'long', day: 'numeric'
                  })} · {selected.turn_count} turns
                </div>
                {transcripts.length > 0 ? (
                  <TranscriptView transcripts={transcripts} />
                ) : (
                  <p style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 14,
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.6
                  }}>
                    transcript not saved for this session.<br />
                    <em style={{ fontSize: 12 }}>summary: {selected.summary}</em>
                  </p>
                )}
              </div>
            ) : (
              <div className="card" style={{
                padding: 36,
                textAlign: 'center',
                color: 'var(--color-text-secondary)',
                fontFamily: 'var(--font-display)',
                fontSize: 14
              }}>select a conversation to view</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
