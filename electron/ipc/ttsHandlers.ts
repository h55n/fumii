import { ipcMain } from 'electron';
import { EdgeTTSService } from '../services/EdgeTTSService';

export function registerTTSHandlers(edgeTTS: EdgeTTSService) {
  ipcMain.handle('tts:synthesize', async (_e, text: string, options?: any) => {
    try {
      if (!text || !text.trim()) return null;
      return await edgeTTS.synthesizeToDataUrl(text, options);
    } catch (err: any) {
      console.error('[IPC tts:synthesize] Failed:', err);
      return null;
    }
  });

  ipcMain.handle('tts:getEdgeVoices', async () => {
    try {
      return edgeTTS.getPresetVoices();
    } catch (err: any) {
      console.error('[IPC tts:getEdgeVoices] Failed:', err);
      return [];
    }
  });
}
