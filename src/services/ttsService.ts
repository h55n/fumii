export interface VoiceOption {
  id: string;
  name: string;
  gender: string;
  locale: string;
  description: string;
  isSoothing: boolean;
  provider: 'microsoft-neural' | 'system';
}

export const FALLBACK_EDGE_VOICES: VoiceOption[] = [
  {
    id: 'en-US-JennyNeural',
    name: 'Jenny (US)',
    gender: 'female',
    locale: 'en-US',
    description: 'Calm, gentle & friendly — Recommended companion',
    isSoothing: true,
    provider: 'microsoft-neural'
  },
  {
    id: 'en-US-AriaNeural',
    name: 'Aria (US)',
    gender: 'female',
    locale: 'en-US',
    description: 'Warm, expressive & natural tone',
    isSoothing: true,
    provider: 'microsoft-neural'
  },
  {
    id: 'en-US-AnaNeural',
    name: 'Ana (US)',
    gender: 'female',
    locale: 'en-US',
    description: 'Soft, sweet & delicate companion voice',
    isSoothing: true,
    provider: 'microsoft-neural'
  },
  {
    id: 'en-GB-SoniaNeural',
    name: 'Sonia (UK)',
    gender: 'female',
    locale: 'en-GB',
    description: 'Calm, soothing & gentle British tone',
    isSoothing: true,
    provider: 'microsoft-neural'
  },
  {
    id: 'en-US-MichelleNeural',
    name: 'Michelle (US)',
    gender: 'female',
    locale: 'en-US',
    description: 'Warm, caring & relaxed conversational voice',
    isSoothing: true,
    provider: 'microsoft-neural'
  },
  {
    id: 'en-US-GuyNeural',
    name: 'Guy (US)',
    gender: 'male',
    locale: 'en-US',
    description: 'Relaxed, friendly & reassuring male voice',
    isSoothing: true,
    provider: 'microsoft-neural'
  },
  {
    id: 'en-GB-RyanNeural',
    name: 'Ryan (UK)',
    gender: 'male',
    locale: 'en-GB',
    description: 'Deep, calm & thoughtful British male tone',
    isSoothing: true,
    provider: 'microsoft-neural'
  }
];

let currentAudio: HTMLAudioElement | null = null;

export async function getMicrosoftNeuralVoices(): Promise<VoiceOption[]> {
  try {
    if (typeof window !== 'undefined' && window?.fumii?.getEdgeVoices) {
      const vList = await window.fumii.getEdgeVoices();
      if (vList && vList.length > 0) {
        return vList.map((v) => ({ ...v, provider: 'microsoft-neural' as const }));
      }
    }
  } catch {}
  return FALLBACK_EDGE_VOICES;
}

export function stopCurrentSpeech() {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    } catch {}
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}

export async function playSoothingTTS(
  text: string,
  options?: {
    voiceId?: string;
    pitch?: string;
    rate?: string;
    volume?: string;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: () => void;
  }
): Promise<void> {
  if (!text || !text.trim()) return;

  stopCurrentSpeech();
  options?.onStart?.();

  const voiceId = options?.voiceId || localStorage.getItem('fumii_tts_voice_id') || 'en-US-JennyNeural';
  const rate = options?.rate || localStorage.getItem('fumii_tts_rate_val') || '-5%';
  const pitch = options?.pitch || localStorage.getItem('fumii_tts_pitch_val') || '+0Hz';

  // 1. Try Microsoft Edge Neural TTS (100% Free & Unlimited)
  if (typeof window !== 'undefined' && window?.fumii?.synthesizeTTS) {
    try {
      const dataUrl = await window.fumii.synthesizeTTS(text, {
        voice: voiceId,
        rate,
        pitch
      });

      if (dataUrl) {
        const audio = new Audio(dataUrl);
        currentAudio = audio;
        audio.onended = () => {
          currentAudio = null;
          options?.onEnd?.();
        };
        audio.onerror = () => {
          currentAudio = null;
          fallbackWebSpeech(text, options);
        };
        await audio.play();
        return;
      }
    } catch (err) {
      console.warn('[TTS] Microsoft Neural TTS failed, falling back to Web Speech:', err);
    }
  }

  // 2. Fallback to Web Speech API
  fallbackWebSpeech(text, options);
}

function fallbackWebSpeech(
  text: string,
  options?: {
    onEnd?: () => void;
    onError?: () => void;
  }
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    options?.onEnd?.();
    return;
  }

  try {
    const utter = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find((v) => /natural|jenny|aria|samantha|zira/i.test(v.name)) || voices[0];
    if (preferred) utter.voice = preferred;
    utter.rate = 0.92;
    utter.pitch = 1.04;
    utter.onend = () => options?.onEnd?.();
    utter.onerror = () => {
      options?.onError?.();
      options?.onEnd?.();
    };
    window.speechSynthesis.speak(utter);
  } catch {
    options?.onEnd?.();
  }
}
