import React from 'react'
import { SPRITE_RENDER_SIZE } from './EmotionState'
import { SpriteState } from '../store/appStore'

import walkLeftSrc from '../assets/sprites/lenny-walk-left.gif'
import walkRightSrc from '../assets/sprites/lenny-walk-right.gif'
import idleSrc from '../assets/sprites/lenny-idle.png'

export type WalkDirection = 'left' | 'right' | 'idle'

interface FumiiSpriteProps {
  state: SpriteState
  scale?: number
  walkDirection?: WalkDirection
}

const SPRITE_URLS = {
  walkLeft:  walkLeftSrc,
  walkRight: walkRightSrc,
  idle:      idleSrc,
}

export function FumiiSprite({ scale = 1, walkDirection = 'idle' }: FumiiSpriteProps) {
  const renderSize = Math.round(SPRITE_RENDER_SIZE * scale)

  let src = SPRITE_URLS.idle
  if (walkDirection === 'left')  src = SPRITE_URLS.walkLeft
  if (walkDirection === 'right') src = SPRITE_URLS.walkRight

  return (
    <img
      key={src}          // force re-mount on src change so GIF restarts clean
      src={src}
      draggable={false}
      style={{
        height:          renderSize,
        width:           'auto',
        imageRendering:  'pixelated',
        display:         'block',
        userSelect:      'none',
      }}
    />
  )
}
