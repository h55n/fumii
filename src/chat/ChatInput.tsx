import React, { useState, useRef, useCallback } from 'react'

interface ChatInputProps {
  onSend: (text: string) => void
  disabled: boolean
  onActivity: () => void
  voiceEnabled: boolean
}

export function ChatInput({ onSend, disabled, onActivity, voiceEnabled }: ChatInputProps) {
  const [text, setText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    onActivity()
  }

  const startListening = useCallback(() => {
    if (!voiceEnabled) return
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript
      setText(prev => prev ? prev + ' ' + transcript : transcript)
    }

    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)

    recognition.start()
    recognitionRef.current = recognition
    setIsListening(true)
  }, [voiceEnabled])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  return (
    <div style={{
      padding: '10px 12px 12px',
      display: 'flex',
      gap: 8,
      alignItems: 'flex-end'
    }}>
      <div style={{
        flex: 1,
        background: '#22223A',
        border: `1px solid ${text ? 'rgba(245,166,35,0.4)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 12,
        transition: 'border-color 150ms',
        display: 'flex',
        alignItems: 'flex-end'
      }}>
        <textarea
          value={text}
          onChange={e => { setText(e.target.value); onActivity() }}
          onKeyDown={handleKeyDown}
          placeholder="say something..."
          disabled={disabled}
          rows={1}
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            outline: 'none',
            color: '#EEEAE0',
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 14,
            lineHeight: 1.5,
            padding: '10px 12px',
            resize: 'none',
            maxHeight: 100,
            overflowY: 'auto',
            scrollbarWidth: 'none',
            opacity: disabled ? 0.5 : 1
          }}
        />
      </div>

      {/* Voice button */}
      {voiceEnabled && (
        <button
          onMouseDown={startListening}
          onMouseUp={stopListening}
          onMouseLeave={stopListening}
          disabled={disabled}
          title="Hold to speak"
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: isListening ? 'rgba(245,166,35,0.25)' : '#22223A',
            border: `1px solid ${isListening ? 'rgba(245,166,35,0.7)' : 'rgba(255,255,255,0.08)'}`,
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isListening ? '#F5A623' : '#9E9A8E',
            fontSize: 16,
            transition: 'all 150ms',
            boxShadow: isListening ? '0 0 12px rgba(245,166,35,0.3)' : 'none',
            flexShrink: 0
          }}
        >
          🎤
        </button>
      )}

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={!text.trim() || disabled}
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: text.trim() && !disabled ? '#F5A623' : '#22223A',
          border: 'none',
          cursor: text.trim() && !disabled ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: text.trim() && !disabled ? '#0F0F14' : '#9E9A8E',
          fontSize: 14,
          fontWeight: 700,
          transition: 'all 80ms',
          flexShrink: 0
        }}
      >
        ↑
      </button>
    </div>
  )
}
