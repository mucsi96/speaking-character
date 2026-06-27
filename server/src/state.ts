/**
 * ============================================================================
 *  APP STATE — script + live show progress, persisted to a JSON file.
 * ============================================================================
 *  The server owns two things and keeps them in one JSON file on disk:
 *
 *   - `script` : the German show text (scenes + codes + reaction lines). This is
 *                what used to live (hard-coded) in `scenes.ts`; `scenes.ts` now
 *                only provides the *default* used to seed a fresh state file.
 *   - `show`   : the live application/progress state (`phase` + `sceneIndex`).
 *
 *  Both can be read over `GET /api/state` and changed over `PUT /api/state/*`.
 *  Every change is persisted to disk and broadcast to all connected clients via
 *  Server-Sent Events (`GET /api/events`), so the TV display and the admin UI
 *  stay in sync without anyone reloading.
 * ============================================================================
 */
import { EventEmitter } from 'node:events';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { script as defaultScript, type Scene, type Script } from './scenes.js';

export type { Scene, Script };

/** The screens/animation states the show can be in. Mirrors the client store. */
export type Phase =
  | 'idle'
  | 'playing'
  | 'waiting'
  | 'entering'
  | 'celebrating'
  | 'rejecting'
  | 'finished';

export const PHASES: Phase[] = [
  'idle',
  'playing',
  'waiting',
  'entering',
  'celebrating',
  'rejecting',
  'finished',
];

export interface ShowState {
  phase: Phase;
  sceneIndex: number;
}

export interface AppState {
  script: Script;
  show: ShowState;
  /** Bumped on every change; lets clients order/ignore stale updates. */
  rev: number;
}

/** Payload broadcast to SSE subscribers. `origin` is the client that caused the
 *  change (so it can ignore the echo of its own write), or null for the server. */
export interface StateChange {
  state: AppState;
  origin: string | null;
}

const STATE_FILE = resolve(
  process.env.STATE_FILE ?? join(process.cwd(), 'data', 'state.json')
);

/**
 * Ephemeral mode: never read or write `state.json`. The script is always seeded
 * fresh from the markdown content (`scenes.ts` → `content.ts`) and runtime edits
 * live only in memory, so a restart always reflects the latest content. Enabled
 * in local dev (`EPHEMERAL_STATE=1`, set by the server's `dev` script) so the
 * persisted file never shadows changes to the markdown.
 */
const EPHEMERAL = ['1', 'true'].includes((process.env.EPHEMERAL_STATE ?? '').toLowerCase());

const DEFAULT_SHOW: ShowState = { phase: 'idle', sceneIndex: 0 };

let state: AppState = { script: defaultScript, show: DEFAULT_SHOW, rev: 0 };

const emitter = new EventEmitter();
// One listener per connected SSE client; there is no fixed upper bound.
emitter.setMaxListeners(0);

export function getState(): AppState {
  return state;
}

export function getStateFilePath(): string {
  return STATE_FILE;
}

/** Every line the parrot can speak for a script — used to pre-render all TTS. */
export function allSpeechFor(s: Script): string[] {
  return [...s.scenes.map((scene) => scene.text), ...s.correctLines, ...s.wrongLines];
}

/** Validate + normalize an incoming script, throwing on anything malformed. */
export function sanitizeScript(input: unknown): Script {
  if (!input || typeof input !== 'object') {
    throw new Error('script must be an object');
  }
  const raw = input as Record<string, unknown>;
  if (!Array.isArray(raw.scenes) || raw.scenes.length === 0) {
    throw new Error('script.scenes must be a non-empty array');
  }

  const scenes: Scene[] = raw.scenes.map((s, i) => {
    if (!s || typeof s !== 'object') throw new Error(`scene ${i} must be an object`);
    const scene = s as Record<string, unknown>;
    const id = typeof scene.id === 'string' && scene.id.trim() ? scene.id.trim() : `scene-${i}`;
    if (typeof scene.text !== 'string') throw new Error(`scene ${i} is missing text`);
    const out: Scene = { id, text: scene.text };
    if (scene.code !== undefined && scene.code !== null && scene.code !== '') {
      const code = String(scene.code).trim();
      if (!/^\d$/.test(code)) throw new Error(`scene ${i} code must be a single digit`);
      out.code = code;
    }
    if (scene.pause === true) out.pause = true;
    return out;
  });

  const lines = (value: unknown, name: string): string[] => {
    if (!Array.isArray(value)) throw new Error(`script.${name} must be an array`);
    return value
      .map((line) => (typeof line === 'string' ? line : String(line)))
      .map((line) => line.trim())
      .filter(Boolean);
  };

  return {
    scenes,
    correctLines: lines(raw.correctLines, 'correctLines'),
    wrongLines: lines(raw.wrongLines, 'wrongLines'),
  };
}

/** Validate + clamp an incoming show state against the current script. */
export function sanitizeShow(input: unknown, script: Script = state.script): ShowState {
  if (!input || typeof input !== 'object') throw new Error('show must be an object');
  const raw = input as Record<string, unknown>;
  const phase = raw.phase as Phase;
  if (!PHASES.includes(phase)) throw new Error(`unknown phase: ${String(raw.phase)}`);
  const max = Math.max(0, script.scenes.length - 1);
  const idx = Number(raw.sceneIndex);
  const sceneIndex = Number.isFinite(idx) ? Math.min(Math.max(0, Math.trunc(idx)), max) : 0;
  return { phase, sceneIndex };
}

async function persist(): Promise<void> {
  if (EPHEMERAL) return; // dev: keep state in memory only, never touch disk
  await mkdir(dirname(STATE_FILE), { recursive: true });
  const tmp = `${STATE_FILE}.tmp`;
  await writeFile(tmp, JSON.stringify(state, null, 2), 'utf8');
  await rename(tmp, STATE_FILE); // atomic swap so a crash never leaves a partial file
}

/**
 * Load state from disk into memory. If the file is missing or unreadable/corrupt
 * it seeds the defaults (script from `scenes.ts`, idle show) and writes them.
 */
export async function loadState(): Promise<void> {
  if (EPHEMERAL) {
    // Always start from the markdown-built default; ignore any file on disk.
    state = { script: defaultScript, show: DEFAULT_SHOW, rev: 0 };
    console.log('[state] ephemeral mode: seeded from markdown, persistence disabled');
    return;
  }
  try {
    const parsed = JSON.parse(await readFile(STATE_FILE, 'utf8')) as Partial<AppState>;
    state = {
      script: sanitizeScript(parsed.script),
      show: sanitizeShow(parsed.show, sanitizeScript(parsed.script)),
      rev: typeof parsed.rev === 'number' ? parsed.rev : 0,
    };
    console.log(`[state] loaded ${STATE_FILE} (rev ${state.rev})`);
  } catch (err) {
    state = { script: defaultScript, show: DEFAULT_SHOW, rev: 0 };
    await persist();
    const reason = err instanceof Error ? err.message : String(err);
    console.log(`[state] seeded defaults at ${STATE_FILE} (${reason})`);
  }
}

function broadcast(origin: string | null): void {
  emitter.emit('change', { state, origin } satisfies StateChange);
}

/** Subscribe to state changes (used by the SSE endpoint). Returns an unsubscribe. */
export function subscribe(listener: (change: StateChange) => void): () => void {
  emitter.on('change', listener);
  return () => emitter.off('change', listener);
}

export async function setScript(script: Script, origin: string | null): Promise<AppState> {
  // Clamp the live scene index in case the new script has fewer scenes.
  const show = sanitizeShow(state.show, script);
  state = { script, show, rev: state.rev + 1 };
  await persist();
  broadcast(origin);
  return state;
}

export async function setShow(show: ShowState, origin: string | null): Promise<AppState> {
  state = { ...state, show, rev: state.rev + 1 };
  await persist();
  broadcast(origin);
  return state;
}
