import { EventEmitter } from 'events';

/**
 * AudioStreamer
 * ─────────────
 * WebSocket server on :8765 with two endpoints, per PRD §29:
 *   /audio/input  — device -> desktop, raw PCM mic chunks
 *   /audio/output — desktop -> device, raw PCM TTS chunks
 *
 * Lazily requires `ws` so Phase-1-only installs don't need it. Gated behind
 * ENABLE_HARDWARE in main.ts, same as MQTTBroker.
 */
export class AudioStreamer extends EventEmitter {
  private wss: any = null;
  private inputSocket: any = null; // the device's mic connection
  private outputSocket: any = null; // the device's playback connection
  private port: number;

  public get isInputConnected(): boolean {
    return this.inputSocket !== null;
  }

  constructor(port = 8765) {
    super();
    this.port = port;
  }

  start() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { WebSocketServer } = require('ws');
    this.wss = new WebSocketServer({ port: this.port });

    this.wss.on('connection', (socket: any, req: any) => {
      const url = req.url ?? '';
      if (url.startsWith('/audio/input')) {
        this.inputSocket = socket;
        this.handleInput(socket);
      } else if (url.startsWith('/audio/output')) {
        this.outputSocket = socket;
      }
    });

    console.log(`[AudioStreamer] listening on :${this.port}`);
  }

  private handleInput(socket: any) {
    let buffer: Buffer[] = [];
    let silenceTimer: NodeJS.Timeout | null = null;

    socket.on('message', (data: Buffer, isBinary: boolean) => {
      if (!isBinary) {
        // header frame: { sample_rate, channels, bit_depth }
        this.emit('input-header', JSON.parse(data.toString()));
        return;
      }
      buffer.push(data);

      // naive VAD stand-in: if no chunk arrives for 700ms, treat utterance
      // as complete. Real VAD (energy threshold / webrtcvad) belongs here —
      // see CLAUDE_CODE_PROMPT.md "Whisper/VAD gap".
      if (silenceTimer) clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => {
        const full = Buffer.concat(buffer);
        buffer = [];
        this.emit('utterance-complete', full);
      }, 700);
    });

    socket.on('close', () => {
      this.inputSocket = null;
    });
  }

  /** Stream PCM chunks to the device for playback (TTS path). */
  sendAudioChunk(chunk: Buffer) {
    if (this.outputSocket?.readyState === 1) {
      this.outputSocket.send(chunk);
    }
  }

  sendOutputHeader(sampleRate = 16000, channels = 1) {
    if (this.outputSocket?.readyState === 1) {
      this.outputSocket.send(JSON.stringify({ type: 'header', sample_rate: sampleRate, channels }));
    }
  }

  stop() {
    this.wss?.close();
  }
}
