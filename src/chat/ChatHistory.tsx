import React, { useEffect, useRef } from 'react'
import { ChatMessage } from '../store/chatStore'
import { ChatBubble } from './ChatBubble'

interface ChatHistoryProps {
  messages: ChatMessage[]
}

export function ChatHistory({ messages }: ChatHistoryProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '12px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      // Fade at top
      maskImage: 'linear-gradient(to bottom, transparent 0%, black 12%, black 100%)',
      WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 12%, black 100%)',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none'
    }}>
      {messages.length === 0 && (
        <div style={{
          color: '#9E9A8E',
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: 13,
          textAlign: 'center',
          marginTop: 'auto',
          marginBottom: 'auto',
          padding: '40px 20px',
          lineHeight: 1.6
        }}>
          hey, what's on your mind?
        </div>
      )}
      {messages.map(msg => (
        <ChatBubble key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
