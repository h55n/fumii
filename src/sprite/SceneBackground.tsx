import React from 'react'

export function SceneBackground() {
  return (
    <div className="scene-bg" style={{
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      borderRadius: 24,
      background: 'linear-gradient(180deg, #0A0A12 0%, #0F0F1A 60%, #12121E 100%)'
    }}>
      {/* Window frame */}
      <div style={{
        position: 'absolute',
        top: 8,
        left: 10,
        width: 80,
        height: 60,
        background: '#0D1520',
        borderRadius: 3,
        border: '1px solid #1A2030',
        overflow: 'hidden'
      }}>
        {/* Rain streaks */}
        <div className="rain-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rain-streak" style={{
              position: 'absolute',
              top: 0,
              left: `${10 + i * 12}%`,
              width: 1,
              height: 12,
              background: 'rgba(169, 224, 241, 0.25)',
              animation: `rain ${0.6 + i * 0.1}s linear infinite`,
              animationDelay: `${i * 0.08}s`
            }} />
          ))}
        </div>
        {/* Stars visible through window */}
        {[
          { top: '15%', left: '20%' }, { top: '30%', left: '70%' },
          { top: '60%', left: '40%' }, { top: '20%', left: '55%' }
        ].map((pos, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: 1.5,
            height: 1.5,
            borderRadius: '50%',
            background: '#F7F9E1',
            opacity: 0.65,
            top: pos.top,
            left: pos.left,
            animation: `twinkle ${2 + i * 0.5}s ease-in-out infinite`
          }} />
        ))}
      </div>

      {/* Desk lamp */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: 16,
        width: 4,
        height: 40,
        background: '#2A2A3A',
        borderRadius: 2
      }}>
        {/* Lamp head */}
        <div style={{
          position: 'absolute',
          top: -6,
          left: -10,
          width: 22,
          height: 12,
          background: '#3A3A4A',
          borderRadius: '50% 50% 40% 40%',
          overflow: 'hidden'
        }} />
        {/* Lamp glow */}
        <div style={{
          position: 'absolute',
          top: 6,
          left: -40,
          width: 80,
          height: 80,
          background: 'radial-gradient(ellipse at top, rgba(245,166,35,0.12) 0%, transparent 70%)',
          animation: 'lamp-pulse 4s ease-in-out infinite'
        }} />
      </div>

      {/* Tiny plant pot */}
      <div style={{
        position: 'absolute',
        bottom: 36,
        left: 14,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Plant leaves */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 2 }}>
          <div style={{
            width: 6, height: 10,
            background: '#2A5A2A',
            borderRadius: '50% 50% 0 50%',
            transform: 'rotate(-20deg)'
          }} />
          <div style={{
            width: 6, height: 12,
            background: '#3A7A3A',
            borderRadius: '50% 50% 50% 0',
            transform: 'rotate(10deg)'
          }} />
        </div>
        {/* Pot */}
        <div style={{
          width: 12, height: 8,
          background: '#5A3A2A',
          borderRadius: '2px 2px 4px 4px',
          borderTop: '2px solid #7A5A4A'
        }} />
      </div>

      {/* Desk surface */}
      <div style={{
        position: 'absolute',
        bottom: 28,
        left: 0,
        right: 0,
        height: 3,
        background: 'linear-gradient(90deg, #1A1520, #2A2030, #1A1520)',
        opacity: 0.8
      }} />

      {/* Amber desk lamp light — the signature element */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: 160,
        height: 120,
        background: 'radial-gradient(ellipse at top right, rgba(245,166,35,0.08) 0%, transparent 65%)',
        pointerEvents: 'none'
      }} />

      <style>{`
        @keyframes rain {
          0% { transform: translateY(-100%); opacity: 0.4; }
          100% { transform: translateY(700%); opacity: 0.1; }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.65; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(0.6); }
        }
        @keyframes lamp-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  )
}
