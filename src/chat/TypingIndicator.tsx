import React from 'react'

export function TypingIndicator() {
  return (
    <div style={{
      padding: '4px 16px 8px',
      display: 'flex',
      alignItems: 'center',
      gap: 4
    }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: '#F5A623',
          animation: `dot-pulse 1.2s ease-in-out infinite`,
          animationDelay: `${i * 0.18}s`
        }} />
      ))}
      <style>{`
        @keyframes dot-pulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
