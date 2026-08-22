import React, { useEffect, useState, useRef } from 'react';
import { SceneBackground } from './SceneBackground';
import { PetWidget } from '../pet/PetWidget';
import { ChatOverlay } from '../chat/ChatOverlay';
import { useAppStore } from '../store/appStore';
import { usePetStore, type Pet } from '../store/petStore';
import type { FumiiState, BehaviorMode } from './EmotionState';

export function SpriteWindow() {
  const { spriteState, setSpriteState, setBehaviorMode, chatOpen, setChatOpen } = useAppStore();
  const { activePet, load } = usePetStore();

  // Horizontal position of the companion (percentage: 20% to 80%)
  const [posX] = useState(50);
  const posXRef = useRef(50);
  const [clickReaction, setClickReaction] = useState(false);

  useEffect(() => {
    load();

    // Listen to IPC events from main & dashboard without creating echo loops
    const offToggle = window?.fumii?.on?.('chat:toggled', (open: boolean) => setChatOpen(open));
    const offState = window?.fumii?.on?.('sprite:stateChanged', (st: FumiiState) => {
      if (useAppStore.getState().spriteState !== st) {
        useAppStore.setState({ spriteState: st });
      }
    });
    const offBehavior = window?.fumii?.on?.('sprite:behaviorChanged', (bm: BehaviorMode) => {
      if (useAppStore.getState().behaviorMode !== bm) {
        useAppStore.setState({ behaviorMode: bm });
      }
    });
    const offActive = window?.fumii?.on?.('pet:activeChanged', (p: Pet) => {
      if (p) usePetStore.setState({ activePet: p });
    });
    const offUpdated = window?.fumii?.on?.('pet:updated', () => {
      load();
    });

    return () => {
      if (typeof offToggle === 'function') offToggle();
      if (typeof offState === 'function') offState();
      if (typeof offBehavior === 'function') offBehavior();
      if (typeof offActive === 'function') offActive();
      if (typeof offUpdated === 'function') offUpdated();
    };
  }, []);

  // Update ref when state changes
  useEffect(() => {
    posXRef.current = posX;
  }, [posX]);

  const clickLockRef = useRef(false);

  // 4-5 Minute Mood & Memory Emotional Cadence Loop
  useEffect(() => {
    const syncMoodEmotion = async () => {
      try {
        if (clickLockRef.current || useAppStore.getState().chatOpen) return;
        const moodLog = await window?.fumii?.getMoodLog?.(1);
        const latestMood = moodLog?.[0]?.signal || 'neutral';

        let targetState: FumiiState = 'idle';
        if (latestMood === 'happy' || latestMood === 'excited') {
          targetState = Math.random() > 0.5 ? 'happy' : 'idle';
        } else if (latestMood === 'tired' || latestMood === 'stressed') {
          targetState = 'sleepy';
        } else {
          targetState = 'idle';
        }

        setSpriteState(targetState);
      } catch {}
    };

    // Initial mood sync on startup
    syncMoodEmotion();

    // Check cadence every 4.5 minutes (270,000 ms)
    const interval = setInterval(syncMoodEmotion, 4.5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Mouse Dragging on companion
  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const totalMovedRef = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    startPosRef.current = { x: e.screenX, y: e.screenY };
    totalMovedRef.current = 0;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = moveEvent.screenX - startPosRef.current.x;
      const dy = moveEvent.screenY - startPosRef.current.y;
      totalMovedRef.current += Math.abs(dx) + Math.abs(dy);

      if (dx !== 0 || dy !== 0) {
        window?.fumii?.moveSpriteWindow?.(dx, dy);
        startPosRef.current = { x: moveEvent.screenX, y: moveEvent.screenY };
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      if (totalMovedRef.current < 6) {
        handleCompanionClick();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleCompanionClick = () => {
    if (clickLockRef.current) return;
    clickLockRef.current = true;
    setClickReaction(true);
    setSpriteState('happy');
    window?.fumii?.openChat?.();
    setTimeout(() => {
      setClickReaction(false);
    }, 800);
    setTimeout(() => {
      clickLockRef.current = false;
    }, 1800);
  };

  const handleMouseEnter = () => {
    window?.fumii?.setInteractive?.(true);
  };

  const handleMouseLeave = () => {
    if (isDraggingRef.current) return;
    if (!chatOpen) {
      window?.fumii?.setInteractive?.(false);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column-reverse',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <SceneBackground>
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: `${posX}%`,
            transform: 'translateX(-50%)',
            transition:
              spriteState === 'walk-left' || spriteState === 'walk-right'
                ? 'left 2.2s cubic-bezier(0.25, 1, 0.5, 1)'
                : 'left 0.25s ease',
            cursor: 'grab',
            padding: 8
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleMouseDown}
          title="Drag to move anywhere • Click to chat"
        >
          {/* Floating Heart / Sparkle on click */}
          {clickReaction && (
            <div
              style={{
                position: 'absolute',
                top: -24,
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: 18,
                animation: 'fumii-float-heart 0.6s ease-out forwards',
                pointerEvents: 'none'
              }}
            >
              ✨
            </div>
          )}

          <PetWidget
            spritesheetPath={activePet?.spritesheetPath}
            state={spriteState}
            pet={activePet}
          />
        </div>
      </SceneBackground>

      {chatOpen && <ChatOverlay />}

      <style>{`
        @keyframes fumii-float-heart {
          0% { opacity: 1; transform: translate(-50%, 0) scale(0.8); }
          100% { opacity: 0; transform: translate(-50%, -20px) scale(1.3); }
        }
      `}</style>
    </div>
  );
}



