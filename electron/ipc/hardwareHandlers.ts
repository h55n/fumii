import type { IpcMain } from 'electron';
import type { MQTTBroker } from '../services/MQTTBroker';
import type { DiscoveryService } from '../services/DiscoveryService';
import type Database from 'better-sqlite3';
import { randomBytes } from 'crypto';
import { getSetting, setSetting } from '../db/queries';

export type PairingStatus = 'none-found' | 'found-unpaired' | 'pairing' | 'paired' | 'paired-offline';

export type DeviceStatus = {
  connected: boolean;
  battery: number | null;
  wifi: string | null;
  wifiRssi?: number | null;
  lastSeen: string | null;
  mode: 'companion' | 'assistant';
  pairingStatus: PairingStatus;
  firmwareVersion?: string;
  ip?: string;
  apSsid?: string;  // SSID advertised by SoftAP during first-time provisioning
};

/**
 * Registers the Device & Zero-Friction Pairing IPC surface.
 * Manages device discovery, token exchange, and authenticated command dispatch.
 */
export function registerHardwareHandlers(
  ipcMain: IpcMain,
  deps: {
    db: Database.Database;
    broker: MQTTBroker | null;
    discovery: DiscoveryService | null;
    getSpriteWindow: () => Electron.BrowserWindow | null;
    getDashboardWindow: () => Electron.BrowserWindow | null;
  }
) {
  let rawDeviceStatus: 'online' | 'unpaired' | 'offline' | null = null;
  let status: DeviceStatus = {
    connected: false,
    battery: null,
    wifi: null,
    wifiRssi: null,
    lastSeen: null,
    mode: (getSetting(deps.db, 'active_mode') as any) || 'companion',
    pairingStatus: 'none-found',
    ip: undefined,
    firmwareVersion: undefined
  };

  const broadcast = (channel: string, ...args: any[]) => {
    deps.getSpriteWindow()?.webContents.send(channel, ...args);
    deps.getDashboardWindow()?.webContents.send(channel, ...args);
  };

  const getSavedToken = (): string => getSetting(deps.db, 'paired_token') || '';
  const getDesktopId = (): string => getSetting(deps.db, 'desktop_id') || '';

  const updatePairingStatus = () => {
    const token = getSavedToken();
    const isRecent = status.lastSeen && (Date.now() - new Date(status.lastSeen).getTime() < 5500);

    if (token) {
      // We have a pairing token
      if (rawDeviceStatus === 'online' && isRecent) {
        status.pairingStatus = 'paired';
        status.connected = true;
      } else {
        status.pairingStatus = 'paired-offline';
        status.connected = false;
      }
    } else {
      // No pairing token saved
      if (status.pairingStatus === 'pairing') {
        // Keep pairing state during handshake
        return;
      }
      if ((rawDeviceStatus === 'unpaired' || rawDeviceStatus === 'online') && isRecent) {
        status.pairingStatus = 'found-unpaired';
        status.connected = false;
      } else {
        status.pairingStatus = 'none-found';
        status.connected = false;
      }
    }

    broadcast('device:pairingStatusChanged', status.pairingStatus);
    broadcast('device:statusChanged', status);
  };

  // Initialize initial state
  const initialToken = getSavedToken();
  status.pairingStatus = initialToken ? 'paired-offline' : 'none-found';

  // Listen to MQTT messages from device
  deps.broker?.on('message', (topic: string, payload: string) => {
    if (topic === 'fumii/device/status') {
      if (payload === 'online') {
        rawDeviceStatus = 'online';
        status.lastSeen = new Date().toISOString();
      } else if (payload === 'unpaired') {
        rawDeviceStatus = 'unpaired';
        status.lastSeen = new Date().toISOString();
      } else if (payload === 'offline') {
        rawDeviceStatus = 'offline';
      }
      updatePairingStatus();
    } else if (topic === 'fumii/device/heartbeat') {
      if (!rawDeviceStatus || rawDeviceStatus === 'offline') {
        rawDeviceStatus = getSavedToken() ? 'online' : 'unpaired';
      }
      status.lastSeen = new Date().toISOString();
      updatePairingStatus();
    } else if (topic === 'fumii/device/battery') {
      status.battery = parseInt(payload, 10);
      broadcast('device:statusChanged', status);
    } else if (topic === 'fumii/device/wifi') {
      // The device reports its connected home Wi-Fi SSID after joining.
      // Store it both as the wifi field (telemetry tile) and apSsid is cleared.
      status.wifi = payload;
      status.apSsid = undefined;
      broadcast('device:statusChanged', status);
    } else if (topic === 'fumii/device/wifi_rssi') {
      status.wifiRssi = parseInt(payload, 10);
      broadcast('device:statusChanged', status);
    } else if (topic === 'fumii/device/ip') {
      status.ip = payload;
      broadcast('device:statusChanged', status);
    } else if (topic === 'fumii/device/firmware_version') {
      status.firmwareVersion = payload;
      broadcast('device:statusChanged', status);
    } else if (topic === 'fumii/device/mode') {
      status.mode = payload as 'companion' | 'assistant';
      setSetting(deps.db, 'active_mode', payload);
      broadcast('device:modeChanged', payload);
      broadcast('device:statusChanged', status);
    } else if (topic === 'fumii/device/wake') {
      broadcast('device:wake');
    }
  });

  // Heartbeat timeout check (5.5s)
  const heartbeatInterval = setInterval(() => {
    if (status.lastSeen && Date.now() - new Date(status.lastSeen).getTime() > 5500) {
      if (rawDeviceStatus !== 'offline') {
        rawDeviceStatus = 'offline';
        updatePairingStatus();
        broadcast('device:disconnected');
      }
    }
  }, 2000);

  // ── IPC Handlers ──

  ipcMain.handle('hardware:getStatus', () => status);
  ipcMain.handle('hardware:getPairingStatus', () => status.pairingStatus);
  ipcMain.handle('hardware:getNetworkInfo', () => {
    return deps.discovery?.getNetworkInfo() || {
      localIp: '127.0.0.1',
      hostname: 'localhost',
      mqttPort: 1883,
      wsPort: 8765,
      discoveryPort: 8766,
      allIps: ['127.0.0.1']
    };
  });

  ipcMain.handle('hardware:pairDevice', async () => {
    const desktopId = getDesktopId();
    const token = randomBytes(16).toString('hex');
    // Record the exact moment we sent the pair command. We'll only accept
    // a "paired" confirmation if a heartbeat arrives AFTER this time — this
    // ensures the token truly propagated to the device rather than resolving
    // immediately from a stale cached status.
    const pairInitiatedAt = Date.now();

    status.pairingStatus = 'pairing';
    broadcast('device:pairingStatusChanged', 'pairing');

    console.log(`[hardware] initiating pair with desktop_id=${desktopId}`);
    deps.broker?.publish(
      'fumii/desktop/pair',
      JSON.stringify({ desktop_id: desktopId, token })
    );

    // Wait for device to confirm it received the pair token via a heartbeat
    // that arrived AFTER we sent the command. Timeout is 12s to accommodate
    // devices that just finished captive-portal provisioning and are still
    // rejoining their home Wi-Fi before MQTT reconnects.
    return new Promise<boolean>((resolve, reject) => {
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          cleanup();
          status.pairingStatus = rawDeviceStatus === 'unpaired' ? 'found-unpaired' : 'none-found';
          broadcast('device:pairingStatusChanged', status.pairingStatus);
          reject(new Error('Pairing timed out. Make sure your Fumii is on and connected to Wi-Fi.'));
        }
      }, 12000);

      const checkConfirmation = () => {
        // Only confirm if the device is online AND sent a heartbeat AFTER
        // we initiated the pair — ruling out stale retained broker state.
        const lastSeenMs = status.lastSeen ? new Date(status.lastSeen).getTime() : 0;
        if (rawDeviceStatus === 'online' && lastSeenMs > pairInitiatedAt) {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            cleanup();
            setSetting(deps.db, 'paired_token', token);
            setSetting(deps.db, 'paired_device_id', desktopId);
            status.pairingStatus = 'paired';
            status.connected = true;
            broadcast('device:pairingStatusChanged', 'paired');
            broadcast('device:statusChanged', status);
            console.log('[hardware] pair confirmed and saved successfully');
            resolve(true);
          }
        }
      };

      const interval = setInterval(checkConfirmation, 100);
      const cleanup = () => clearInterval(interval);
    });
  });

  ipcMain.handle('hardware:unpairDevice', async () => {
    const token = getSavedToken();
    if (token) {
      console.log('[hardware] sending unpair request to device');
      deps.broker?.publish('fumii/desktop/unpair', JSON.stringify({ token }));
    }

    setSetting(deps.db, 'paired_token', '');
    setSetting(deps.db, 'paired_device_id', '');

    status.pairingStatus = (rawDeviceStatus === 'online' || rawDeviceStatus === 'unpaired') ? 'found-unpaired' : 'none-found';
    status.connected = false;
    broadcast('device:pairingStatusChanged', status.pairingStatus);
    broadcast('device:statusChanged', status);
    return true;
  });

  ipcMain.handle('hardware:setMode', (_e, mode: 'companion' | 'assistant') => {
    setSetting(deps.db, 'active_mode', mode);
    const token = getSavedToken();
    deps.broker?.publish('fumii/desktop/leds', JSON.stringify({
      color: mode === 'companion' ? '#F5A623' : '#3B82F6',
      pattern: 'pulse',
      token
    }));
    deps.broker?.publish('fumii/desktop/haptic', JSON.stringify({ pattern: 1, token }));
    deps.broker?.publish('fumii/desktop/face', JSON.stringify({ state: 'waving', token }));
    status.mode = mode;
    broadcast('device:statusChanged', status);
    return true;
  });

  ipcMain.handle('hardware:sendLED', (_e, color: string, pattern: string) => {
    const token = getSavedToken();
    deps.broker?.publish('fumii/desktop/leds', JSON.stringify({ color, pattern, token }));
    return true;
  });

  ipcMain.handle('hardware:identify', () => {
    const token = getSavedToken();
    deps.broker?.publish('fumii/desktop/identify', JSON.stringify({ action: 'identify', token }));
    return true;
  });

  ipcMain.handle('hardware:restart', () => {
    const token = getSavedToken();
    deps.broker?.publish('fumii/desktop/identify', JSON.stringify({ action: 'restart', token }));
    return true;
  });

  return {
    cleanup: () => {
      clearInterval(heartbeatInterval);
    }
  };
}
