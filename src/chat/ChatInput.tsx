import React, { useRef, useState } from 'react';

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
}

// Web Speech API — desktop STT path (PRD §10, Path A). No API key, audio
// never leaves the device; only available in Chromium-based renderers,
// which Electron always is.
const SpeechRecognitionCtor: any =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('');
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue('');
  };

  const toggleVoice = () => {
    if (!SpeechRecognitionCtor) return;

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      onSend(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  return (
    <div style={{ display: 'flex', gap: 8, padding: '10px 14px 14px', alignItems: 'center' }}>
      <input
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
        }}
        placeholder="talk to fumii..."
        style={{
          flex: 1,
          background: 'var(--color-surface-raised)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 14px',
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-display)',
          fontSize: 14,
          outline: 'none',
          opacity: disabled ? 0.6 : 1
        }}
      />
      <button
        onClick={submit}
        disabled={disabled || !value.trim()}
        title="Send message"
        style={{
          width: 36,
          height: 36,
          borderRadius: 'var(--radius-full)',
          background: disabled || !value.trim() ? 'var(--color-surface-raised)' : 'var(--color-amber)',
          border: `1px solid ${disabled || !value.trim() ? 'var(--color-border)' : 'var(--color-amber)'}`,
          color: disabled || !value.trim() ? 'var(--color-text-3)' : 'var(--color-bg)',
          cursor: disabled || !value.trim() ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 120ms ease',
          fontSize: 16
        }}
      >
        ↑
      </button>
      {SpeechRecognitionCtor && (
        <button
          onClick={toggleVoice}
          title="push to talk"
          disabled={disabled}
          style={{
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-full)',
            background: listening ? 'var(--color-amber-soft)' : 'var(--color-surface-raised)',
            border: `1px solid ${listening ? 'var(--color-amber)' : 'var(--color-border)'}`,
            color: disabled && !listening ? 'var(--color-text-3)' : 'var(--color-text-primary)',
            cursor: disabled ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: listening ? 'pulse 0.8s ease-in-out infinite' : 'none'
          }}
        >
          🎙
        </button>
      )}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
}
