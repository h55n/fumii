import type { IpcMain } from 'electron';
import type Database from 'better-sqlite3';
import { getAllSettings, getSetting, setSetting } from '../db/queries';
import { LLMService, type Provider } from '../services/LLMService';
import { WhisperService } from '../services/WhisperService';

type Deps = { db: Database.Database; llm?: LLMService; whisper?: WhisperService };

export function registerSettingsHandlers(ipcMain: IpcMain, deps: Deps) {
  const { db } = deps;
  const llm = deps.llm ?? new LLMService();
  const whisper = deps.whisper ?? new WhisperService();

  ipcMain.handle('settings:getAll', async () => getAllSettings(db));
  ipcMain.handle('settings:get', async (_e, key: string) => getSetting(db, key));
  ipcMain.handle('settings:set', async (_e, key: string, value: string) => {
    setSetting(db, key, value);
    return true;
  });

  ipcMain.handle('settings:setApiKey', async (_e, provider: Provider, key: string) => {
    await llm.setApiKey(provider, key);
    return true;
  });

  ipcMain.handle('settings:hasApiKey', async (_e, provider: Provider) => llm.hasApiKey(provider));

  ipcMain.handle('settings:testConnection', async (_e, provider: Provider) => {
    try {
      if (provider !== 'ollama') {
        const key = await llm.getApiKey(provider);
        if (!key || !key.trim()) {
          return { ok: false, error: `No API key saved for ${provider}. Please enter your key and click Save first.` };
        }
      } else {
        const isUp = await llm.isOllamaUp();
        if (!isUp) {
          return { ok: false, error: 'Ollama is not running at http://localhost:11434. Start Ollama and try again.' };
        }
      }

      let full = '';
      await llm.chatStreamProvider(
        provider,
        [
          { role: 'system', content: 'reply with exactly: ok' },
          { role: 'user', content: 'ping' }
        ],
        (t) => {
          full += t;
        }
      );

      if (!full.trim()) {
        return { ok: false, error: `${provider} connected but returned an empty response.` };
      }

      return { ok: true, response: full.trim().slice(0, 80) };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? 'connection failed' };
    }
  });

  // ─── Whisper STT Model Management ────────────────────────────────────────
  ipcMain.handle('whisper:getModels', async () => {
    const activeModel = getSetting(db, 'whisper_model') ?? 'base.en';
    return whisper.getModels(activeModel);
  });

  ipcMain.handle('whisper:downloadModel', async (event, modelId: string) => {
    const onProgress = (data: any) => event.sender.send('whisper:downloadProgress', data);
    const onDone = (data: any) => event.sender.send('whisper:downloadDone', data);
    const onError = (data: any) => event.sender.send('whisper:downloadError', data);

    whisper.once('download-done', onDone);
    whisper.once('download-error', onError);
    whisper.on('download-progress', onProgress);

    try {
      await whisper.downloadModel(modelId);
    } finally {
      whisper.off('download-progress', onProgress);
      whisper.off('download-done', onDone);
      whisper.off('download-error', onError);
    }
    return { ok: true };
  });

  ipcMain.handle('whisper:cancelDownload', async (_e, modelId: string) => {
    whisper.cancelDownload(modelId);
    return true;
  });

  ipcMain.handle('whisper:deleteModel', async (_e, modelId: string) => {
    whisper.deleteModel(modelId);
    return true;
  });

  ipcMain.handle('whisper:isAvailable', async (_e, modelId?: string) => {
    return whisper.isAvailable(modelId);
  });
}
