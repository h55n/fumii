import React, { useEffect, useRef, useState } from 'react'
import { ChatHistory } from './ChatHistory'
import { ChatInput } from './ChatInput'
import { TypingIndicator } from './TypingIndicator'
import { useChatStore } from '../store/chatStore'
import { useAppStore } from '../store/appStore'
import { useSettingsStore } from '../store/settingsStore'
import { observeTurn, summarizeConversation } from '../memory/EpisodicLogger'
import { detectEmotionFromResponse } from '../sprite/EmotionState'
import { speak } from '../voice/TTS'

interface ChatOverlayProps {
  onClose: () => void
}

// Play a soft chime on response completion.
function playComplete() {
  try {
    const audio = new Audio('./assets/sounds/complete.mp3')
    audio.volume = 0.35
    audio.play().catch(() => {})
  } catch {}
}

export function ChatOverlay({ onClose }: ChatOverlayProps) {
  const {
    messages,
    addMessage,
    updateMessage,
    finalizeMessage,
    setStreaming,
    isStreaming,
    getHistoryForLLM,
    clearMessages
  } = useChatStore()

  const { setSpriteState } = useAppStore()
  const { get } = useSettingsStore()
  const inactivityTimer = useRef<ReturnType<typeof setTimeout>>()
  const [visible, setVisible] = useState(false)

  const currentTheme = get('chat_theme') || 'midnight'

  // Animate in
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => {
      cancelAnimationFrame(raf)
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    }
  }, [])

  const resetInactivity = () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    inactivityTimer.current = setTimeout(handleClose, 60_000) // 60s inactivity → auto-close
  }

  const handleClose = async () => {
    setVisible(false)
    setTimeout(onClose, 220)

    const history = getHistoryForLLM()
    if (history.length >= 6) {
      try {
        await summarizeConversation(
          history.map(m => ({ ...m, role: m.role as 'user' | 'assistant' | 'system' })),
          async (msgs) => window.fumiiAPI.llm.sendMessage(msgs as any, {})
        )
      } catch { /* non-fatal */ }
    }
  }

  const handleSend = async (userText: string) => {
    if (!userText.trim() || isStreaming) return
    resetInactivity()
    setSpriteState('thinking')
    setStreaming(true)

    addMessage('user', userText)

    // Placeholder assistant message (will be filled by streaming)
    const assistantId = addMessage('assistant', '')

    const history = getHistoryForLLM().slice(0, -1) // exclude the user msg we just added

    let fullResponse = ''

    try {
      await window.fumiiAPI.llm.streamMessage(
        [...history, { role: 'user', content: userText }],
        {},
        (chunk: string | null) => {
          if (chunk === null) return
          fullResponse += chunk
          updateMessage(assistantId, chunk)
          setSpriteState(detectEmotionFromResponse(fullResponse))
        }
      )

      finalizeMessage(assistantId)

      // Completion chime
      if (get('completion_chime') !== 'false') {
        playComplete()
      }

      // TTS
      if (get('tts_enabled') === 'true' && fullResponse) {
        speak(fullResponse)
      }

      observeTurn(userText, fullResponse)

    } catch (err) {
      finalizeMessage(assistantId)
      if (!fullResponse) {
        updateMessage(assistantId, 'something went wrong — check your API key in settings')
      }
      setSpriteState('concerned')
    } finally {
      setStreaming(false)
      setSpriteState('idle')
    }
  }

  return (
    <div
      className="chat-overlay"
      data-theme={currentTheme}
      style={{
        width:              360,
        height:             460,
        background:         'var(--color-surface, rgba(26, 26, 36, 0.92))',
        backdropFilter:     'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border:             '1px solid var(--color-border, rgba(255,255,255,0.06))',
        borderRadius:       'var(--radius-lg, 20px) var(--radius-lg, 20px) var(--radius-md, 12px) var(--radius-md, 12px)',
        boxShadow:          '0 -4px 40px rgba(0,0,0,0.5), var(--glow-amber)',
        display:            'flex',
        flexDirection:      'column',
        overflow:           'hidden',
        transform:          visible ? 'translateY(0)' : 'translateY(20px)',
        opacity:            visible ? 1 : 0,
        transition:         'transform 220ms cubic-bezier(0.16,1,0.3,1), opacity 220ms ease-out',
        userSelect:         'none'
      }}
    >
      {/* Header */}
      <div style={{
        padding:       '12px 16px 10px',
        display:       'flex',
        alignItems:    'center',
        justifyContent:'space-between',
        borderBottom:  '1px solid var(--color-border, rgba(255,255,255,0.04))',
        WebkitAppRegion: 'no-drag' as any
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily:    'var(--font-display)',
            fontSize:       13,
            fontWeight:     600,
            color:          'var(--color-text-fumii)',
            letterSpacing: '-0.01em'
          }}>fumii</span>
          <div style={{
            width:      6,
            height:     6,
            borderRadius: '50%',
            background: isStreaming ? 'var(--color-amber)' : 'var(--color-green)',
            animation:  isStreaming ? 'pulse 0.9s ease-in-out infinite' : 'none'
          }} />
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize:    11,
            color:       'var(--color-text-secondary)'
          }}>{isStreaming ? 'thinking...' : 'here'}</span>
        </div>
        <button
          onClick={handleClose}
          style={{
            background: 'none',
            border:     'none',
            color:      'var(--color-text-secondary)',
            cursor:     'pointer',
            fontSize:   18,
            lineHeight: 1,
            padding:    '2px 6px',
            borderRadius: 4,
            fontFamily: 'var(--font-display)'
          }}
        >×</button>
      </div>

      {/* Messages */}
      <ChatHistory messages={messages} />

      {/* Typing indicator */}
      {isStreaming && <TypingIndicator />}

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={isStreaming}
        onActivity={resetInactivity}
        voiceEnabled={get('voice_enabled') === 'true'}
      />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.75); }
        }

        /* ── Chat themes (lil-agents popover themes port) ── */
        [data-theme="moss"] {
          --color-surface:    #141C14;
          --color-text-fumii: #CAFFA6;
          --color-amber:      #CAFFA6;
          --color-amber-soft: rgba(202, 255, 166, 0.10);
          --glow-amber: 0 0 20px rgba(202, 255, 166, 0.2), 0 0 60px rgba(202, 255, 166, 0.06);
        }
        [data-theme="peach"] {
          --color-surface:    #1E1614;
          --color-text-fumii: #F5A06A;
          --color-amber:      #F5A06A;
          --color-amber-soft: rgba(245, 160, 106, 0.12);
          --glow-amber: 0 0 20px rgba(245, 160, 106, 0.2), 0 0 60px rgba(245, 160, 106, 0.06);
        }
        [data-theme="cloud"] {
          --color-surface:    #14161E;
          --color-text-fumii: #A9C8F1;
          --color-amber:      #A9C8F1;
          --color-amber-soft: rgba(169, 200, 241, 0.10);
          --glow-amber: 0 0 20px rgba(169, 200, 241, 0.2), 0 0 60px rgba(169, 200, 241, 0.06);
        }
      `}</style>
    </div>
  )
}
