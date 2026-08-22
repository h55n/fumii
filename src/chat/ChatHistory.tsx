import React, { useEffect, useRef } from 'react';
import { ChatBubble } from './ChatBubble';
import { TypingIndicator } from './TypingIndicator';
import { useChatStore } from '../store/chatStore';

export function ChatHistory() {
  const { messages, isThinking } = useChatStore();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: '16px 18px',
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%)'
      }}
    >
      {messages.length === 0 && (
        <div style={{ color: 'var(--color-text-secondary)', fontSize: 13, margin: 'auto' }}>
          hey — what's going on?
        </div>
      )}
      {messages.map((m) => (
        <ChatBubble key={m.id} message={m} />
      ))}
      {isThinking && <TypingIndicator />}
      <div ref={endRef} />
    </div>
  );
}
