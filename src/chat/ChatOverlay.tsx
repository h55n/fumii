import React, { useEffect, useState } from 'react';
import { ChatHistory } from './ChatHistory';
import { ChatInput } from './ChatInput';
import { useChatStore } from '../store/chatStore';
import { useAppStore } from '../store/appStore';
import { detectStateFromResponse } from '../sprite/EmotionState';
import { playSoothingTTS } from '../services/ttsService';

function speak(text: string) {
  let voiceId: string | undefined;
  let rate: string | undefined;
  let pitch: string | undefined;
  try {
    const savedVoice = localStorage.getItem('fumii_tts_voice_id');
    if (savedVoice) voiceId = savedVoice;
    const savedRate = localStorage.getItem('fumii_tts_rate_val');
    if (savedRate) rate = savedRate;
    const savedPitch = localStorage.getItem('fumii_tts_pitch_val');
    if (savedPitch) pitch = savedPitch;
  } catch {}

  playSoothingTTS(text, { voiceId, rate, pitch });
}

export function ChatOverlay() {
  const { addMessage, appendStreamToken, finishStream, setThinking, isThinking, messages } = useChatStore();
  const { mode, setSpriteState } = useAppStore();
  
  const isStreaming = messages.some(m => m.streaming);
  const disabled = isThinking || isStreaming;

  const handleSend = async (text: string) => {
    addMessage({ role: 'user', content: text });
    const assistantId = addMessage({ role: 'assistant', content: '', streaming: true });
    setThinking(true);
    setSpriteState('thinking');

    const history = useChatStore
      .getState()
      .messages.slice(-20)
      .map((m) => ({ role: m.role, content: m.content }));

    window.fumii.streamMessage(
      history as any,
      (token) => {
        setThinking(false);
        setSpriteState('speaking');
        appendStreamToken(assistantId, token);
      },
      (full) => {
        finishStream(assistantId, full);
        setSpriteState(detectStateFromResponse(full));
        speak(full);
        setTimeout(() => setSpriteState('idle'), 4000);
      },
      (err) => {
        finishStream(assistantId, "hmm, i'm having trouble right now — try again in a sec?");
        setSpriteState('concerned');
        console.error('llm stream error', err);
      }
    );
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 220,
        left: 8,
        right: 8,
        height: 480,
        background: 'rgba(250, 250, 247, 0.96)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(0, 0, 0, 0.12)',
        borderRadius: '22px',
        boxShadow: 'none',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'chat-in 220ms var(--ease-out-smooth)'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '14px 18px',
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--color-blue)'
          }}
        />
        <span style={{ color: 'var(--color-blue)', fontWeight: 700, fontSize: 14 }}>fumii</span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {mode}
        </span>
        <button
          onClick={() => window.fumii?.closeChat?.()}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-3)',
            cursor: 'pointer',
            fontSize: 18,
            marginLeft: 12,
            padding: '0 4px',
            lineHeight: 1,
            transition: 'color 120ms ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-3)')}
          title="Close chat"
        >
          ×
        </button>
      </div>

      <ChatHistory />
      <ChatInput onSend={handleSend} disabled={disabled} />

      <style>{`
        @keyframes chat-in {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
}
