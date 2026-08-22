import { createServer, Server } from 'net';
import { EventEmitter } from 'events';

/**
 * MQTTBroker
 * ──────────
 * Local MQTT broker (aedes) the fumii device connects to, per PRD §28.
 * Bound to 0.0.0.0:1883 — local network only, should sit behind the OS
 * firewall (PRD §18 security model).
 *
 * `aedes` is listed as a dependency in package.json but this file imports
 * it lazily so Phase 1 users (no device) never pay the startup cost or
 * need the package installed. See CLAUDE_CODE_PROMPT.md → "Hardware
 * services are opt-in" for why ENABLE_HARDWARE gates this.
 */
export class MQTTBroker extends EventEmitter {
  private server: Server | null = null;
  private aedesInstance: any = null;
  private port: number;

  constructor(port = 1883) {
    super();
    this.port = port;
  }

  async start() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const aedes = require('aedes')();
    this.aedesInstance = aedes;
    this.server = createServer(aedes.handle);

    aedes.on('client', (client: any) => {
      this.emit('client-connect', client.id);
    });
    aedes.on('clientDisconnect', (client: any) => {
      this.emit('client-disconnect', client.id);
    });
    aedes.on('publish', (packet: any, client: any) => {
      if (!client) return; // ignore broker's own retained-message replay
      this.emit('message', packet.topic, packet.payload?.toString?.() ?? '');
    });

    return new Promise<void>((resolve, reject) => {
      this.server!.listen(this.port, '0.0.0.0', () => {
        console.log(`[MQTTBroker] listening on :${this.port}`);
        resolve();
      });
      this.server!.on('error', reject);
    });
  }

  /** Publish a command from desktop -> device (e.g. fumii/desktop/face). */
  publish(topic: string, payload: string, retain = false) {
    if (!this.aedesInstance) return;
    this.aedesInstance.publish({
      topic,
      payload: Buffer.from(payload),
      qos: retain ? 1 : 0,
      retain
    });
  }

  stop() {
    this.aedesInstance?.close();
    this.server?.close();
  }
}
