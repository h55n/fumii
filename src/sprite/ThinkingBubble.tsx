import React from 'react'

interface Props {
  visible: boolean
}

/**
 * ThinkingBubble — animated "..." indicator that appears above fumii
 * while spriteState === 'thinking'. Pure CSS, no JS loop.
 */
export function ThinkingBubble({ visible }: Props) {
  if (!visible) return null

  return (
    <div className="thinking-bubble" aria-hidden="true">
      <div className="thinking-dot" />
      <div className="thinking-dot" />
      <div className="thinking-dot" />
      <div className="thinking-tail" />
    </div>
  )
}
