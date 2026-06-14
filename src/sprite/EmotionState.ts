import { SpriteState } from '../store/appStore'

export interface AnimState {
  frames: number[]
  fps: number
}

// Each state maps to a row in the sprite sheet.
// Frame indices are absolute (row * SHEET_COLS + col).
export const ANIMATION_STATES: Record<SpriteState, AnimState> = {
  idle:      { frames: [0, 1, 2, 1, 0, 3, 0, 0, 1],  fps: 4  },
  listening: { frames: [7, 8, 9, 10],                  fps: 6  },
  thinking:  { frames: [11, 12, 13, 14, 15],           fps: 7  },
  speaking:  { frames: [16, 17, 18, 19, 20],           fps: 9  },
  happy:     { frames: [21, 22, 23, 24, 23, 22],       fps: 11 },
  concerned: { frames: [25, 26, 27, 26],               fps: 3  },
  sleepy:    { frames: [28, 29, 30, 29],               fps: 2  },
  excited:   { frames: [31, 32, 33, 34, 35, 34],      fps: 12 },
  waving:    { frames: [36, 37, 38, 39, 40, 39, 38],  fps: 8  }
}

export const FRAME_SIZE = 48  // each frame in sprite sheet is 48×48px
export const SHEET_COLS = 8   // 8 columns per row in the sheet
export const SPRITE_RENDER_SIZE = 120  // rendered at 2.5x scale

/**
 * Detect emotion from fumii's response text.
 */
export function detectEmotionFromResponse(text: string): SpriteState {
  const t = text.toLowerCase()
  if (/happy|great|congrat|proud|amazing|love|fantastic|wonderful/.test(t)) return 'happy'
  if (/hard|difficult|sorry|tough|rough|tired|stress|overwhelm/.test(t)) return 'concerned'
  if (/wow|exciting|incredible|can't believe|thrilled/.test(t)) return 'excited'
  return 'speaking'
}

/**
 * Check if user has been idle for a long time.
 */
export function checkSleepState(lastInteractionTime: number): boolean {
  const twoHours = 2 * 60 * 60 * 1000
  return Date.now() - lastInteractionTime > twoHours
}

// ── Autonomous idle drift (lil-agents walking port) ────────────────────────

export interface DriftState {
  x: number          // current x offset from center (px, range -30 to +30)
  direction: 1 | -1  // 1 = right, -1 = left
  speed: number      // px per RAF frame
  pauseUntil: number // timestamp — fumii pauses at edges before reversing
}

export function initDrift(): DriftState {
  return { x: 0, direction: 1, speed: 0.3, pauseUntil: 0 }
}

/**
 * Advance the drift state by one animation frame.
 * Call this inside the RAF loop only when state === 'idle' and sprite_drift is enabled.
 */
export function stepDrift(drift: DriftState, now: number): DriftState {
  if (now < drift.pauseUntil) return drift

  const nextX = drift.x + drift.direction * drift.speed

  if (Math.abs(nextX) >= 30) {
    // Hit edge — pause 1–3 s then reverse
    return {
      ...drift,
      x: drift.x,
      direction: (drift.direction * -1) as 1 | -1,
      pauseUntil: now + 1000 + Math.random() * 2000,
    }
  }

  return { ...drift, x: nextX }
}
