import React from 'react';

export function SceneBackground({ children }: { children?: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: 220,
        overflow: 'visible',
        background: 'transparent'
      }}
    >
      {children}
    </div>
  );
}
