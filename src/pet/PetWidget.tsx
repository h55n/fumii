import React, { useEffect, useState } from 'react';
import type { FumiiState } from '../sprite/EmotionState';
import type { Pet } from '../store/petStore';

// Row & frame mapping for Codex-Pets standard 8x9 atlas (192px * 208px per frame)
const CODEX_ANIMATIONS: Record<string, { row: number; frames: number }> = {
  idle: { row: 0, frames: 6 },
  'walk-right': { row: 1, frames: 8 },
  'walk-left': { row: 2, frames: 8 },
  waving: { row: 3, frames: 4 },
  speaking: { row: 3, frames: 4 },
  happy: { row: 4, frames: 5 },
  jumping: { row: 4, frames: 5 },
  celebrating: { row: 4, frames: 5 },
  confused: { row: 5, frames: 8 },
  concerned: { row: 5, frames: 8 },
  listening: { row: 6, frames: 6 },
  waiting: { row: 6, frames: 6 },
  running: { row: 7, frames: 6 },
  thinking: { row: 8, frames: 6 },
  review: { row: 8, frames: 6 },
  sleepy: { row: 0, frames: 6 }
};

export function CodexSpritePlayer({
  src,
  state = 'idle',
  width = 140,
  height = 150,
  className,
  style,
  onError
}: {
  src?: string;
  state?: FumiiState;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  onError?: () => void;
}) {
  const [frame, setFrame] = useState(0);
  const [hasError, setHasError] = useState(false);

  const anim = CODEX_ANIMATIONS[state] || CODEX_ANIMATIONS.idle;

  useEffect(() => {
    setFrame(0);
    const interval = setInterval(() => {
      setFrame((prev) => (prev + 1) % anim.frames);
    }, 220);
    return () => clearInterval(interval);
  }, [state, anim.frames]);

  if (hasError || !src) return null;

  // Frame size: 192 x 208
  const safeFrames = Math.max(1, anim.frames || 1);
  const currentFrame = frame % safeFrames;
  const scale = Math.min(width / 192, height / 208);
  const posX = -currentFrame * 192;
  const posY = -anim.row * 208;

  return (
    <div
      className={className}
      style={{
        width,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
        imageRendering: 'pixelated',
        userSelect: 'none',
        ...style
      }}
    >
      {/* Hidden image preloader to catch 404/decode errors */}
      <img
        src={src}
        alt="pet sprite"
        style={{ display: 'none' }}
        onError={() => {
          setHasError(true);
          onError?.();
        }}
      />

      <div
        style={{
          width: 192,
          height: 208,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          backgroundImage: `url("${src}")`,
          backgroundPosition: `${posX}px ${posY}px`,
          backgroundRepeat: 'no-repeat',
          imageRendering: 'pixelated',
          flexShrink: 0
        }}
      />
    </div>
  );
}

export function AnimatedFumiiCompanion({
  state,
  pet
}: {
  state: FumiiState;
  pet?: Pet | null;
}) {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 180);
    }, 4200);
    return () => clearInterval(interval);
  }, []);

  const isSpeaking = state === 'speaking';
  const isSleepy = state === 'sleepy';
  const isThinking = state === 'thinking';
  const isListening = state === 'listening';
  const isHappy = state === 'happy' || state === 'celebrating';

  const theme = pet?.theme ?? {
    bodyBg: 'linear-gradient(145deg, #FFFFFF, #EDEDE5)',
    bodyBorder: 'rgba(37, 99, 235, 0.3)',
    eyeColor: '#2563EB',
    eyeGlow: 'rgba(37, 99, 235, 0.6)',
    earColor: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
    accentColor: '#2563EB',
    shape: 'circle'
  };

  const shape = theme.shape || 'circle';

  return (
    <div
      className="fumii-pet-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        userSelect: 'none'
      }}
    >
      {/* Outer Floating Character Body */}
      <div
        style={{
          width: 110,
          height: 110,
          borderRadius:
            shape === 'slime' ? '50% 50% 45% 45% / 60% 60% 40% 40%' :
            shape === 'ghost' ? '50% 50% 35% 35% / 55% 55% 45% 45%' :
            shape === 'robot' ? '28px' : '50%',
          background: theme.bodyBg,
          border: `2px solid ${theme.bodyBorder}`,
          boxShadow: `0 8px 32px ${theme.eyeGlow || 'rgba(37, 99, 235, 0.18)'}, inset 0 2px 10px rgba(255, 255, 255, 0.6), 0 2px 8px rgba(0, 0, 0, 0.06)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          animation: 'fumii-float 4.5s ease-in-out infinite'
        }}
      >
        {/* Ears */}
        <div
          style={{
            position: 'absolute',
            top: -6,
            left: 20,
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: theme.earColor,
            boxShadow: `0 2px 8px ${theme.accentColor}`
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: -6,
            right: 20,
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: theme.earColor,
            boxShadow: `0 2px 8px ${theme.accentColor}`
          }}
        />

        {/* Eyes Row */}
        <div
          style={{
            display: 'flex',
            gap: shape === 'robot' ? 26 : 22,
            alignItems: 'center',
            marginTop: 4
          }}
        >
          <div
            style={{
              width: shape === 'robot' ? 14 : 12,
              height: blink || isSleepy ? 2 : isHappy ? 8 : shape === 'robot' ? 10 : 12,
              borderRadius: isHappy ? '8px 8px 0 0' : shape === 'robot' ? 2 : 6,
              background: theme.eyeColor,
              boxShadow: `0 0 8px ${theme.eyeGlow || theme.eyeColor}`,
              transition: 'all 0.15s ease'
            }}
          />
          <div
            style={{
              width: shape === 'robot' ? 14 : 12,
              height: blink || isSleepy ? 2 : isHappy ? 8 : shape === 'robot' ? 10 : 12,
              borderRadius: isHappy ? '8px 8px 0 0' : shape === 'robot' ? 2 : 6,
              background: theme.eyeColor,
              boxShadow: `0 0 8px ${theme.eyeGlow || theme.eyeColor}`,
              transition: 'all 0.15s ease'
            }}
          />
        </div>

        {/* Cheeks */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '74%',
            position: 'absolute',
            top: 56
          }}
        >
          <div style={{ width: 8, height: 5, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.35)', filter: 'blur(1px)' }} />
          <div style={{ width: 8, height: 5, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.35)', filter: 'blur(1px)' }} />
        </div>

        {/* Mouth */}
        <div
          style={{
            marginTop: 10,
            width: isSpeaking ? 18 : isHappy ? 16 : 8,
            height: isSpeaking ? 12 : isHappy ? 6 : 3,
            borderRadius: isSpeaking ? '50%' : '0 0 10px 10px',
            background: theme.eyeColor,
            boxShadow: `0 0 6px ${theme.eyeGlow || theme.eyeColor}`,
            transition: 'all 0.2s ease',
            animation: isSpeaking ? 'fumii-speak 0.7s infinite alternate' : isThinking ? 'fumii-think 1.5s infinite alternate' : 'none'
          }}
        />

        {(isListening || isThinking) && (
          <div
            style={{
              position: 'absolute',
              inset: -8,
              borderRadius: '50%',
              border: `2px solid ${theme.accentColor}`,
              animation: 'fumii-pulse 1.5s infinite',
              pointerEvents: 'none'
            }}
          />
        )}
      </div>

      <style>{`
        @keyframes fumii-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        @keyframes fumii-speak {
          0% { transform: scaleY(0.85); }
          100% { transform: scaleY(1.15); }
        }
        @keyframes fumii-think {
          0% { opacity: 0.7; transform: scaleX(0.9); }
          100% { opacity: 1; transform: scaleX(1.1); }
        }
        @keyframes fumii-pulse {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.04); opacity: 0.4; }
          100% { transform: scale(1); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}

export function PetWidget({
  spritesheetPath,
  state,
  pet
}: {
  spritesheetPath?: string;
  state: FumiiState;
  pet?: Pet | null;
}) {
  const [spriteFailed, setSpriteFailed] = useState(false);

  const spriteSource =
    pet?.spritesheetPath && (pet.spritesheetPath.startsWith('data:') || pet.spritesheetPath.startsWith('http'))
      ? pet.spritesheetPath
      : spritesheetPath && (spritesheetPath.startsWith('data:') || spritesheetPath.startsWith('http'))
      ? spritesheetPath
      : (pet as any)?.spritesheetUrl || (pet as any)?.previewUrl || null;

  useEffect(() => {
    setSpriteFailed(false);
  }, [spriteSource, pet?.slug]);

  // If this is the default porcelain companion OR no sprite source OR failed to load, show animated porcelain companion
  if (!spriteSource || pet?.slug === 'fumii-default' || spriteFailed) {
    return <AnimatedFumiiCompanion state={state} pet={pet} />;
  }

  return (
    <CodexSpritePlayer
      key={`${pet?.slug || 'default'}-${spriteSource.slice(0, 30)}`}
      src={spriteSource}
      state={state}
      width={140}
      height={150}
      onError={() => setSpriteFailed(true)}
    />
  );
}

