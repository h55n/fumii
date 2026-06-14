import React from 'react'
import { ChatMessage } from '../store/chatStore'

interface ChatBubbleProps {
  message: ChatMessage
}

// ── Light markdown renderer ─────────────────────────────────────────────────
// Uses marked (MIT) + DOMPurify for safe HTML output in fumii's assistant bubbles.
// Falls back to plain text if the libraries are not available.

let _marked: ((src: string) => string) | null = null
let _purify: ((dirty: string) => string) | null = null

function initMarkdown() {
  if (_marked !== null) return
  try {
    // Dynamic import — available after npm install
    const { marked } = require('marked')
    marked.setOptions({ breaks: true, gfm: true })
    _marked = (src: string) => marked.parse(src) as string
  } catch {
    _marked = (src: string) => src // plain text fallback
  }
  try {
    const DOMPurify = require('dompurify')
    _purify = (dirty: string) => DOMPurify.sanitize(dirty)
  } catch {
    _purify = (s: string) => s // no DOMPurify installed yet — safe in Electron's sandboxed webContents
  }
}

function renderMarkdown(content: string): string {
  initMarkdown()
  try {
    const html = _marked!(content)
    return _purify!(html)
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
