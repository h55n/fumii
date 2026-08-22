import React, { useMemo } from 'react';
import type { ChatMessage } from '../store/chatStore';

// marked + DOMPurify are the PRD-specified deps for safe markdown rendering.
// Both are in package.json. If the dynamic require fails (bundling edge case),
// we fall back to plain text — the app never breaks.
let marked: ((text: string) => string) | null = null;
let DOMPurify: { sanitize: (html: string) => string } | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const m = require('marked');
  marked = m.marked ?? m.default ?? m;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const dmp = require('dompurify');
  DOMPurify = dmp.default ?? dmp;
} catch {
  /* fallback to plain text */
}

function renderMarkdown(text: string): string {
  if (!marked || !DOMPurify) return text;
  try {
    const html = (marked as (t: string) => string)(text);
    return DOMPurify!.sanitize(html);
  } catch {
    return text;
  }
}

export function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const isStreaming = message.streaming;

  const html = useMemo(
    () => (isUser ? null : renderMarkdown(message.content)),
    [message.content, isUser]
  );

  if (isUser) {
    return (
      <div
        style={{
          background: 'var(--color-surface-raised)',
          color: 'var(--color-text-primary)',
          borderRadius: '16px 16px 4px 16px',
          padding: '10px 14px',
          fontSize: 14,
          lineHeight: 1.6,
          maxWidth: '86%',
          alignSelf: 'flex-end',
          wordBreak: 'break-word'
        }}
      >
        {message.content}
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'transparent',
        color: 'var(--color-text-fumii)',
        borderLeft: '2px solid var(--color-amber-line)',
        padding: '10px 14px 10px 16px',
        fontSize: 14,
        lineHeight: 1.75,
        maxWidth: '92%',
        alignSelf: 'flex-start',
        wordBreak: 'break-word'
      }}
    >
      {/* Markdown rendered */}
      {html ? (
        <div
          dangerouslySetInnerHTML={{ __html: html }}
          style={{ all: 'unset', display: 'block', lineHeight: 1.75, fontSize: 14, color: 'var(--color-text-fumii)' }}
        />
      ) : (
        <span>{message.content}</span>
      )}

      {/* Streaming cursor */}
      {isStreaming && (
        <span
          style={{
            display: 'inline-block',
            width: 2,
            height: '1em',
            background: 'var(--color-amber)',
            marginLeft: 2,
            verticalAlign: 'text-bottom',
            animation: 'cursor-blink 0.8s steps(1) infinite'
          }}
        />
      )}

      <style>{`
        @keyframes cursor-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        /* Markdown overrides inside fumii bubbles */
        [data-fumii-bubble] p  { margin: 0 0 8px; }
        [data-fumii-bubble] p:last-child { margin: 0; }
        [data-fumii-bubble] ul, [data-fumii-bubble] ol { margin: 4px 0 8px 18px; }
        [data-fumii-bubble] li { margin-bottom: 3px; }
        [data-fumii-bubble] code {
          font-family: var(--font-mono);
          font-size: 12px;
          background: var(--color-surface-raised);
          border: 1px solid var(--color-border);
          border-radius: 3px;
          padding: 1px 5px;
        }
        [data-fumii-bubble] pre {
          background: var(--color-surface-raised);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: 10px 12px;
          overflow-x: auto;
          margin: 6px 0;
        }
        [data-fumii-bubble] pre code {
          background: none;
          border: none;
          padding: 0;
          font-size: 12px;
        }
        [data-fumii-bubble] strong { color: var(--color-amber); font-weight: 600; }
        [data-fumii-bubble] em    { color: var(--color-text-secondary); font-style: italic; }
        [data-fumii-bubble] a     { color: var(--color-blue); text-decoration: none; }
        [data-fumii-bubble] a:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
}
