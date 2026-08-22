import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

export interface EdgeVoiceInfo {
  id: string;
  name: string;
  gender: 'female' | 'male';
  locale: string;
  description: string;
  isSoothing: boolean;
}

export const POPULAR_EDGE_VOICES: EdgeVoiceInfo[] = [
  {
    id: 'en-US-JennyNeural',
    name: 'Jenny (US)',
    gender: 'female',
    locale: 'en-US',
    description: 'Calm, gentle & friendly — Recommended default companion',
    isSoothing: true
  },
  {
    id: 'en-US-AriaNeural',
    name: 'Aria (US)',
    gender: 'female',
    locale: 'en-US',
    description: 'Warm, expressive & natural tone',
    isSoothing: true
  },
  {
    id: 'en-US-AnaNeural',
    name: 'Ana (US)',
    gender: 'female',
    locale: 'en-US',
    description: 'Soft, sweet & delicate companion voice',
    isSoothing: true
  },
  {
    id: 'en-GB-SoniaNeural',
    name: 'Sonia (UK)',
    gender: 'female',
    locale: 'en-GB',
    description: 'Calm, soothing & gentle British tone',
    isSoothing: true
  },
  {
    id: 'en-US-MichelleNeural',
    name: 'Michelle (US)',
    gender: 'female',
    locale: 'en-US',
    description: 'Warm, caring & relaxed conversational voice',
    isSoothing: true
  },
  {
    id: 'en-US-GuyNeural',
    name: 'Guy (US)',
    gender: 'male',
    locale: 'en-US',
    description: 'Relaxed, friendly & reassuring male voice',
    isSoothing: true
  },
  {
    id: 'en-GB-RyanNeural',
    name: 'Ryan (UK)',
    gender: 'male',
    locale: 'en-GB',
    description: 'Deep, calm & thoughtful British male tone',
    isSoothing: true
  }
];

export class EdgeTTSService {
  private tts: MsEdgeTTS;

  constructor() {
    this.tts = new MsEdgeTTS();
  }

  async synthesizeToDataUrl(
    text: string,
    options?: {
      voice?: string;
      pitch?: string;
      rate?: string;
      volume?: string;
    }
  ): Promise<string> {
    const voice = options?.voice || 'en-US-JennyNeural';
    const pitch = options?.pitch || '+0Hz';
    const rate = options?.rate || '-5%'; // Slightly relaxed pacing for calming presence
    const volume = options?.volume || '+0%';

    await this.tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    const { audioStream } = this.tts.toStream(text, {
      pitch,
      rate,
      volume
    });

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      audioStream.on('data', (chunk: Buffer) => chunks.push(chunk));
      audioStream.on('end', () => {
        const fullBuffer = Buffer.concat(chunks);
        const base64 = fullBuffer.toString('base64');
        resolve(`data:audio/mp3;base64,${base64}`);
      });
      audioStream.on('error', (err) => {
        console.error('[EdgeTTS] Synthesis stream error:', err);
        reject(err);
      });
    });
  }

  getPresetVoices(): EdgeVoiceInfo[] {
    return POPULAR_EDGE_VOICES;
  }
}
