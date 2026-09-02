import dgram from 'dgram';
import { networkInterfaces, hostname } from 'os';
import { EventEmitter } from 'events';

export interface NetworkInfo {
  localIp: string;
  hostname: string;
  mqttPort: number;
  wsPort: number;
  discoveryPort: number;
  allIps: string[];
}

/**
 * DiscoveryService
 * ────────────────
 * Provides automatic zero-friction LAN discovery for Fumii physical devices
 * (ESP32-S3 and ESP8266 QuadBot) connecting to Windows, Linux, and macOS desktops.
 *
 * It listens on UDP port 8766 and broadcasts periodic beacons so that devices on
 * the same Wi-Fi network immediately learn the computer's real LAN IP without
 * relying on mDNS hostnames (which often fail across diverse OS/router setups).
 */
export class DiscoveryService extends EventEmitter {
  private socket: dgram.Socket | null = null;
  private beaconTimer: NodeJS.Timeout | null = null;
  private readonly discoveryPort: number;
  private readonly mqttPort: number;
  private readonly wsPort: number;
  private readonly getDesktopId: () => string;

  constructor(options: {
    discoveryPort?: number;
    mqttPort?: number;
    wsPort?: number;
    getDesktopId: () => string;
  }) {
    super();
    this.discoveryPort = options.discoveryPort ?? 8766;
    this.mqttPort = options.mqttPort ?? 1883;
    this.wsPort = options.wsPort ?? 8765;
    this.getDesktopId = options.getDesktopId;
  }

  /**
   * Retrieves active IPv4 non-internal LAN addresses for this machine.
   */
  public getLocalIpList(): string[] {
    const nets = networkInterfaces();
    const ips: string[] = [];

    for (const name of Object.keys(nets)) {
      const netList = nets[name];
      if (!netList) continue;
      for (const net of netList) {
        // Skip internal/loopback and non-IPv4 addresses
        if (net.family === 'IPv4' && !net.internal) {
          ips.push(net.address);
        }
      }
    }

    // Sort to prioritize standard private Wi-Fi / Ethernet subnets
    ips.sort((a, b) => {
      const score = (ip: string) => {
        if (ip.startsWith('192.168.')) return 3;
        if (ip.startsWith('10.')) return 2;
        if (ip.startsWith('172.')) return 1;
        return 0;
      };
      return score(b) - score(a);
    });

    return ips.length > 0 ? ips : ['127.0.0.1'];
  }

  public getPrimaryIp(): string {
    const ips = this.getLocalIpList();
    return ips[0] || '127.0.0.1';
  }

  public getNetworkInfo(): NetworkInfo {
    const ips = this.getLocalIpList();
    return {
      localIp: ips[0] || '127.0.0.1',
      hostname: hostname(),
      mqttPort: this.mqttPort,
      wsPort: this.wsPort,
      discoveryPort: this.discoveryPort,
      allIps: ips
    };
  }

  private buildBeaconPayload(): string {
    const info = this.getNetworkInfo();
    return JSON.stringify({
      service: 'fumii-desktop',
      version: '2.0.0',
      host: info.localIp,
      hostname: info.hostname,
      mqttPort: info.mqttPort,
      wsPort: info.wsPort,
      discoveryPort: info.discoveryPort,
      desktopId: this.getDesktopId(),
      timestamp: Date.now()
    });
  }

  public async start(): Promise<void> {
    return new Promise((resolve) => {
      try {
        this.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

        this.socket.on('error', (err) => {
          console.warn('[DiscoveryService] UDP Socket error:', err.message);
        });

        this.socket.on('message', (msg, rinfo) => {
          try {
            const raw = msg.toString('utf-8');
            if (raw.includes('fumii') || raw.includes('query') || raw.includes('PING')) {
              // Device is searching for the desktop — reply directly to sender
              const payload = this.buildBeaconPayload();
              const buf = Buffer.from(payload);
              this.socket?.send(buf, 0, buf.length, rinfo.port, rinfo.address, (err) => {
                if (err) {
                  console.warn(`[DiscoveryService] Failed to send direct discovery reply to ${rinfo.address}:${rinfo.port}`);
                } else {
                  console.log(`[DiscoveryService] Sent discovery reply to device at ${rinfo.address}:${rinfo.port}`);
                }
              });
            }
          } catch (e) {
            console.warn('[DiscoveryService] Error processing inbound UDP packet:', e);
          }
        });

        this.socket.bind(this.discoveryPort, '0.0.0.0', () => {
          try {
            this.socket?.setBroadcast(true);
          } catch (e) {
            console.warn('[DiscoveryService] Could not enable broadcast flag:', e);
          }
          console.log(`[DiscoveryService] Listening and broadcasting on UDP :${this.discoveryPort}`);

          // Broadcast immediately and then every 3 seconds
          this.broadcastBeacon();
          this.beaconTimer = setInterval(() => {
            this.broadcastBeacon();
          }, 3000);

          resolve();
        });
      } catch (err) {
        console.warn('[DiscoveryService] Failed to start UDP discovery:', err);
        resolve(); // non-blocking fallback
      }
    });
  }

  private broadcastBeacon(): void {
    if (!this.socket) return;
    const payload = this.buildBeaconPayload();
    const buf = Buffer.from(payload);

    // Broadcast to global subnet
    this.socket.send(buf, 0, buf.length, this.discoveryPort, '255.255.255.255', (err) => {
      if (err && (err as any).code !== 'EACCES') {
        // Silently ignore expected broadcast permission quirks on certain restricted OS environments
      }
    });

    // Also broadcast to local subnet broadcast addresses if determinable
    const ips = this.getLocalIpList();
    for (const ip of ips) {
      if (ip.startsWith('192.168.') || ip.startsWith('10.')) {
        const parts = ip.split('.');
        if (parts.length === 4) {
          const subnetBcast = `${parts[0]}.${parts[1]}.${parts[2]}.255`;
          this.socket.send(buf, 0, buf.length, this.discoveryPort, subnetBcast, () => {});
        }
      }
    }
  }

  public stop(): void {
    if (this.beaconTimer) {
      clearInterval(this.beaconTimer);
      this.beaconTimer = null;
    }
    if (this.socket) {
      try {
        this.socket.close();
      } catch {}
      this.socket = null;
    }
  }
}
