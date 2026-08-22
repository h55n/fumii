import { app } from 'electron';
import { join } from 'path';
import { existsSync, unlinkSync, mkdirSync, createWriteStream } from 'fs';
import { randomUUID } from 'crypto';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';

export interface WhisperModelInfo {
  id: string;
  label: string;
  filename: string;
  sizeMB: number;
  description: string;
  url: string;
  installed: boolean;
  isActive?: boolean;
  accuracy: number; // 1 to 5
  speed: number;    // 1 to 5
  language: 'en' | 'multi';
  badge?: string;
}

const HF_BASE = 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main';

export const WHISPER_MODELS: Omit<WhisperModelInfo, 'installed' | 'isActive'>[] = [
  {
    id: 'tiny.en',
    label: 'Whisper Tiny (English)',
    filename: 'ggml-tiny.en.bin',
    sizeMB: 75,
    description: 'Instant, lightweight live English transcription with minimal battery usage.',
    url: `${HF_BASE}/ggml-tiny.en.bin`,
    accuracy: 3,
    speed: 5,
    language: 'en',
    badge: 'Fastest'
  },
  {
    id: 'base.en',
    label: 'Whisper Base (English)',
    filename: 'ggml-base.en.bin',
    sizeMB: 142,
    description: 'Optimal balance of fast response and high transcription accuracy for everyday voice.',
    url: `${HF_BASE}/ggml-base.en.bin`,
    accuracy: 4,
    speed: 4,
    language: 'en',
    badge: 'Recommended'
  },
  {
    id: 'small.en',
    label: 'Whisper Small (English)',
    filename: 'ggml-small.en.bin',
    sizeMB: 466,
    description: 'Highest precision English transcription for complex vocabulary and accents.',
    url: `${HF_BASE}/ggml-small.en.bin`,
    accuracy: 5,
    speed: 3,
    language: 'en',
    badge: 'High Accuracy'
  },
  {
    id: 'tiny',
    label: 'Whisper Tiny (Multilingual)',
    filename: 'ggml-tiny.bin',
    sizeMB: 75,
    description: 'Fast live multilingual speech recognition across 99 languages.',
    url: `${HF_BASE}/ggml-tiny.bin`,
    accuracy: 3,
    speed: 5,
    language: 'multi',
    badge: 'Multilingual'
  },
  {
    id: 'base',
    label: 'Whisper Base (Multilingual)',
    filename: 'ggml-base.bin',
    sizeMB: 142,
    description: 'Accurate multilingual speech recognition across 99 languages.',
    url: `${HF_BASE}/ggml-base.bin`,
    accuracy: 4,
    speed: 4,
    language: 'multi',
    badge: 'Multilingual'
  }
];

export class WhisperService extends EventEmitter {
  private whisperDir: string;
  private binaryPath: string;
  private activeDownloads = new Map<string, AbortController>();

  constructor() {
    super();
    this.whisperDir = join(app.getPath('userData'), 'whisper');
    mkdirSync(this.whisperDir, { recursive: true });
    this.binaryPath = join(
      process.resourcesPath ?? app.getAppPath(),
      'resources',
      'whisper',
      process.platform === 'win32' ? 'main.exe' : 'main'
    );
  }

  getModels(activeModelId?: string): WhisperModelInfo[] {
    return WHISPER_MODELS.map((m) => ({
      ...m,
      installed: existsSync(join(this.whisperDir, m.filename)),
      isActive: activeModelId ? activeModelId === m.id : m.id === 'base.en'
    }));
  }

  isAvailable(modelId?: string): boolean {
    const mid = modelId ?? 'base.en';
    const model = WHISPER_MODELS.find((m) => m.id === mid);
    if (!model) return false;
    return existsSync(this.binaryPath) && existsSync(join(this.whisperDir, model.filename));
  }

  async downloadModel(modelId: string): Promise<void> {
    const model = WHISPER_MODELS.find((m) => m.id === modelId);
    if (!model) throw new Error(`Unknown model: ${modelId}`);

    const destPath = join(this.whisperDir, model.filename);
    if (existsSync(destPath)) {
      this.emit('download-done', { modelId });
      return;
    }

    const controller = new AbortController();
    this.activeDownloads.set(modelId, controller);

    try {
      const res = await fetch(model.url, { signal: controller.signal });
      if (!res.ok || !res.body) throw new Error(`Download failed: HTTP ${res.status}`);

      const totalBytes = parseInt(res.headers.get('content-length') ?? '0', 10);
      const tmpPath = destPath + '.tmp';
      const writer = createWriteStream(tmpPath);

      let bytesReceived = 0;
      const reader = res.body.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        writer.write(value);
        bytesReceived += value.length;
        const percent = totalBytes > 0 ? Math.round((bytesReceived / totalBytes) * 100) : 0;
        this.emit('download-progress', { modelId, bytesReceived, totalBytes, percent });
      }

      await new Promise<void>((resolve, reject) => {
        writer.end((err: Error | null) => (err ? reject(err) : resolve()));
      });

      const { renameSync } = require('fs');
      renameSync(tmpPath, destPath);

      this.emit('download-done', { modelId });
    } catch (err: any) {
      try {
        unlinkSync(destPath + '.tmp');
      } catch {}
      if (err?.name === 'AbortError') {
        this.emit('download-error', { modelId, error: 'cancelled' });
      } else {
        this.emit('download-error', { modelId, error: String(err?.message ?? err) });
        throw err;
      }
    } finally {
      this.activeDownloads.delete(modelId);
    }
  }

  cancelDownload(modelId: string) {
    this.activeDownloads.get(modelId)?.abort();
    this.activeDownloads.delete(modelId);
  }

  deleteModel(modelId: string) {
    const model = WHISPER_MODELS.find((m) => m.id === modelId);
    if (!model) return;
    const path = join(this.whisperDir, model.filename);
    try {
      unlinkSync(path);
    } catch {}
  }

  async transcribe(pcmBuffer: Buffer, modelId = 'base.en'): Promise<string> {
    if (!this.isAvailable(modelId)) {
      throw new Error(`Model "${modelId}" not installed. Install it from Settings.`);
    }
    const model = WHISPER_MODELS.find((m) => m.id === modelId)!;
    const modelPath = join(this.whisperDir, model.filename);

    const tmpWav = join(app.getPath('temp'), `fumii-${randomUUID()}.wav`);
    const { writeFileSync } = require('fs');
    writeFileSync(tmpWav, this.pcmToWav(pcmBuffer));

    return new Promise((resolve, reject) => {
      const proc = spawn(this.binaryPath, [
        '-m',
        modelPath,
        '-f',
        tmpWav,
        '--no-timestamps',
        '--language',
        modelId.endsWith('.en') ? 'en' : 'auto'
      ]);

      let output = '';
      proc.stdout.on('data', (d: Buffer) => (output += d.toString()));
      proc.on('close', (code: number) => {
        try {
          unlinkSync(tmpWav);
        } catch {}
        if (code === 0) resolve(output.trim());
        else reject(new Error(`whisper.cpp exited with code ${code}`));
      });
      proc.on('error', reject);
    });
  }

  private pcmToWav(pcm: Buffer): Buffer {
    const sampleRate = 16000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;

    const header = Buffer.alloc(44);
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + pcm.length, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);
    header.write('data', 36);
    header.writeUInt32LE(pcm.length, 40);

    return Buffer.concat([header, pcm]);
  }
}
