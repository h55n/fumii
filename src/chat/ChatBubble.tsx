import React from 'react'
import { ChatMessage } from '../store/chatStore'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

interface ChatBubbleProps {
  message: ChatMessage
}

// ── Markdown renderer ───────────────────────────────────────────────────
// Uses marked (MIT) + DOMPurify for safe HTML output in fumii's assistant bubbles.

// Configure marked once
marked.setOptions({ breaks: true, gfm: true, async: false })

function renderMarkdown(content: string): string {
  try {
    const html = marked.parse(content) as string
    return DOMPurify.sanitize(html)
  } catch {
    return content
  }
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div style={{
        alignSelf:   'flex-end',
        maxWidth:    '78%',
        background:  'var(--color-surface-raised)',
        color:       'var(--color-text-primary)',
        borderRadius: '16px 16px 4px 16px',
        padding:     '10px 14px',
        fontFamily:  'var(--font-display)',
        fontSize:    14,
        lineHeight:  1.6,
        animation:   'message-in 180ms ease-out'
      }}>
        {message.content}
      </div>
    )
  }

  // Assistant bubble — markdown rendered
  const html = renderMarkdown(message.content || '')

  return (
    <div
      className="chat-bubble chat-bubble--fumii"
      style={{
        alignSelf:   'flex-start',
        maxWidth:    '86%',
        background:  'transparent',
        color:       'var(--color-text-fumii)',
        borderLeft:  '2px solid var(--color-amber)',
        padding:     '8px 14px 8px 14px',
        fontFamily:  'var(--font-display)',
        fontSize:    14,
        lineHeight:  1.75,
        animation:   'message-in 180ms ease-out'
      }}
    >
      {html
        ? <span dangerouslySetInnerHTML={{ __html: html }} />
        : (message.content || '')
      }
      {message.streaming && (
        <span style={{
          display:       'inline-block',
          width:         2,
          height:        14,
          background:    'var(--color-amber)',
          marginLeft:    2,
          animation:     'blink-cursor 0.7s steps(1) infinite',
          verticalAlign: 'text-bottom'
        }} />
      )}

      <style>{`
        .chat-bubble--fumii code {
          font-family: var(--font-mono);
          font-size: 12px;
          background: var(--color-amber-soft);
          border: 1px solid rgba(245, 166, 35, 0.15);
          border-radius: 4px;
          padding: 1px 5px;
          color: var(--color-amber);
        }
        .chat-bubble--fumii pre {
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 10px 12px;
          margin: 6px 0;
          overflow-x: auto;
        }
        .chat-bubble--fumii pre code {
          background: transparent;
          border: none;
          padding: 0;
          font-size: 12px;
          color: var(--color-text-primary);
        }
        .chat-bubble--fumii strong {
          color: var(--color-text-primary);
          font-weight: 600;
        }
        .chat-bubble--fumii p {
          margin: 0 0 6px 0;
        }
        .chat-bubble--fumii p:last-child {
          margin-bottom: 0;
        }
        .chat-bubble--fumii ul, .chat-bubble--fumii ol {
          padding-left: 18px;
          margin: 4px 0;
        }
        .chat-bubble--fumii li {
          margin: 2px 0;
        }
      `}</style>
    </div>
  )
}
