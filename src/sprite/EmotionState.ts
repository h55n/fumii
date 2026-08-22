export type FumiiState =
  | 'idle'
  | 'walk-left'
  | 'walk-right'
  | 'waving'
  | 'speaking'
  | 'happy'
  | 'jumping'
  | 'celebrating'
  | 'confused'
  | 'concerned'
  | 'listening'
  | 'waiting'
  | 'running'
  | 'thinking'
  | 'review'
  | 'sleepy';

export type BehaviorMode = 'wander' | 'attentive' | 'calm';

export type CodexRow =
  | 'idle'
  | 'running-right'
  | 'running-left'
  | 'waving'
  | 'jumping'
  | 'failed'
  | 'waiting'
  | 'running'
  | 'review';

export const STATE_TO_ROW: Record<FumiiState, CodexRow> = {
  idle: 'idle',
  'walk-right': 'running-right',
  'walk-left': 'running-left',
  waving: 'waving',
  speaking: 'waving',
  happy: 'jumping',
  jumping: 'jumping',
  celebrating: 'jumping',
  confused: 'failed',
  concerned: 'failed',
  listening: 'waiting',
  waiting: 'waiting',
  running: 'running',
  thinking: 'review',
  review: 'review',
  sleepy: 'idle'
};

export const CODEX_ROW_INDEX: Record<CodexRow, number> = {
  idle: 0,
  'running-right': 1,
  'running-left': 2,
  waving: 3,
  jumping: 4,
  failed: 5,
  waiting: 6,
  running: 7,
  review: 8
};

export function detectStateFromResponse(text: string): FumiiState {
  const t = text.toLowerCase();
  if (/wow|exciting|incredible|amazing|unbelievable|yay|celebrate|hooray/.test(t)) return 'jumping';
  if (/happy|great|congrat|proud|awesome|love|sweet|nice/.test(t)) return 'happy';
  if (/think|analyz|calculat|ponder|wonder|inspect|searching/.test(t)) return 'thinking';
  if (/hard|difficult|sorry|tough|tired|stressed|struggling|error|failed|oops/.test(t)) return 'confused';
  if (/listen|hear|tell me|go on|waiting/.test(t)) return 'listening';
  if (/hello|hi|hey|greetings|welcome/.test(t)) return 'waving';
  return 'speaking';
}

