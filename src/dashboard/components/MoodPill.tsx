import React from 'react'

const MOOD_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  happy:   { bg: 'rgba(202,255,166,0.1)', color: '#CAFFA6', label: 'happy' },
  stressed:{ bg: 'rgba(255,107,107,0.1)', color: '#FF6B6B', label: 'stressed' },
  tired:   { bg: 'rgba(169,224,241,0.1)', color: '#A9E0F1', label: 'tired' },
  neutral: { bg: 'rgba(158,154,142,0.1)', color: '#9E9A8E', label: 'neutral' },
  excited: { bg: 'rgba(245,166,35,0.1)',  color: '#F5A623', label: 'excited' }
}

interface MoodPillProps {
  signal: string
  large?: boolean
}

export function MoodPill({ signal, large = false }: MoodPillProps) {
  const cfg = MOOD_CONFIG[signal] || MOOD_CONFIG.neutral

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      background: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.color}30`,
      borderRadius: large ? 8 : 6,
      padding: large ? '6px 14px' : '3px 9px',
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: large ? 15 : 12,
      fontWeight: large ? 600 : 400,
      letterSpacing: '-0.01em'
    }}>
      <span style={{
        width: large ? 8 : 5,
        height: large ? 8 : 5,
        borderRadius: '50%',
        background: cfg.color,
        flexShrink: 0
      }} />
      {cfg.label}
    </span>
  )
}
