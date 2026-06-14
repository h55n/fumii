import React, { useState } from 'react'
import { Episode } from '../../memory/types'
import { MoodPill } from './MoodPill'

interface MemoryCardProps {
  episode: Episode
}

export function MemoryCard({ episode }: MemoryCardProps) {
  const [expanded, setExpanded] = useState(false)
  const date = new Date(episode.created_at).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric'
  })
  const tags = episode.tags.split(',').filter(Boolean)

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      style={{
        background: '#1A1A24',
        border: '1px solid rgba(255,255,255,0.04)',
        borderRadius: 12,
        padding: '16px 20px',
        cursor: 'pointer',
        transition: 'all 120ms',
        transform: expanded ? 'translateY(-1px)' : 'none',
        boxShadow: expanded ? '0 4px 20px rgba(0,0,0,0.3)' : 'none'
      }}
      onMouseEnter={e => {
        if (!expanded) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'
      }}
      onMouseLeave={e => {
        if (!expanded) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.04)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <MoodPill signal={episode.mood_signal} />
        <span style={{
          fontFamily: 'Departure Mono, monospace',
          fontSize: 10,
          color: '#9E9A8E',
          letterSpacing: '0.04em'
        }}>{date}</span>
      </div>

      <p style={{
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: 14,
        color: '#EEEAE0',
        lineHeight: 1.6,
        margin: '0 0 12px',
        overflow: expanded ? 'visible' : 'hidden',
        display: expanded ? 'block' : '-webkit-box',
        WebkitLineClamp: expanded ? undefined : 2,
        WebkitBoxOrient: 'vertical'
      }}>{episode.summary}</p>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {tags.map(tag => (
          <span key={tag} style={{
            fontFamily: 'Departure Mono, monospace',
            fontSize: 10,
            color: '#CAFFA6',
            background: 'rgba(202,255,166,0.06)',
            border: '1px solid rgba(202,255,166,0.18)',
            borderRadius: 4,
            padding: '2px 7px',
            letterSpacing: '0.06em'
          }}>{tag.trim()}</span>
        ))}
        <span style={{
          fontFamily: 'Departure Mono, monospace',
          fontSize: 10,
          color: '#9E9A8E',
          padding: '2px 0'
        }}>{episode.turn_count} turns</span>
      </div>
    </div>
  )
}
