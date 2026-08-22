import { spawn } from 'child_process';
import { app } from 'electron';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * KokoroTTSService
 * ────────────────
 * Local TTS for the device's speaker (PRD §10 Path B — "preferred: Kokoro
 * TTS, local, high quality, runs on CPU, MIT license"). Kokoro ships as a
 * Python package (`kokoro-onnx` or the HF `kokoro` pip package); this
 * service shells out to a small Python synth script rather than porting
 * Kokoro to Node, since the model runs on ONNX runtime with first-class
 * Python bindings.
 *
 * Not bundled here — needs a Python environment + the model weights (~300MB).
 * See CLAUDE_CODE_PROMPT.md → "Kokoro TTS gap" for the setup script and the
 * `scripts/kokoro_synth.py` stub this expects to find.
 */
export class KokoroTTSService {
  private scriptPath: string;
  private pythonBin: string;

  constructor() {
    this.scriptPath = join(app.getAppPath(), 'scripts', 'kokoro_synth.py');
    this.pythonBin = process.platform === 'win32' ? 'python' : 'python3';
  }

  isAvailable(): boolean {
    return existsSync(this.scriptPath);
  }

  /**
   * Synthesizes `text` to a raw PCM16 mono 16kHz buffer, matching the
   * format AudioStreamer.sendAudioChunk() expects. Falls back to throwing
   * if the synth script/model aren't set up — callers should catch and use
   * Web Speech API TTS on the desktop instead (device just stays silent,
   * face still shows the response text is available via chat).
   */
  async synthesize(text: string): Promise<Buffer> {
    if (!this.isAvailable()) {
      throw new Error('kokoro_synth.py not found — see KokoroTTSService setup docs');
    }

    return new Promise((resolve, reject) => {
      const proc = spawn(this.pythonBin, [this.scriptPath, '--text', text, '--format', 'pcm16']);
      const chunks: Buffer[] = [];

      proc.stdout.on('data', (chunk) => chunks.push(chunk));
      proc.stderr.on('data', (d) => console.error('[KokoroTTS]', d.toString()));
      proc.on('close', (code) => {
        if (code === 0) resolve(Buffer.concat(chunks));
        else reject(new Error(`kokoro synth exited with code ${code}`));
      });
      proc.on('error', reject);
    });
  }

  /** Splits a PCM buffer into 512-byte chunks for WebSocket streaming (PRD §29). */
  static chunk(buffer: Buffer, size = 512): Buffer[] {
    const chunks: Buffer[] = [];
    for (let i = 0; i < buffer.length; i += size) {
      chunks.push(buffer.subarray(i, i + size));
    }
    return chunks;
  }
}
