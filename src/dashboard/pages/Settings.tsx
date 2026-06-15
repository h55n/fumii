import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useSettingsStore, SettingKey } from '../../store/settingsStore'

// ── Debounced save hook ────────────────────────────────────────────────────

function useDebouncedSave(key: SettingKey, value: string, delay = 600) {
  const { set } = useSettingsStore()
  const timer = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => set(key, value), delay)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [value])
}

// ── Helpers ────────────────────────────────────────────────────────────────

const Section = ({ title }: { title: string }) => (
  <h2 style={{
    fontFamily:    'var(--font-display)',
    fontSize:       15,
    fontWeight:     600,
    color:          'var(--color-text-primary)',
    margin:         '36px 0 16px',
    paddingBottom:  8,
    borderBottom:   '1px solid var(--color-border)',
    letterSpacing: '-0.01em'
  }}>{title}</h2>
)

const Label = ({ children }: { children: string }) => (
  <div style={{
    fontFamily:    'var(--font-display)',
    fontSize:       11,
    color:          'var(--color-text-secondary)',
    marginBottom:   7,
    textTransform:  'uppercase',
    letterSpacing:  '0.07em'
  }}>{children}</div>
)

const inputBase: React.CSSProperties = {
  width:        '100%',
  background:   'var(--color-surface)',
  border:       '1px solid var(--color-border)',
  borderRadius: 10,
  color:        'var(--color-text-primary)',
  fontFamily:   'var(--font-display)',
  fontSize:      14,
  padding:       '10px 14px',
  outline:       'none',
  boxSizing:     'border-box',
  transition:    'border-color 150ms'
}

const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = 'var(--color-primary)'
}
const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = 'var(--color-border)'
}

// Chat theme swatches
const THEMES = [
  { id: 'midnight', label: 'Midnight', accent: 'var(--color-primary)', bg: 'var(--color-surface)' },
  { id: 'moss',     label: 'Moss',     accent: '#CAFFA6', bg: '#141C14' },
  { id: 'peach',    label: 'Peach',    accent: '#F5A06A', bg: '#1E1614' },
  { id: 'cloud',    label: 'Cloud',    accent: '#A9C8F1', bg: '#14161E' },
]

// ── Settings page ──────────────────────────────────────────────────────────

export function Settings() {
  const { settings, set, load } = useSettingsStore()

  const [userName, setUserName]       = useState('')
  const [apiKey, setApiKey]           = useState('')
  const [maskedKey, setMaskedKey]     = useState('')
  const [apiKeySaved, setApiKeySaved] = useState(false)
  const [saving, setSaving]           = useState(false)
  const [cleared, setCleared]         = useState(false)

  // Claude Code detection state
  const [claudeDetecting, setClaudeDetecting] = useState(false)
  const [claudeStatus, setClaudeStatus]       = useState<{ found: boolean; path: string | null } | null>(null)
  const [claudePathOverride, setClaudePathOverride] = useState('')

  // Sync local state when settings load
  useEffect(() => {
    setUserName(settings.user_name || '')
    setClaudePathOverride(settings.claude_code_path || 'claude')
  }, [settings.user_name, settings.claude_code_path])

  // Reload masked API key whenever provider changes
  useEffect(() => {
    if (!settings.llm_provider) return
    const p = settings.llm_provider
    if (p !== 'claude-code' && p !== 'ollama') {
      window.fumiiAPI.settings.getApiKey(p)
        .then(setMaskedKey)
        .catch(() => setMaskedKey(''))
    } else {
      setMaskedKey('')
    }
    // Auto-detect if switching to claude-code
    if (p === 'claude-code' && claudeStatus === null) {
      handleDetectClaude()
    }
    load()
  }, [settings.llm_provider])

  useDebouncedSave('user_name', userName)

  const handleSaveApiKey = async () => {
    if (!apiKey || apiKey.startsWith('•')) return
    setSaving(true)
    try {
      await window.fumiiAPI.settings.setApiKey(settings.llm_provider, apiKey)
      setApiKey('')
      setApiKeySaved(true)
      const m = await window.fumiiAPI.settings.getApiKey(settings.llm_provider)
      setMaskedKey(m || '')
      setTimeout(() => setApiKeySaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  const handleClearMemory = async () => {
    const confirmed = await window.fumiiAPI.memory.clearAll()
    if (confirmed) setCleared(true)
  }

  const handleDetectClaude = async () => {
    setClaudeDetecting(true)
    try {
      const result = await window.fumiiAPI.settings.detectClaudeCode()
      setClaudeStatus(result)
    } catch {
      setClaudeStatus({ found: false, path: null })
    } finally {
      setClaudeDetecting(false)
    }
  }

  const handleSaveClaudePath = () => {
    set('claude_code_path', claudePathOverride)
  }

  const defaultModels: Record<string, string> = {
    mistral:       'mistral-small-latest',
    openai:        'gpt-4o-mini',
    anthropic:     'claude-haiku-4-5',
    ollama:        'qwen2.5:1.5b',
    'claude-code': 'claude-sonnet-4-5'
  }

  const currentProvider = settings.llm_provider || 'mistral'
  const showApiKey      = currentProvider !== 'ollama' && currentProvider !== 'claude-code'

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 style={{
        fontFamily:    'var(--font-display)',
        fontSize:       28,
        fontWeight:     600,
        letterSpacing: '-0.02em',
        color:          'var(--color-text-primary)',
        margin:         '0 0 6px'
      }}>settings</h1>
      <p style={{
        fontFamily: 'var(--font-display)',
        fontSize:    14,
        color:       'var(--color-text-secondary)',
        margin:      '0 0 4px'
      }}>fumii uses these to know you and talk to you</p>

      {/* ── Profile ── */}
      <Section title="your profile" />

      <div style={{ marginBottom: 20 }}>
        <Label>your name</Label>
        <input
          style={inputBase}
          value={userName}
          placeholder="what should fumii call you?"
          onChange={e => setUserName(e.target.value)}
          onFocus={focusStyle}
          onBlur={blurStyle}
        />
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--color-text-secondary)', margin: '5px 0 0' }}>
          saved automatically — fumii will use this in conversation
        </p>
      </div>

      {/* ── LLM provider ── */}
      <Section title="fumii's brain" />

      <div style={{ marginBottom: 20 }}>
        <Label>provider</Label>
        <select
          style={{ ...inputBase, cursor: 'pointer' }}
          value={currentProvider}
          onChange={e => {
            set('llm_provider', e.target.value)
            set('llm_model', defaultModels[e.target.value] || '')
          }}
          onFocus={focusStyle}
          onBlur={blurStyle}
        >
          <option value="mistral">Mistral AI — recommended, fast + cheap</option>
          <option value="openai">OpenAI (GPT)</option>
          <option value="anthropic">Anthropic (Claude)</option>
          <option value="ollama">Ollama — local, no API key needed</option>
          <option value="claude-code">Claude Code (local CLI) — no API key needed</option>
        </select>
      </div>

      {/* Claude Code detection banner */}
      {currentProvider === 'claude-code' && (
        <div style={{ marginBottom: 20 }}>
          <div style={{
            background:   claudeStatus?.found
              ? 'rgba(202,255,166,0.06)'
              : 'rgba(255,107,107,0.06)',
            border:       `1px solid ${claudeStatus?.found ? 'rgba(202,255,166,0.2)' : 'rgba(255,107,107,0.2)'}`,
            borderRadius: 10,
            padding:      '12px 16px',
            marginBottom: 10,
            fontFamily:   'var(--font-display)',
            fontSize:      13,
            lineHeight:    1.6
          }}>
            {claudeDetecting && (
              <span style={{ color: 'var(--color-text-secondary)' }}>detecting claude code CLI...</span>
            )}
            {!claudeDetecting && claudeStatus === null && (
              <span style={{ color: 'var(--color-text-secondary)' }}>
                Requires Claude Code CLI installed and available on PATH.{' '}
                <button
                  onClick={handleDetectClaude}
                  style={{ background: 'none', border: 'none', color: 'var(--color-amber)', cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 13, padding: 0, textDecoration: 'underline' }}
                >
                  detect now
                </button>
              </span>
            )}
            {!claudeDetecting && claudeStatus?.found && (
              <span style={{ color: 'var(--color-green)' }}>
                Claude Code CLI detected at: <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{claudeStatus.path}</code>
              </span>
            )}
            {!claudeDetecting && claudeStatus !== null && !claudeStatus.found && (
              <span style={{ color: 'var(--color-danger)' }}>
                Claude Code CLI not found.{' '}
                <button
                  onClick={() => window.fumiiAPI.openExternal('https://claude.ai/code')}
                  style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 13, padding: 0, textDecoration: 'underline' }}
                >
                  install at claude.ai/code
                </button>
                {' '}or enter path below.
              </span>
            )}
          </div>

          <Label>claude code path (optional override)</Label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              style={{ ...inputBase, flex: 1, fontFamily: 'var(--font-mono)', fontSize: 13 }}
              value={claudePathOverride}
              placeholder="claude"
              onChange={e => setClaudePathOverride(e.target.value)}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
            <button
              onClick={handleSaveClaudePath}
              style={{
                background:   'var(--color-amber)',
                border:       'none',
                borderRadius: 10,
                color:        'var(--color-bg)',
                fontFamily:   'var(--font-display)',
                fontSize:      13,
                fontWeight:    600,
                padding:       '10px 16px',
                cursor:        'pointer',
                flexShrink:    0
              }}
            >
              save
            </button>
          </div>

          {/* Privacy note for Claude Code mode */}
          <div style={{
            marginTop:    10,
            fontFamily:   'var(--font-display)',
            fontSize:      12,
            color:         'var(--color-text-secondary)',
            lineHeight:    1.6
          }}>
            Claude Code mode: conversations are handled by the local Claude Code CLI and governed by Anthropic's terms of service.
          </div>
        </div>
      )}

      {/* Model field */}
      <div style={{ marginBottom: 20 }}>
        <Label>model</Label>
        <input
          style={inputBase}
          value={settings.llm_model || ''}
          placeholder={defaultModels[currentProvider] || 'model name'}
          onChange={e => set('llm_model', e.target.value)}
          onFocus={focusStyle}
          onBlur={blurStyle}
        />
      </div>

      {/* API key — hidden for ollama and claude-code */}
      {showApiKey && (
        <div style={{ marginBottom: 20 }}>
          <Label>api key</Label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="password"
              style={{ ...inputBase, flex: 1 }}
              value={apiKey}
              placeholder={maskedKey || 'paste your API key here...'}
              onChange={e => setApiKey(e.target.value)}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
            <button
              onClick={handleSaveApiKey}
              disabled={!apiKey || saving}
              style={{
                background:   apiKey && !saving ? 'var(--color-amber)' : 'var(--color-surface)',
                border:       '1px solid var(--color-border)',
                borderRadius: 10,
                color:        apiKey && !saving ? 'var(--color-bg)' : 'var(--color-text-secondary)',
                fontFamily:   'var(--font-display)',
                fontSize:      13,
                fontWeight:    600,
                padding:       '10px 18px',
                cursor:        apiKey && !saving ? 'pointer' : 'not-allowed',
                transition:    'all 80ms',
                flexShrink:    0,
                minWidth:      72,
                whiteSpace:    'nowrap'
              }}
            >
              {apiKeySaved ? 'saved' : saving ? '...' : 'save'}
            </button>
          </div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--color-text-secondary)', margin: '5px 0 0' }}>
            stored in Windows Credential Manager — never written to disk as plain text
          </p>
        </div>
      )}

      {/* Ollama info banner */}
      {currentProvider === 'ollama' && (
        <div style={{
          background:   'rgba(169,224,241,0.05)',
          border:       '1px solid rgba(169,224,241,0.15)',
          borderRadius: 10,
          padding:      '12px 16px',
          marginBottom: 20,
          fontFamily:   'var(--font-display)',
          fontSize:      13,
          color:         'var(--color-blue)',
          lineHeight:    1.6
        }}>
          No API key needed for Ollama.<br />
          Make sure Ollama is running: <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, background: 'rgba(169,224,241,0.08)', padding: '1px 5px', borderRadius: 3 }}>ollama serve</code><br />
          Then pull a model: <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, background: 'rgba(169,224,241,0.08)', padding: '1px 5px', borderRadius: 3 }}>ollama pull qwen2.5:1.5b</code>
        </div>
      )}

      {/* ── Appearance ── */}
      <Section title="appearance" />

      {/* Chat theme swatches */}
      <div style={{ marginBottom: 24 }}>
        <Label>chat theme</Label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {THEMES.map(theme => {
            const isActive = (settings.chat_theme || 'midnight') === theme.id
            return (
              <button
                key={theme.id}
                id={`theme-swatch-${theme.id}`}
                onClick={() => set('chat_theme', theme.id)}
                title={theme.label}
                style={{
                  display:      'flex',
                  flexDirection: 'column',
                  alignItems:   'center',
                  gap:           6,
                  background:   'none',
                  border:       `2px solid ${isActive ? theme.accent : 'var(--color-border)'}`,
                  borderRadius: 10,
                  padding:      '10px 14px',
                  cursor:       'pointer',
                  transition:   'border-color 120ms',
                  minWidth:     68
                }}
              >
                <div style={{
                  width:        32,
                  height:       24,
                  borderRadius: 6,
                  background:   theme.bg,
                  border:       `2px solid ${theme.accent}`,
                  boxShadow:    isActive ? `0 0 8px ${theme.accent}55` : 'none',
                  transition:   'box-shadow 120ms'
                }} />
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize:    11,
                  color:       isActive ? theme.accent : 'var(--color-text-secondary)'
                }}>{theme.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Sprite scale */}
      <div style={{ marginBottom: 20 }}>
        <Label>sprite scale — {parseFloat(settings.sprite_scale || '1').toFixed(1)}×</Label>
        <input
          type="range"
          min="0.6"
          max="2.0"
          step="0.1"
          value={settings.sprite_scale || '1.0'}
          onChange={e => set('sprite_scale', e.target.value)}
          style={{ width: '100%', accentColor: 'var(--color-amber)', cursor: 'pointer' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 4 }}>
          <span>0.6×</span><span>1.0×</span><span>2.0×</span>
        </div>
      </div>

      {/* Sprite position */}
      <div style={{ marginBottom: 20 }}>
        <Label>sprite position</Label>
        <select
          style={{ ...inputBase, cursor: 'pointer' }}
          value={settings.sprite_position || 'bottom-right'}
          onChange={e => set('sprite_position', e.target.value)}
          onFocus={focusStyle}
          onBlur={blurStyle}
        >
          <option value="bottom-right">bottom right</option>
          <option value="bottom-left">bottom left</option>
          <option value="top-right">top right</option>
          <option value="top-left">top left</option>
        </select>
      </div>

      {/* Toggles: drift + chime */}
      {([
        { key: 'sprite_drift',     label: 'Sprite drift — fumii wanders gently when idle' },
        { key: 'completion_chime', label: 'Completion chime — soft sound when response finishes' },
      ] as const).map(({ key, label }) => (
        <label
          key={key}
          style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, cursor: 'pointer' }}
        >
          <input
            type="checkbox"
            checked={settings[key as keyof typeof settings] !== 'false'}
            onChange={e => set(key as any, e.target.checked ? 'true' : 'false')}
            style={{ accentColor: 'var(--color-amber)', width: 16, height: 16, cursor: 'pointer' }}
          />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--color-text-primary)', lineHeight: 1.4 }}>{label}</span>
        </label>
      ))}

      {/* ── Voice & privacy ── */}
      <Section title="voice & privacy" />

      {([
        { key: 'voice_enabled',    label: 'Voice input (hold Ctrl+Space to speak)' },
        { key: 'tts_enabled',      label: "fumii's voice output (text-to-speech)" },
        { key: 'save_transcripts', label: 'Save full conversation transcripts' }
      ] as const).map(({ key, label }) => (
        <label
          key={key}
          style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, cursor: 'pointer' }}
        >
          <input
            type="checkbox"
            checked={settings[key] === 'true'}
            onChange={e => set(key, e.target.checked ? 'true' : 'false')}
            style={{ accentColor: 'var(--color-amber)', width: 16, height: 16, cursor: 'pointer' }}
          />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--color-text-primary)', lineHeight: 1.4 }}>{label}</span>
        </label>
      ))}

      <div style={{
        background:   'rgba(158,154,142,0.05)',
        border:       '1px solid var(--color-border)',
        borderRadius: 10,
        padding:      '12px 16px',
        marginBottom: 32,
        fontFamily:   'var(--font-display)',
        fontSize:      12,
        color:         'var(--color-text-secondary)',
        lineHeight:    1.6
      }}>
        All data stays local on your machine. Nothing is sent anywhere except your configured LLM API.
        The SQLite database lives at <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--color-surface-raised)', padding: '1px 5px', borderRadius: 3 }}>%APPDATA%\fumii\fumii.db</code>
      </div>

      {/* ── Hotkeys reference ── */}
      <Section title="hotkeys" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 32 }}>
        {[
          ['Ctrl+Shift+F', 'Toggle chat'],
          ['Ctrl+Shift+D', 'Open dashboard'],
          ['Ctrl+Shift+H', 'Hide / show fumii'],
          ['Ctrl+Space',   'Push-to-talk (hold)'],
          ['Escape',       'Close chat'],
          ['Enter',        'Send message']
        ].map(([key, desc]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
            <code style={{
              fontFamily: 'var(--font-mono)',
              fontSize:    10,
              background:  'var(--color-surface)',
              border:      '1px solid var(--color-border)',
              borderRadius: 4,
              padding:     '2px 7px',
              color:        'var(--color-amber)',
              whiteSpace:   'nowrap'
            }}>{key}</code>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--color-text-secondary)' }}>{desc}</span>
          </div>
        ))}
      </div>

      {/* ── Danger zone ── */}
      <div style={{
        border:       '1px solid rgba(255,107,107,0.18)',
        borderRadius: 12,
        padding:      '20px 24px',
        background:   'rgba(255,107,107,0.03)'
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--color-danger)', marginBottom: 8 }}>
          danger zone
        </div>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 16px', lineHeight: 1.55 }}>
          Permanently deletes your profile, all episode memories, mood logs, and transcripts.
          fumii will not remember anything about you after this.
        </p>
        <button
          onClick={handleClearMemory}
          style={{
            background:   'none',
            border:       '1px solid rgba(255,107,107,0.35)',
            borderRadius: 8,
            color:        cleared ? 'var(--color-green)' : 'var(--color-danger)',
            fontFamily:   'var(--font-display)',
            fontSize:      13,
            padding:       '8px 18px',
            cursor:        'pointer',
            transition:    'all 80ms'
          }}
          onMouseEnter={e => !cleared && (e.currentTarget.style.background = 'rgba(255,107,107,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
        >
          {cleared ? 'memory cleared' : 'clear all memory...'}
        </button>
      </div>
    </div>
  )
}
