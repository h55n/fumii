import React, { useEffect, useRef, useCallback, useState } from 'react'
import { FumiiSprite, WalkDirection } from './FumiiSprite'
import { ThinkingBubble } from './ThinkingBubble'
import { ChatOverlay } from '../chat/ChatOverlay'
import { ErrorBoundary } from '../chat/ErrorBoundary'
import { useAppStore } from '../store/appStore'
import { useChatStore } from '../store/chatStore'
import { useSettingsStore } from '../store/settingsStore'
import { checkSleepState } from './EmotionState'

export function SpriteWindow() {
  const { spriteState, setSpriteState, lastInteractionTime, updateInteractionTime } = useAppStore()
  const { isOpen, setOpen } = useChatStore()
  const { load: loadSettings, get } = useSettingsStore()
  const [walkDirection, setWalkDirection] = useState<WalkDirection>('idle')

  // Ref to avoid stale closures in event listeners
  const isOpenRef = useRef(isOpen)
  useEffect(() => { isOpenRef.current = isOpen }, [isOpen])

  useEffect(() => {
    loadSettings()

    // Wave once on startup, then settle to idle
    const waveTimer = setTimeout(() => setSpriteState('idle'), 3500)

    return () => clearTimeout(waveTimer)
  }, [])

  // Listen for walk direction from main process wander system
  useEffect(() => {
    const handler = (dir: unknown) => {
      setWalkDirection(dir as WalkDirection)
    }
    window.fumiiAPI?.on('sprite:walk-direction', handler)
    return () => { window.fumiiAPI?.off('sprite:walk-direction', handler) }
  }, [])

  // Global hotkey from main process (Ctrl+Shift+F)
  useEffect(() => {
    const handler = () => handleToggleChat(!isOpenRef.current)
    window.fumiiAPI?.on('hotkey:toggle-chat', handler)
    return () => { window.fumiiAPI?.off('hotkey:toggle-chat', handler) }
  }, []) // eslint-disable-line

  // Idle → sleepy after 2 hours
  useEffect(() => {
    const id = setInterval(() => {
      if (!isOpenRef.current && checkSleepState(lastInteractionTime)) {
        setSpriteState('sleepy')
      }
    }, 60_000)
    return () => clearInterval(id)
  }, [lastInteractionTime])

  // Memory cleared notification
  useEffect(() => {
    const handler = () => {
      setSpriteState('waving')
      setTimeout(() => setSpriteState('idle'), 3000)
    }
    window.fumiiAPI?.on('memory:cleared', handler)
    return () => { window.fumiiAPI?.off('memory:cleared', handler) }
  }, [])

  const handleToggleChat = useCallback((open: boolean) => {
    setOpen(open)
    window.fumiiAPI?.sprite.toggleChat(open)
    updateInteractionTime()
    setSpriteState(open ? 'listening' : 'idle')
    // NOTE: we do NOT clear messages on close — conversation persists within a session.
    // Messages are cleared only via the explicit "clear chat" button in ChatOverlay,
    // or when the main process fires 'memory:cleared'.
  }, [setOpen, updateInteractionTime, setSpriteState])

  const handleMouseEnter = () => {
    window.fumiiAPI?.sprite.setMouseEvents(true)
  }

  const handleMouseLeave = () => {
    if (!isOpenRef.current) {
      window.fumiiAPI?.sprite.setMouseEvents(false)
    }
  }

  const scale = parseFloat(get('sprite_scale')) || 1.0

  return (
    <div
      style={{
        width:      '100vw',
        height:     '100vh',
        position:   'relative',
        userSelect: 'none',
        overflow:   'hidden'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Scene + sprite — anchored bottom-right of window */}
      <div style={{
        position: 'absolute',
        bottom:   0,
        right:    0,
        width:    280,
        height:   220
      }}>

        {/* Thinking bubble — appears above sprite while processing */}
        <ThinkingBubble visible={spriteState === 'thinking'} />

        {/* Sprite — clickable, centered in scene */}
        <div
          onClick={() => handleToggleChat(!isOpen)}
          style={{
            position: 'absolute',
            bottom:   20,
            left:     '50%',
            transform: 'translateX(-50%)',
            cursor:   'pointer',
            zIndex:   10,
            transition: 'filter 150ms'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.filter = 'brightness(1.1)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.filter = 'none'
          }}
        >
          <FumiiSprite
            state={spriteState}
            scale={scale}
            walkDirection={walkDirection}
          />
        </div>
      </div>

      {/* Chat overlay — sits above the sprite scene, anchored to the right */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom:   220,
          right:    0,
          width:    360,
          zIndex:   20
        }}>
          <ErrorBoundary fallbackMessage="chat hit an error — click to retry">
            <ChatOverlay onClose={() => handleToggleChat(false)} />
          </ErrorBoundary>
        </div>
      )}
    </div>
  )
}

