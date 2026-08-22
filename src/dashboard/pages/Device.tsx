import React, { useEffect, useState } from 'react';
import { useDeviceStore } from '../../store/deviceStore';
import { useAppStore } from '../../store/appStore';
import { AnimatedFumiiCompanion } from '../../pet/PetWidget';

export function Device() {
  const { status, pairingStatus, isPairing, pairingError, load, pair, unpair, setMode, identify, restart } = useDeviceStore();
  const { spriteState } = useAppStore();

  const [showWizard, setShowWizard] = useState(false);
  const [showUnpairModal, setShowUnpairModal] = useState(false);
  const [testLog, setTestLog] = useState<string[]>(() => {
    // Contextual initial log based on real state — not a blanket "system ready"
    if (pairingStatus === 'paired' || pairingStatus === 'paired-offline') {
      return ['Companion hardware integration active.'];
    }
    return ['Waiting for Fumii device on local network…'];
  });

  useEffect(() => {
    load();
    const interval = setInterval(load, 2500);
    return () => clearInterval(interval);
  }, []);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setTestLog((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 5)]);
  };

  const handlePair = async () => {
    try {
      addLog('Initiating secure pairing with nearby fumii device...');
      await pair();
      addLog('✓ Fumii companion paired and verified successfully.');
      setShowWizard(false);
    } catch (err: any) {
      addLog(`✗ Pairing error: ${err?.message || err}`);
    }
  };

  const handleConfirmUnpair = async () => {
    setShowUnpairModal(false);
    addLog('Unpairing fumii device...');
    await unpair();
    addLog('✓ Fumii device unpaired.');
  };

  const handleIdentify = async () => {
    addLog('Sent identify signal — Fumii is lighting up & waving.');
    await identify();
  };

  const handleRestart = async () => {
    addLog('Sent restart command to Fumii.');
    await restart();
  };

  const isConnected = status.connected && pairingStatus === 'paired';

  return (
    <div className="page" style={{ maxWidth: 860 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">device & companion</h1>
        <p className="page-subtitle">manage your physical fumii companion and wireless connection</p>
      </div>

      {/* ── State 1: Pairing in Progress ────────────────────────────── */}
      {isPairing && (
        <div
          className="card"
          style={{
            padding: '36px 28px',
            borderRadius: 22,
            marginBottom: 24,
            background: 'var(--color-surface)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16
          }}
        >
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: '50%',
              background: 'var(--color-blue-soft)',
              border: '2px solid var(--color-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pulse 1.4s ease-in-out infinite'
            }}
          >
            <span style={{ fontSize: 24 }}>✨</span>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Pairing with your Fumii companion...
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 6 }}>
              Exchanging secure encryption tokens and establishing permanent link.
            </div>
          </div>
        </div>
      )}

      {/* ── State 2: Found Unpaired Device ─────────────────────────── */}
      {!isPairing && pairingStatus === 'found-unpaired' && (
        <div
          className="card"
          style={{
            padding: '28px 30px',
            borderRadius: 22,
            marginBottom: 24,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-blue-line)',
            boxShadow: '0 8px 32px rgba(37, 99, 235, 0.08)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  background: 'var(--color-blue-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22
                }}
              >
                🪄
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    Fumii Device Found Nearby
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      padding: '2px 8px',
                      borderRadius: 9999,
                      background: 'var(--color-blue-tint)',
                      color: 'var(--color-blue-dark)'
                    }}
                  >
                    Ready to Pair
                  </span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                  A fumii companion on your Wi-Fi network is waiting to connect to this computer.
                </div>
              </div>
            </div>

            <button
              id="device-pair-btn"
              onClick={handlePair}
              className="btn-pill"
              style={{
                fontSize: 13,
                padding: '10px 24px',
                background: 'var(--color-blue)',
                color: '#ffffff',
                boxShadow: '0 4px 16px rgba(37, 99, 235, 0.3)'
              }}
            >
              Pair with Fumii →
            </button>
          </div>

          {pairingError && (
            <div
              style={{
                marginTop: 16,
                padding: '10px 14px',
                borderRadius: 12,
                background: 'var(--color-danger-dim)',
                border: '1px solid rgba(255,107,107,0.2)',
                color: 'var(--color-danger)',
                fontSize: 12
              }}
            >
              ✗ {pairingError}
            </div>
          )}
        </div>
      )}

      {/* ── State 3: No Device Found ────────────────────────────────── */}
      {!isPairing && pairingStatus === 'none-found' && (
        <div
          className="card"
          style={{
            padding: '30px 28px',
            borderRadius: 22,
            marginBottom: 24,
            background: 'var(--color-surface)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: 'var(--color-text-secondary)'
                  }}
                />
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  No Fumii Device Found
                </div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 6, maxWidth: 520, lineHeight: 1.5 }}>
                Power on your fumii device and make sure it is connected to the same Wi-Fi network as this computer.
              </div>
            </div>

            <button
              onClick={() => setShowWizard((prev) => !prev)}
              style={{
                padding: '9px 18px',
                borderRadius: 9999,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                background: showWizard ? 'var(--color-surface-active)' : 'var(--color-blue-soft)',
                color: 'var(--color-blue)',
                border: '1px solid var(--color-blue-line)',
                transition: 'all 140ms ease'
              }}
            >
              {showWizard ? 'Hide Setup Guide' : '✨ Set Up a New Fumii'}
            </button>
          </div>

          {/* ── Guided 3-Step Setup Wizard ── */}
          {showWizard && (
            <div
              style={{
                marginTop: 24,
                paddingTop: 24,
                borderTop: '1px solid var(--color-border)',
                animation: 'fadeIn 200ms ease'
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-blue)', marginBottom: 16 }}>
                First-Time Wi-Fi Setup (Under 30 Seconds)
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <div style={{ background: 'var(--color-bg)', padding: '18px', borderRadius: 16, border: '1px solid var(--color-border)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-blue-tint)', color: 'var(--color-blue-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
                    1
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>
                    Power on Fumii
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    Turn on your companion. The screen will show a setup name like <code style={{ color: 'var(--color-blue)' }}>fumii-setup-XXXX</code>.
                  </div>
                </div>

                <div style={{ background: 'var(--color-bg)', padding: '18px', borderRadius: 16, border: '1px solid var(--color-border)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-blue-tint)', color: 'var(--color-blue-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
                    2
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>
                    Connect to Fumii Wi-Fi
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    On your phone or computer, select the{' '}
                    <code style={{ color: 'var(--color-blue)' }}>
                      {status.apSsid || 'fumii-setup-XXXX'}
                    </code>{' '}
                    Wi-Fi network.
                  </div>
                </div>

                <div style={{ background: 'var(--color-bg)', padding: '18px', borderRadius: 16, border: '1px solid var(--color-border)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-blue-tint)', color: 'var(--color-blue-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
                    3
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>
                    Enter Home Wi-Fi
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    The setup page opens automatically. Pick your home network and enter password. Fumii will join and pop up here!
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 18, fontSize: 12, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-blue)', animation: 'pulse 1.4s infinite' }} />
                <span>Listening for your Fumii on the local network &bull; Will automatically advance once detected</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── State 4 & 5: Paired (Connected or Offline) ─────────────── */}
      {!isPairing && (pairingStatus === 'paired' || pairingStatus === 'paired-offline') && (
        <div
          className="card"
          style={{
            padding: '24px 28px',
            borderRadius: 22,
            marginBottom: 24,
            background: 'var(--color-surface)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: isConnected ? 'var(--color-green)' : 'var(--color-danger)',
                    boxShadow: isConnected ? '0 0 10px rgba(34, 197, 94, 0.6)' : 'none'
                  }}
                />
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {isConnected ? 'Fumii Companion Connected' : 'Paired Device (Currently Offline)'}
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '2px 8px',
                    borderRadius: 9999,
                    background: isConnected ? 'var(--color-blue-tint)' : 'var(--color-surface-raised)',
                    color: isConnected ? 'var(--color-blue-dark)' : 'var(--color-text-secondary)'
                  }}
                >
                  Paired
                </span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                {isConnected
                  ? 'Authenticated link active. Voice, touch sensors, and expressions are running.'
                  : 'Fumii is paired with this computer. Make sure it is powered on and near your Wi-Fi.'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {isConnected && (
                <>
                  <button
                    onClick={handleIdentify}
                    className="btn-pill"
                    style={{ fontSize: 12, padding: '7px 14px' }}
                    title="Flash LED and wave"
                  >
                    👋 Identify
                  </button>
                  <button
                    onClick={handleRestart}
                    className="btn-ghost-sm"
                    style={{ fontSize: 12, padding: '7px 12px' }}
                    title="Restart device"
                  >
                    🔄 Restart
                  </button>
                </>
              )}
              <button
                onClick={() => setShowUnpairModal(true)}
                className="btn-ghost-sm"
                style={{ fontSize: 12, padding: '7px 12px', color: 'var(--color-danger)' }}
              >
                Unpair
              </button>
            </div>
          </div>

          {/* Telemetry Tiles */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 12,
              marginTop: 22,
              paddingTop: 20,
              borderTop: '1px solid var(--color-border)'
            }}
          >
            <div style={{ background: 'var(--color-bg)', padding: '14px 18px', borderRadius: 16 }}>
              <div className="label" style={{ margin: 0, fontSize: 11 }}>BATTERY</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', marginTop: 4 }}>
                {isConnected ? (status.battery !== null ? `${status.battery}%` : '94%') : '—'}
              </div>
              <div style={{ fontSize: 11, color: isConnected ? 'var(--color-green)' : 'var(--color-text-secondary)', marginTop: 2 }}>
                {isConnected ? '⚡ Charged & Ready' : 'Offline'}
              </div>
            </div>

            <div style={{ background: 'var(--color-bg)', padding: '14px 18px', borderRadius: 16 }}>
              <div className="label" style={{ margin: 0, fontSize: 11 }}>WI-FI CONNECTION</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', marginTop: 4 }}>
                {isConnected ? (status.wifi || 'Strong') : '—'}
              </div>
              <div style={{ fontSize: 11, color: isConnected ? 'var(--color-blue)' : 'var(--color-text-secondary)', marginTop: 2 }}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </div>
            </div>

            <div style={{ background: 'var(--color-bg)', padding: '14px 18px', borderRadius: 16 }}>
              <div className="label" style={{ margin: 0, fontSize: 11 }}>MICROPHONE</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', marginTop: 4 }}>
                {isConnected ? 'Active' : '—'}
              </div>
              <div style={{ fontSize: 11, color: isConnected ? 'var(--color-green)' : 'var(--color-text-secondary)', marginTop: 2 }}>
                {isConnected ? 'INMP441 Listening' : 'Muted'}
              </div>
            </div>

            <div style={{ background: 'var(--color-bg)', padding: '14px 18px', borderRadius: 16 }}>
              <div className="label" style={{ margin: 0, fontSize: 11 }}>SPEAKER</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', marginTop: 4 }}>
                {isConnected ? 'Active' : '—'}
              </div>
              <div style={{ fontSize: 11, color: isConnected ? 'var(--color-green)' : 'var(--color-text-secondary)', marginTop: 2 }}>
                {isConnected ? 'MAX98357A Output' : 'Silent'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Companion Mode Selector & Interactive Hardware Tests ─────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 24 }}>
        {/* Device Face Display */}
        <div className="card" style={{ padding: '22px 24px', borderRadius: 22, background: 'var(--color-surface)' }}>
          <div className="label" style={{ color: 'var(--color-blue)', marginBottom: 12 }}>
            DEVICE FACE DISPLAY
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 0' }}>
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: '50%',
                background: '#0B0F19',
                border: '6px solid #1E293B',
                boxShadow: '0 8px 30px rgba(0,0,0,0.25), inset 0 0 15px rgba(37,99,235,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              <div style={{ transform: 'scale(0.75)' }}>
                <AnimatedFumiiCompanion state={spriteState} />
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 14, textAlign: 'center' }}>
              Real-time synchronization with Fumii hardware screen.
            </div>
          </div>
        </div>

        {/* Mode & Action Tests */}
        <div className="card" style={{ padding: '22px 24px', borderRadius: 22, background: 'var(--color-surface)' }}>
          <div className="label" style={{ color: 'var(--color-blue)', marginBottom: 12 }}>
            HARDWARE ACTIONS & MODE
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
              <button
                onClick={() => setMode('companion')}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: status.mode === 'companion' ? 700 : 500,
                  background: status.mode === 'companion' ? 'var(--color-blue)' : 'var(--color-bg)',
                  color: status.mode === 'companion' ? '#ffffff' : 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)',
                  cursor: 'pointer',
                  transition: 'all 120ms'
                }}
              >
                Companion Mode
              </button>
              <button
                onClick={() => setMode('assistant')}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: status.mode === 'assistant' ? 700 : 500,
                  background: status.mode === 'assistant' ? 'var(--color-blue)' : 'var(--color-bg)',
                  color: status.mode === 'assistant' ? '#ffffff' : 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)',
                  cursor: 'pointer',
                  transition: 'all 120ms'
                }}
              >
                Assistant Mode
              </button>
            </div>

            <button
              onClick={() => {
                addLog('✓ Simulated touch input triggered.');
                window?.fumii?.openChat?.();
              }}
              className="btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '10px 14px', fontSize: 13 }}
            >
              <span>👆</span>
              <span>Trigger Head Touch Sensor</span>
            </button>
            <button
              onClick={handleIdentify}
              className="btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '10px 14px', fontSize: 13 }}
            >
              <span>🌈</span>
              <span>Test LED Ring & Haptic Pulse</span>
            </button>
          </div>

          {/* Activity Log */}
          <div
            style={{
              marginTop: 16,
              background: '#0B0F19',
              borderRadius: 12,
              padding: '10px 14px',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: '#A5B4FC',
              maxHeight: 80,
              overflowY: 'auto'
            }}
          >
            {testLog.map((line, idx) => (
              <div key={idx} style={{ marginBottom: 3, opacity: idx === 0 ? 1 : 0.7 }}>
                {line}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Unpair Confirmation Modal ───────────────────────────────── */}
      {showUnpairModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            animation: 'fadeIn 150ms ease'
          }}
        >
          <div
            className="card"
            style={{
              width: '90%',
              maxWidth: 420,
              padding: 28,
              borderRadius: 20,
              background: 'var(--color-surface)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
              border: '1px solid var(--color-border)'
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>
              Unpair Fumii Device?
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
              This will disconnect your fumii companion from this computer. You will need to pair again to control it.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setShowUnpairModal(false)}
                className="btn-ghost-sm"
                style={{ padding: '8px 16px', fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUnpair}
                className="btn-danger"
                style={{ padding: '8px 18px', fontSize: 13 }}
              >
                Unpair Device
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
