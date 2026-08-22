import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Home } from './pages/Home';
import { Memory } from './pages/Memory';
import { MoodTimeline } from './pages/MoodTimeline';
import { Conversations } from './pages/Conversations';
import { Device } from './pages/Device';
import { Pets } from './pages/Pets';
import { Settings } from './pages/Settings';
import { SystemTest } from './pages/SystemTest';
import '../styles/dashboard.css';

export function DashboardApp() {
  const [page, setPage] = useState('home');

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        background: 'var(--color-bg)',
        color: 'var(--color-text-primary)',
        overflow: 'hidden',
        userSelect: 'none',
        position: 'relative'
      }}
    >
      {/* Top window controls and drag header bar (single bar, integrated seamlessly) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 36,
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          padding: '0 12px',
          zIndex: 100,
          WebkitAppRegion: 'drag'
        } as React.CSSProperties}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            WebkitAppRegion: 'no-drag'
          } as React.CSSProperties}
        >
          <button
            onClick={() => window.fumii?.minimizeDashboard?.()}
            style={ctrlBtn}
            title="Minimize"
          >
            –
          </button>
          <button
            onClick={() => window.fumii?.maximizeDashboard?.()}
            style={ctrlBtn}
            title="Maximize"
          >
            ▢
          </button>
          <button
            onClick={() => window.fumii?.closeDashboard?.()}
            style={{ ...ctrlBtn, color: 'var(--color-text-secondary)' }}
            title="Close"
          >
            ×
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <Sidebar active={page} onSelect={setPage} />

      {/* Main Page Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '36px 48px 48px 48px',
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--color-border) transparent'
        }}
      >
        {page === 'home'          && <Home key="home" onNavigate={setPage} />}
        {page === 'memory'        && <Memory key="memory" />}
        {page === 'mood'          && <MoodTimeline key="mood" />}
        {page === 'conversations' && <Conversations key="conversations" />}
        {page === 'device'        && <Device key="device" />}
        {page === 'pets'          && <Pets key="pets" />}
        {page === 'settings'      && <Settings key="settings" />}
        {page === 'system-test'   && <SystemTest key="system-test" />}
      </div>
    </div>
  );
}

const ctrlBtn: React.CSSProperties = {
  width: 24,
  height: 24,
  border: 'none',
  background: 'transparent',
  color: 'var(--color-text-3)',
  cursor: 'pointer',
  borderRadius: 6,
  fontSize: 13,
  lineHeight: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 120ms ease, color 120ms ease'
};
