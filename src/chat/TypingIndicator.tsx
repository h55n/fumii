import React from 'react';

export function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 5, padding: '12px 16px' }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--color-amber)',
            animation: `typing-bounce 1.4s ease-in-out ${i * 0.2}s infinite`
          }}
        />
      ))}
      <style>{`
        @keyframes typing-bounce {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40% { transform: scale(1.0); opacity: 1.0; }
        }
      `}</style>
    </div>
  );
}
