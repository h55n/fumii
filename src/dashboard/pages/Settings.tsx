import React, { useEffect, useState, useCallback } from 'react';
import { WhisperModelInfo } from '../../global';

// ─── Provider registry ───────────────────────────────────────────────────────
const CLOUD_PROVIDERS = [
  {
    id: 'groq',
    label: 'Groq',
    badge: 'FREE TIER',
    badgeColor: 'var(--color-green)',
    models: ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'mixtral-8x7b-32768', 'gemma2-9b-it', 'llama-3.1-70b-versatile'],
    defaultModel: 'llama-3.1-8b-instant',
    docsUrl: 'https://console.groq.com/keys',
    note: 'Fastest inference. Generous free tier. Recommended for new users.'
  },
  {
    id: 'openai',
    label: 'OpenAI',
    badge: null,
    badgeColor: '',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1-nano'],
    defaultModel: 'gpt-4o-mini',
    docsUrl: 'https://platform.openai.com/api-keys',
    note: 'GPT-4o-mini is fast and affordable.'
  },
  {
    id: 'anthropic',
    label: 'Anthropic',
    badge: null,
    badgeColor: '',
    models: ['claude-haiku-4-5', 'claude-sonnet-4-5', 'claude-3-haiku-20240307'],
    defaultModel: 'claude-haiku-4-5',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    note: 'Claude Haiku is fast and cheap.'
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    badge: 'FREE TIER',
    badgeColor: 'var(--color-blue)',
    models: ['gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-2.0-flash', 'gemini-1.5-pro'],
    defaultModel: 'gemini-1.5-flash',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    note: 'Free API key via Google AI Studio.'
  },
  {
    id: 'mistral',
    label: 'Mistral AI',
    badge: null,
    badgeColor: '',
    models: ['mistral-small-latest', 'open-mistral-nemo', 'mistral-medium-latest', 'mistral-large-latest'],
    defaultModel: 'mistral-small-latest',
    docsUrl: 'https://console.mistral.ai/api-keys/',
    note: 'European AI. Open source model options.'
  },
  {
    id: 'nvidia',
    label: 'NVIDIA NIM',
    badge: 'FREE CREDITS',
    badgeColor: '#76b900',
    models: ['meta/llama-3.1-8b-instruct', 'meta/llama-3.3-70b-instruct', 'microsoft/phi-3-mini-128k-instruct', 'mistralai/mistral-7b-instruct-v0.3'],
    defaultModel: 'meta/llama-3.1-8b-instruct',
    docsUrl: 'https://build.nvidia.com/',
    note: '1000 free inference credits/month on signup.'
  }
] as const;

interface DownloadProgress {
  modelId: string;
  bytesReceived: number;
  totalBytes: number;
  percent: number;
}

// ─── Rating Meter (Accuracy / Speed Bars) ────────────────────────────────────
function RatingMeter({ label, value, max = 5 }: { label: string; value: number; max?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', minWidth: 54, textAlign: 'right' }}>
        {label}
      </span>
      <div style={{ display: 'flex', gap: 3 }}>
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 14,
              height: 5,
              borderRadius: 3,
              background: i < value ? 'var(--color-blue)' : 'var(--color-surface-raised)',
              transition: 'background 160ms ease'
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function Settings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [keyStatus, setKeyStatus] = useState<Record<string, boolean>>({});
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<{ provider: string; ok: boolean; msg: string } | null>(null);
  const [testing, setTesting] = useState('');
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  // Whisper STT state
  const [whisperModels, setWhisperModels] = useState<WhisperModelInfo[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, DownloadProgress>>({});
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});
  const [sttSearch, setSttSearch] = useState('');
  const [sttFilter, setSttFilter] = useState<'all' | 'en' | 'multi'>('all');

  const loadSettings = useCallback(async () => {
    const [s, statuses] = await Promise.all([
      window.fumii.getAllSettings(),
      Promise.all(CLOUD_PROVIDERS.map((p) => window.fumii.hasApiKey(p.id))).then((results) => {
        const out: Record<string, boolean> = {};
        CLOUD_PROVIDERS.forEach((p, i) => (out[p.id] = results[i]));
        return out;
      })
    ]);
    setSettings(s);
    setKeyStatus(statuses);
  }, []);

  const loadWhisperModels = useCallback(async () => {
    const models = await window.fumii.getWhisperModels?.();
    if (models) setWhisperModels(models);
  }, []);

  useEffect(() => {
    loadSettings();
    loadWhisperModels();

    const offProgress = window.fumii.on('whisper:downloadProgress', (data: DownloadProgress) => {
      setDownloadProgress((prev) => ({ ...prev, [data.modelId]: data }));
    });
    const offDone = window.fumii.on('whisper:downloadDone', ({ modelId }: { modelId: string }) => {
      setDownloading((prev) => ({ ...prev, [modelId]: false }));
      setDownloadProgress((prev) => {
        const next = { ...prev };
        delete next[modelId];
        return next;
      });
      loadWhisperModels();
    });
    const offError = window.fumii.on('whisper:downloadError', ({ modelId }: { modelId: string }) => {
      setDownloading((prev) => ({ ...prev, [modelId]: false }));
      setDownloadProgress((prev) => {
        const next = { ...prev };
        delete next[modelId];
        return next;
      });
    });

    return () => {
      if (typeof offProgress === 'function') offProgress();
      if (typeof offDone === 'function') offDone();
      if (typeof offError === 'function') offError();
    };
  }, []);

  const updateSetting = async (key: string, value: string) => {
    await window.fumii.setSetting(key, value);
    setSettings((s) => ({ ...s, [key]: value }));
  };

  const saveKey = async (provider: string) => {
    const key = keyInputs[provider];
    if (!key?.trim()) return;
    setSaving((s) => ({ ...s, [provider]: true }));
    await window.fumii.setApiKey(provider, key.trim());
    setKeyStatus((s) => ({ ...s, [provider]: true }));
    setKeyInputs((s) => ({ ...s, [provider]: '' }));
    setSaving((s) => ({ ...s, [provider]: false }));
    setTestResult(null);
  };

  const testProvider = async (provider: string) => {
    setTesting(provider);
    setTestResult(null);
    const result = await window.fumii.testConnection(provider);
    setTesting('');
    setTestResult({
      provider,
      ok: result.ok,
      msg: result.ok ? (result.response ?? 'ok') : (result.error ?? 'not reachable')
    });
  };

  const handleDownload = async (modelId: string) => {
    setDownloading((prev) => ({ ...prev, [modelId]: true }));
    await window.fumii.downloadWhisperModel?.(modelId);
  };

  const handleCancelDownload = async (modelId: string) => {
    await window.fumii.cancelWhisperDownload?.(modelId);
    setDownloading((prev) => ({ ...prev, [modelId]: false }));
  };

  const handleDeleteModel = async (modelId: string) => {
    if (!confirm('Delete this model file from your computer? You can download it again any time.')) return;
    await window.fumii.deleteWhisperModel?.(modelId);
    loadWhisperModels();
  };

  const filteredModels = whisperModels.filter((m) => {
    if (sttFilter !== 'all' && m.language !== sttFilter) return false;
    if (sttSearch.trim()) {
      const q = sttSearch.toLowerCase();
      return m.label.toLowerCase().includes(q) || m.description.toLowerCase().includes(q);
    }
    return true;
  });

  const downloadedModels = filteredModels.filter((m) => m.installed);
  const availableModels = filteredModels.filter((m) => !m.installed);

  const ollamaModels = ['qwen2.5:1.5b', 'qwen2.5:3b', 'qwen2.5:7b', 'mistral:7b', 'llama3.2:3b', 'phi3.5:mini', 'gemma2:2b'];

  return (
    <div className="page" style={{ maxWidth: 840 }}>
      <h1 className="page-title">settings</h1>
      <p className="page-subtitle">configure ai models, speech recognition, and preferences</p>

      {/* ── SECTION: TRANSCRIPTION MODELS (HANDY STYLE) ────────────────── */}
      <div className="card" style={{ marginBottom: 26, padding: '24px 28px', borderRadius: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 6 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Transcription Models
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '4px 0 0 0' }}>
              Select a transcription model or download additional models. Different models offer varying levels of accuracy and speed.
            </p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div style={{ display: 'flex', gap: 10, marginTop: 18, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <input
              type="text"
              className="input-sm"
              placeholder="Search models by name..."
              value={sttSearch}
              onChange={(e) => setSttSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: 30, borderRadius: 10, background: 'var(--color-bg)' }}
            />
            <span style={{ position: 'absolute', left: 10, top: 7, fontSize: 12, color: 'var(--color-text-secondary)', opacity: 0.6 }}>🔍</span>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            {(['all', 'en', 'multi'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSttFilter(cat)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: sttFilter === cat ? 600 : 400,
                  cursor: 'pointer',
                  border: '1px solid var(--color-border)',
                  background: sttFilter === cat ? 'var(--color-blue-tint)' : 'var(--color-bg)',
                  color: sttFilter === cat ? 'var(--color-blue-dark)' : 'var(--color-text-secondary)',
                  transition: 'all 120ms ease'
                }}
              >
                {cat === 'all' ? 'All Languages' : cat === 'en' ? 'English' : 'Multilingual'}
              </button>
            ))}
          </div>
        </div>

        {/* ── Sub-section: Downloaded Models ────────────────────────── */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 10 }}>
            Downloaded Models ({downloadedModels.length})
          </div>

          {downloadedModels.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', padding: '16px', borderRadius: 14, background: 'var(--color-bg)', textAlign: 'center' }}>
              No downloaded models in this category. Choose an available model below to install.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {downloadedModels.map((m) => {
                const isActive = settings.whisper_model === m.id || (!settings.whisper_model && m.id === 'base.en');
                return (
                  <div
                    key={m.id}
                    style={{
                      border: `1px solid ${isActive ? 'var(--color-blue)' : 'var(--color-border)'}`,
                      borderRadius: 16,
                      padding: '16px 20px',
                      background: isActive ? 'var(--color-surface-active)' : 'var(--color-bg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 14
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 260 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                          {m.label}
                        </span>
                        {isActive && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              letterSpacing: '0.05em',
                              padding: '2px 8px',
                              borderRadius: 9999,
                              background: 'var(--color-blue)',
                              color: '#ffffff'
                            }}
                          >
                            ✓ Active
                          </span>
                        )}
                        {m.badge && !isActive && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: 9999,
                              background: 'var(--color-surface-raised)',
                              color: 'var(--color-text-secondary)'
                            }}
                          >
                            {m.badge}
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
                        {m.description}
                      </div>

                      <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 11, color: 'var(--color-text-secondary)' }}>
                        <span>🌐 {m.language === 'en' ? 'English only' : '99 languages'}</span>
                        <span>⚡ Local Offline</span>
                        <span>📦 {m.sizeMB} MB</span>
                      </div>
                    </div>

                    {/* Right side: Meters & Action buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <RatingMeter label="accuracy" value={m.accuracy} />
                        <RatingMeter label="speed" value={m.speed} />
                      </div>

                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {!isActive && (
                          <button
                            className="btn-pill"
                            style={{ fontSize: 11, padding: '6px 14px', background: 'var(--color-blue)', color: '#fff' }}
                            onClick={() => updateSetting('whisper_model', m.id)}
                          >
                            Set Active
                          </button>
                        )}
                        <button
                          className="btn-ghost-sm"
                          style={{ color: 'var(--color-danger)', fontSize: 11 }}
                          onClick={() => handleDeleteModel(m.id)}
                          title="Delete model file"
                        >
                          🗑 Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Sub-section: Available to Download ────────────────────── */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 10 }}>
            Available to Download ({availableModels.length})
          </div>

          {availableModels.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', padding: '14px', borderRadius: 14, background: 'var(--color-bg)', textAlign: 'center' }}>
              All models in this category are already downloaded and ready to use offline.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {availableModels.map((m) => {
                const prog = downloadProgress[m.id];
                const isDownloading = downloading[m.id] || Boolean(prog);
                return (
                  <div
                    key={m.id}
                    style={{
                      border: '1px solid var(--color-border)',
                      borderRadius: 16,
                      padding: '16px 20px',
                      background: 'var(--color-bg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 14
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 260 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                          {m.label}
                        </span>
                        {m.badge && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 9999,
                              background: m.badge === 'Recommended' ? 'var(--color-blue-tint)' : 'var(--color-surface-raised)',
                              color: m.badge === 'Recommended' ? 'var(--color-blue-dark)' : 'var(--color-text-secondary)'
                            }}
                          >
                            {m.badge}
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
                        {m.description}
                      </div>

                      <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 11, color: 'var(--color-text-secondary)' }}>
                        <span>🌐 {m.language === 'en' ? 'English only' : '99 languages'}</span>
                        <span>⚡ Local Offline</span>
                        <span>📦 {m.sizeMB} MB</span>
                      </div>

                      {/* Download Progress Bar */}
                      {isDownloading && (
                        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ flex: 1, height: 5, background: 'var(--color-surface-raised)', borderRadius: 9999, overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${prog?.percent ?? 0}%`,
                                height: '100%',
                                background: 'var(--color-blue)',
                                transition: 'width 140ms ease'
                              }}
                            />
                          </div>
                          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)', minWidth: 60, textAlign: 'right' }}>
                            {prog ? `${Math.round(prog.bytesReceived / 1024 / 1024)} / ${Math.round(prog.totalBytes / 1024 / 1024)} MB` : 'downloading...'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right side: Meters & Download action */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <RatingMeter label="accuracy" value={m.accuracy} />
                        <RatingMeter label="speed" value={m.speed} />
                      </div>

                      <div>
                        {isDownloading ? (
                          <button
                            className="btn-ghost-sm"
                            style={{ color: 'var(--color-danger)', fontSize: 11 }}
                            onClick={() => handleCancelDownload(m.id)}
                          >
                            Cancel
                          </button>
                        ) : (
                          <button
                            id={`stt-install-${m.id}`}
                            className="btn-pill"
                            style={{ fontSize: 11, padding: '6px 14px' }}
                            onClick={() => handleDownload(m.id)}
                          >
                            ⬇ Download
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── SECTION: LLM PROVIDERS ─────────────────────────────────────── */}
      <div id="settings-llm" className="card" style={{ marginBottom: 26, padding: '24px 28px', borderRadius: 22 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 6 }}>
          LLM providers
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
          Direct cloud AI connections with zero localhost proxy needed. Enter your API key below and click <strong>Save</strong> to activate that provider.
        </div>

        {/* Ollama (Local) */}
        <div
          style={{
            border: '1px solid var(--color-border)',
            borderRadius: 16,
            padding: '14px 18px',
            marginBottom: 12,
            background: 'var(--color-bg)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: keyStatus['ollama'] ? 'var(--color-green)' : 'var(--color-text-secondary)' }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Ollama <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--color-text-secondary)' }}>(Local, 100% Offline)</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select
                value={settings.ollama_model ?? 'qwen2.5:1.5b'}
                onChange={(e) => updateSetting('ollama_model', e.target.value)}
                style={selectStyle}
              >
                {ollamaModels.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <button id="settings-test-ollama" className="btn-ghost-sm" disabled={testing === 'ollama'} onClick={() => testProvider('ollama')}>
                {testing === 'ollama' ? 'testing...' : 'test'}
              </button>
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 6 }}>
            {keyStatus['ollama'] ? '● running at localhost:11434' : '○ not detected at localhost:11434'}
          </div>
        </div>

        {/* Cloud Providers */}
        {CLOUD_PROVIDERS.map((p) => {
          const hasKey = keyStatus[p.id];
          return (
            <div
              key={p.id}
              style={{
                border: `1px solid ${hasKey ? 'rgba(37,99,235,0.25)' : 'var(--color-border)'}`,
                borderRadius: 16,
                padding: '14px 18px',
                marginBottom: 12,
                background: hasKey ? 'rgba(37,99,235,0.03)' : 'var(--color-bg)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: hasKey ? 'var(--color-green)' : 'var(--color-text-secondary)' }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>{p.label}</div>
                {p.badge && (
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', padding: '2px 6px', borderRadius: 9999, background: `${p.badgeColor}20`, color: p.badgeColor }}>
                    {p.badge}
                  </span>
                )}
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--color-text-secondary)' }}>{p.note}</span>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                  value={settings[`${p.id}_model`] ?? p.defaultModel}
                  onChange={(e) => updateSetting(`${p.id}_model`, e.target.value)}
                  style={selectStyle}
                >
                  {p.models.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>

                <input
                  id={`settings-key-${p.id}`}
                  type="password"
                  className="input-sm"
                  placeholder={hasKey ? '● API Key Saved (Enter to update)' : 'Paste API key...'}
                  value={keyInputs[p.id] ?? ''}
                  onChange={(e) => setKeyInputs((s) => ({ ...s, [p.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && saveKey(p.id)}
                  style={{ width: 200, fontFamily: 'var(--font-mono)', fontSize: 11 }}
                />

                <button
                  id={`settings-save-${p.id}`}
                  className="btn-ghost-sm"
                  disabled={saving[p.id] || !keyInputs[p.id]?.trim()}
                  onClick={() => saveKey(p.id)}
                >
                  {saving[p.id] ? '...' : 'Save'}
                </button>

                <button
                  id={`settings-test-${p.id}`}
                  className="btn-ghost-sm"
                  disabled={testing === p.id}
                  onClick={() => testProvider(p.id)}
                >
                  {testing === p.id ? 'testing...' : 'Test'}
                </button>

                <a
                  href={p.docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 11, color: 'var(--color-blue)', textDecoration: 'none', opacity: 0.8 }}
                >
                  Get key ↗
                </a>
              </div>
            </div>
          );
        })}

        {/* Test Result Message Box */}
        {testResult && (
          <div
            style={{
              marginTop: 10,
              padding: '10px 14px',
              borderRadius: 10,
              background: testResult.ok ? 'var(--color-green-dim)' : 'var(--color-danger-dim)',
              border: `1px solid ${testResult.ok ? 'var(--color-green-line)' : 'rgba(255,107,107,0.2)'}`,
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: testResult.ok ? 'var(--color-green)' : 'var(--color-danger)'
            }}
          >
            {testResult.provider}: {testResult.ok ? '✓ ' : '✗ '} {testResult.msg}
          </div>
        )}
      </div>

      {/* ── SECTION: PROFILE & PREFERENCES ─────────────────────────────── */}
      {/* ─── Text-to-Speech (TTS) Voice Studio ──────────────────────────────── */}
      <TTSVoiceStudio settings={settings} updateSetting={updateSetting} />

      {/* ─── Profile & Privacy ────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 20, padding: '24px 28px', borderRadius: 22 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 14 }}>
          profile & privacy
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>Your Name</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>How Fumii addresses you in conversation</div>
            </div>
            <input
              id="settings-user-name"
              className="input-sm"
              defaultValue={settings.user_name ?? ''}
              onBlur={(e) => updateSetting('user_name', e.target.value)}
              placeholder="Your name"
              style={{ width: 180 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>Clear Memories</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>Permanently wipe all stored memories and context</div>
            </div>
            <button
              id="settings-clear-memories"
              className="btn-ghost-sm"
              style={{ color: 'var(--color-danger)' }}
              onClick={async () => {
                if (!confirm('Clear all memories? This cannot be undone.')) return;
                await window.fumii.clearAllMemories();
                alert('All memories cleared.');
              }}
            >
              Clear All Memories
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TTSVoiceStudio({
  settings,
  updateSetting
}: {
  settings: Record<string, string>;
  updateSetting: (key: string, value: string) => Promise<void>;
}) {
  const [edgeVoices, setEdgeVoices] = useState<Array<{ id: string; name: string; locale: string; description: string; isSoothing: boolean }>>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(settings.tts_voice_id || 'en-US-JennyNeural');
  const [rateOffset, setRateOffset] = useState<number>(parseInt(settings.tts_rate_offset || '-5', 10) || -5);
  const [pitchOffset, setPitchOffset] = useState<number>(parseInt(settings.tts_pitch_offset || '0', 10) || 0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const loadVoices = async () => {
      try {
        if (window?.fumii?.getEdgeVoices) {
          const list = await window.fumii.getEdgeVoices();
          if (list && list.length > 0) {
            setEdgeVoices(list);
            return;
          }
        }
      } catch {}
      // Fallback presets
      setEdgeVoices([
        { id: 'en-US-JennyNeural', name: 'Jenny (US)', locale: 'en-US', description: 'Calm, gentle & friendly — Recommended companion', isSoothing: true },
        { id: 'en-US-AriaNeural', name: 'Aria (US)', locale: 'en-US', description: 'Warm, expressive & natural tone', isSoothing: true },
        { id: 'en-US-AnaNeural', name: 'Ana (US)', locale: 'en-US', description: 'Soft, sweet & delicate companion voice', isSoothing: true },
        { id: 'en-GB-SoniaNeural', name: 'Sonia (UK)', locale: 'en-GB', description: 'Calm, soothing & gentle British tone', isSoothing: true },
        { id: 'en-US-MichelleNeural', name: 'Michelle (US)', locale: 'en-US', description: 'Warm, caring & relaxed conversational voice', isSoothing: true },
        { id: 'en-US-GuyNeural', name: 'Guy (US)', locale: 'en-US', description: 'Relaxed, friendly & reassuring male voice', isSoothing: true },
        { id: 'en-GB-RyanNeural', name: 'Ryan (UK)', locale: 'en-GB', description: 'Deep, calm & thoughtful British male tone', isSoothing: true }
      ]);
    };

    loadVoices();
  }, []);

  const handleVoiceChange = async (vId: string) => {
    setSelectedVoiceId(vId);
    localStorage.setItem('fumii_tts_voice_id', vId);
    await updateSetting('tts_voice_id', vId);
  };

  const handleRateChange = async (r: number) => {
    setRateOffset(r);
    const rateStr = `${r >= 0 ? '+' : ''}${r}%`;
    localStorage.setItem('fumii_tts_rate_val', rateStr);
    await updateSetting('tts_rate_offset', String(r));
  };

  const handlePitchChange = async (p: number) => {
    setPitchOffset(p);
    const pitchStr = `${p >= 0 ? '+' : ''}${p}Hz`;
    localStorage.setItem('fumii_tts_pitch_val', pitchStr);
    await updateSetting('tts_pitch_offset', String(p));
  };

  const testVoice = async () => {
    if (isPlaying) {
      if (window?.fumii) {
        // Stop
      }
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    const rateStr = `${rateOffset >= 0 ? '+' : ''}${rateOffset}%`;
    const pitchStr = `${pitchOffset >= 0 ? '+' : ''}${pitchOffset}Hz`;

    try {
      if (window?.fumii?.synthesizeTTS) {
        const dataUrl = await window.fumii.synthesizeTTS(
          "Hi! I'm Fumii. I'm right here with you whenever you want to talk or relax.",
          {
            voice: selectedVoiceId,
            rate: rateStr,
            pitch: pitchStr
          }
        );
        if (dataUrl) {
          const audio = new Audio(dataUrl);
          audio.onended = () => setIsPlaying(false);
          audio.onerror = () => setIsPlaying(false);
          await audio.play();
          return;
        }
      }
    } catch (err) {
      console.error('Preview error:', err);
    }
    setIsPlaying(false);
  };

  return (
    <div className="card" style={{ marginBottom: 20, padding: '24px 28px', borderRadius: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
              Microsoft Neural Text-to-Speech (TTS) Studio
            </span>
            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'var(--color-green-dim)', color: 'var(--color-green)' }}>
              100% FREE & UNLIMITED
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
            Hyper-realistic, studio-grade neural voices with zero API keys or costs
          </div>
        </div>
        <button
          onClick={testVoice}
          className="btn-primary-sm"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span>{isPlaying ? '🔊 Speaking...' : '▶ Preview Voice'}</span>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Voice Selector */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--color-text-primary)', fontWeight: 600 }}>Companion Voice</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
              {edgeVoices.find((v) => v.id === selectedVoiceId)?.description || 'Select neural companion voice'}
            </div>
          </div>
          <select
            value={selectedVoiceId}
            onChange={(e) => handleVoiceChange(e.target.value)}
            style={{ ...selectStyle, minWidth: 260, maxWidth: 360 }}
          >
            {edgeVoices.map((v) => (
              <option key={v.id} value={v.id}>
                ✨ {v.name} — {v.description.slice(0, 32)}...
              </option>
            ))}
          </select>
        </div>

        {/* Speed / Pace Slider */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>
              Speaking Pace: <span style={{ fontWeight: 600, color: 'var(--color-blue)' }}>{rateOffset >= 0 ? `+${rateOffset}%` : `${rateOffset}%`}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
              Calm and unhurried pacing (Recommended: -5% to 0%)
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>-20%</span>
            <input
              type="range"
              min="-20"
              max="20"
              step="1"
              value={rateOffset}
              onChange={(e) => handleRateChange(parseInt(e.target.value, 10))}
              style={{ width: 140, cursor: 'pointer', accentColor: 'var(--color-blue)' }}
            />
            <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>+20%</span>
          </div>
        </div>

        {/* Pitch / Warmth Slider */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>
              Voice Warmth & Pitch: <span style={{ fontWeight: 600, color: 'var(--color-blue)' }}>{pitchOffset >= 0 ? `+${pitchOffset}Hz` : `${pitchOffset}Hz`}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
              Soft & warm acoustic resonance (Recommended: 0Hz to +2Hz)
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>-10Hz</span>
            <input
              type="range"
              min="-10"
              max="10"
              step="1"
              value={pitchOffset}
              onChange={(e) => handlePitchChange(parseInt(e.target.value, 10))}
              style={{ width: 140, cursor: 'pointer', accentColor: 'var(--color-blue)' }}
            />
            <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>+10Hz</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  background: 'var(--color-surface-raised)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  color: 'var(--color-text-primary)',
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  padding: '6px 10px',
  cursor: 'pointer',
  outline: 'none',
  maxWidth: 220
};
