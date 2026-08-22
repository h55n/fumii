import { create } from 'zustand';
import type { DeviceStatus, PairingStatus } from '../global';

interface DeviceState {
  status: DeviceStatus;
  pairingStatus: PairingStatus;
  isPairing: boolean;
  pairingError: string | null;
  load: () => Promise<void>;
  pair: () => Promise<void>;
  unpair: () => Promise<void>;
  setMode: (mode: 'companion' | 'assistant') => Promise<void>;
  identify: () => Promise<void>;
  restart: () => Promise<void>;
}

export const useDeviceStore = create<DeviceState>((set, get) => {
  // Listen for device state events if window.fumii is available
  if (typeof window !== 'undefined' && window.fumii?.on) {
    window.fumii.on('device:pairingStatusChanged', (pairingStatus: PairingStatus) => {
      set({ pairingStatus, isPairing: pairingStatus === 'pairing' });
    });

    window.fumii.on('device:statusChanged', (status: DeviceStatus) => {
      set({
        status,
        pairingStatus: status.pairingStatus || get().pairingStatus
      });
    });

    window.fumii.on('device:modeChanged', (mode: string) => {
      set({ status: { ...get().status, mode: mode as any } });
    });

    window.fumii.on('device:disconnected', () => {
      const current = get().status;
      set({
        status: { ...current, connected: false },
        pairingStatus: get().pairingStatus === 'paired' ? 'paired-offline' : get().pairingStatus
      });
    });
  }

  return {
    status: {
      connected: false,
      battery: null,
      wifi: null,
      lastSeen: null,
      mode: 'companion',
      pairingStatus: 'none-found'
    },
    pairingStatus: 'none-found',
    isPairing: false,
    pairingError: null,

    load: async () => {
      try {
        const [status, pairingStatus] = await Promise.all([
          window.fumii?.getDeviceStatus?.() || {
            connected: false,
            battery: null,
            wifi: null,
            lastSeen: null,
            mode: 'companion',
            pairingStatus: 'none-found'
          },
          window.fumii?.getPairingStatus?.() || 'none-found'
        ]);

        set({
          status,
          pairingStatus: pairingStatus || status.pairingStatus || 'none-found'
        });
      } catch (err: any) {
        console.warn('[deviceStore] failed to load status:', err);
      }
    },

    pair: async () => {
      set({ isPairing: true, pairingError: null, pairingStatus: 'pairing' });
      try {
        await window.fumii?.pairDevice?.();
        set({ isPairing: false, pairingStatus: 'paired' });
        await get().load();
      } catch (err: any) {
        set({
          isPairing: false,
          pairingError: err?.message || 'Pairing timed out or failed.',
          pairingStatus: 'found-unpaired'
        });
        throw err;
      }
    },

    unpair: async () => {
      try {
        await window.fumii?.unpairDevice?.();
        // Reload from main process to get the actual post-unpair state
        // (could be 'found-unpaired' if device is online, or 'none-found' if offline)
        await get().load();
        set({ isPairing: false });
      } catch (err: any) {
        console.warn('[deviceStore] unpair failed:', err);
      }
    },

    setMode: async (mode) => {
      await window.fumii?.setDeviceMode?.(mode);
      set({ status: { ...get().status, mode } });
    },

    identify: async () => {
      await window.fumii?.identifyDevice?.();
    },

    restart: async () => {
      await window.fumii?.restartDevice?.();
    }
  };
});
