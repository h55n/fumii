import React from 'react'

interface TagChipProps {
  label: string
  variant?: 'green' | 'blue' | 'amber'
}

const VARIANT_STYLES = {
  green: {
    color: '#CAFFA6',
    background: 'rgba(202, 255, 166, 0.06)',
    border: '1px solid rgba(202, 255, 166, 0.18)'
  },
  blue: {
    color: '#A9E0F1',
    background: 'rgba(169, 224, 241, 0.06)',
    border: '1px solid rgba(169, 224, 241, 0.18)'
  },
  amber: {
    color: '#F5A623',
    background: 'rgba(245, 166, 35, 0.08)',
    border: '1px solid rgba(245, 166, 35, 0.2)'
  }
}

export function TagChip({ label, variant = 'green' }: TagChipProps) {
  const styles = VARIANT_STYLES[variant]

  return (
    <span style={{
      ...styles,
      fontFamily: 'Departure Mono, monospace',
      fontSize: 10,
      letterSpacing: '0.06em',
      borderRadius: 4,
      padding: '2px 8px',
      display: 'inline-block',
      lineHeight: 1.6
    }}>
      {label}
    </span>
  )
}
