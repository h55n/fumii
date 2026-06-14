import React from 'react'
import { MoodLog } from '../../memory/types'

const MOOD_VALUES: Record<string, number> = {
  excited: 5,
  happy: 4,
  neutral: 3,
  tired: 2,
  stressed: 1
}

const MOOD_COLORS: Record<string, string> = {
  excited: '#F5A623',
  happy: '#CAFFA6',
  neutral: '#A9E0F1',
  tired: '#9E9A8E',
  stressed: '#FF6B6B'
}

interface MoodChartProps {
  moods: MoodLog[]
}

export function MoodChart({ moods }: MoodChartProps) {
  if (moods.length < 2) {
    return (
      <div style={{
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: 13,
        color: '#9E9A8E',
        padding: '20px 0'
      }}>need at least 2 days of data to show the arc</div>
    )
  }

  const width = 600
  const height = 120
  const padding = { top: 10, right: 20, bottom: 30, left: 30 }

  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Newest first from DB — reverse for left-to-right chart
  const sorted = [...moods].reverse().slice(-30)
  const n = sorted.length

  const xScale = (i: number) => padding.left + (i / (n - 1)) * chartWidth
  const yScale = (v: number) => padding.top + chartHeight - ((v - 1) / 4) * chartHeight

  const points = sorted.map((m, i) => ({
    x: xScale(i),
    y: yScale(MOOD_VALUES[m.signal] || 3),
    signal: m.signal,
    date: m.date
  }))

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`

  // Y-axis labels
  const yLabels = [
    { value: 5, label: 'excited' },
    { value: 4, label: 'happy' },
    { value: 3, label: 'neutral' },
    { value: 2, label: 'tired' },
    { value: 1, label: 'stressed' }
  ]

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      {/* Grid lines */}
      {yLabels.map(({ value, label }) => (
        <g key={value}>
          <line
            x1={padding.left} y1={yScale(value)}
            x2={padding.left + chartWidth} y2={yScale(value)}
            stroke="rgba(255,255,255,0.04)" strokeWidth={1}
          />
          <text
            x={padding.left - 6} y={yScale(value)}
            textAnchor="end" dominantBaseline="middle"
            fill="#9E9A8E"
            style={{ fontFamily: 'Departure Mono, monospace', fontSize: 8 }}
          >{label}</text>
        </g>
      ))}

      {/* Area fill */}
      <defs>
        <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F5A623" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#F5A623" stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#area-grad)" />

      {/* Line */}
      <path d={pathD} fill="none" stroke="#F5A623" strokeWidth={1.5} strokeLinejoin="round" />

      {/* Points */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x} cy={p.y} r={3}
          fill={MOOD_COLORS[p.signal] || '#F5A623'}
          stroke="#0F0F14"
          strokeWidth={1.5}
        >
          <title>{p.date}: {p.signal}</title>
        </circle>
      ))}

      {/* X-axis date labels (first, middle, last) */}
      {[0, Math.floor(n / 2), n - 1].filter((v, i, a) => a.indexOf(v) === i).map(i => (
        <text
          key={i}
          x={points[i].x}
          y={height - 4}
          textAnchor="middle"
          fill="#9E9A8E"
          style={{ fontFamily: 'Departure Mono, monospace', fontSize: 8 }}
        >
          {new Date(sorted[i].date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </text>
      ))}
    </svg>
  )
}
