/**
 * Client <-> server API for the shared app state.
 *
 * The server owns the script and the live show progress and persists them to a
 * JSON file (see `server/src/state.ts`). Clients read the state once over REST,
 * then subscribe to Server-Sent Events so script edits and show-state changes
 * arrive live without a reload. Writes are tagged with `clientId` so a client
 * can ignore the echo of its own change.
 */

export interface Scene {
  id: string;
  text: string;
  /** Single-digit answer the kids must enter to continue (optional). */
  code?: string;
}

export interface Script {
  scenes: Scene[];
  correctLines: string[];
  wrongLines: string[];
}

export type Phase =
  | 'idle'
  | 'playing'
  | 'entering'
  | 'celebrating'
  | 'rejecting'
  | 'finished';

export interface ShowState {
  phase: Phase;
  sceneIndex: number;
}

export interface AppState {
  script: Script;
  show: ShowState;
  rev: number;
}

/** Stable per-tab id, used to ignore the SSE echo of our own writes. */
export const clientId = `c_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

export async function fetchState(): Promise<AppState> {
  const res = await fetch('/api/state');
  if (!res.ok) throw new Error(`Failed to load state (${res.status}).`);
  return (await res.json()) as AppState;
}

export async function putShow(show: ShowState): Promise<void> {
  await fetch('/api/state/show', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ show, origin: clientId }),
  });
}

export async function putScript(script: Script): Promise<void> {
  const res = await fetch('/api/state/script', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ script, origin: clientId }),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error((detail as { error?: string }).error ?? `Save failed (${res.status}).`);
  }
}

/**
 * Subscribe to live state updates. `onState` is called with the full state and
 * the `origin` of the change (the `clientId` that caused it, or null for the
 * server's initial snapshot). Returns an unsubscribe function.
 */
export function subscribeState(
  onState: (state: AppState, origin: string | null) => void
): () => void {
  const es = new EventSource('/api/events');
  es.onmessage = (event) => {
    try {
      const { state, origin } = JSON.parse(event.data) as {
        state: AppState;
        origin: string | null;
      };
      onState(state, origin);
    } catch {
      /* ignore malformed frames */
    }
  };
  return () => es.close();
}
