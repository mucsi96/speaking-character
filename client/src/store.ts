import { create } from 'zustand';
import {
  clientId,
  fetchState,
  putShow,
  subscribeState,
  type AppState,
  type Phase,
  type Script,
} from './api';

export type { Phase };

interface ShowState {
  phase: Phase;
  sceneIndex: number;
  /** 0..1 mouth-open value derived from the audio, drives the beak/jaw. */
  mouthOpen: number;
  /** The show script, fetched from the server. Null until it has loaded. */
  script: Script | null;
  /** Scene index the server last persisted — what "resume" continues from. */
  savedSceneIndex: number;
  /** Whether the server has progress worth resuming (mid-show, not finished). */
  hasProgress: boolean;
  /**
   * True once the kids have pressed Start/Resume on this page load. Until then
   * the display ignores remote show-state pushes and stays on the start screen,
   * so a reload always shows start/resume first (and audio stays gated behind a
   * user gesture). Script edits still apply live regardless.
   */
  live: boolean;

  /** Fetch the script + show state from the server. Called once on startup. */
  loadState: () => Promise<void>;
  /** Apply a live state update pushed over SSE (script always, show if live). */
  applyRemoteState: (state: AppState, origin: string | null) => void;
  start: () => void;
  /** Continue the show from the server's saved scene index. */
  resume: () => void;
  /** Called when the current scene's narration has finished playing. */
  finishNarration: () => void;
  /** Advance past an OK-gated `waiting` pause (the C0 chest-fetch gate). */
  continueShow: () => void;
  /**
   * Validate a code the kids typed on the remote while `entering`.
   * Correct → `celebrating`; wrong → `rejecting`.
   */
  submitCode: (code: string) => void;
  /**
   * Called by the parrot when a `celebrate`/`wrong` reaction clip finishes.
   * From `celebrating` it advances to the next scene; from `rejecting` it lets
   * the kids try the code again.
   */
  reactionDone: () => void;
  reset: () => void;
  setMouthOpen: (value: number) => void;
}

/** Persist the resulting screen state to the server (fire-and-forget). */
function push(phase: Phase, sceneIndex: number): void {
  void putShow({ phase, sceneIndex });
}

export const useShow = create<ShowState>((set, get) => ({
  phase: 'idle',
  sceneIndex: 0,
  mouthOpen: 0,
  script: null,
  savedSceneIndex: 0,
  hasProgress: false,
  live: false,

  loadState: async () => {
    try {
      const state = await fetchState();
      // Note: the local phase stays `idle` on purpose — a reload always shows
      // the start/resume screen first, never the server's mid-show phase.
      set({
        script: state.script,
        savedSceneIndex: state.show.sceneIndex,
        hasProgress: state.show.sceneIndex > 0 && state.show.phase !== 'finished',
      });
    } catch (err) {
      console.error('Failed to load show state:', err);
    }
  },

  applyRemoteState: (state, origin) => {
    // Script edits and progress info always apply, even before the user starts.
    set({
      script: state.script,
      savedSceneIndex: state.show.sceneIndex,
      hasProgress: state.show.sceneIndex > 0 && state.show.phase !== 'finished',
    });
    // Don't act on the echo of our own write, and don't drive the screen until
    // the kids have pressed Start/Resume on this page load.
    if (origin === clientId || !get().live) return;
    set({ phase: state.show.phase, sceneIndex: state.show.sceneIndex, mouthOpen: 0 });
  },

  start: () => {
    // Don't start until the script has loaded, or there'd be nothing to play.
    if (get().phase !== 'idle' || !get().script) return;
    set({ phase: 'playing', sceneIndex: 0, live: true });
    push('playing', 0);
  },

  resume: () => {
    if (get().phase !== 'idle' || !get().script) return;
    const max = (get().script?.scenes.length ?? 1) - 1;
    const sceneIndex = Math.min(get().savedSceneIndex, Math.max(0, max));
    set({ phase: 'playing', sceneIndex, live: true });
    push('playing', sceneIndex);
  },

  finishNarration: () => {
    if (get().phase !== 'playing') return;
    const scenes = get().script?.scenes ?? [];
    const sceneIndex = get().sceneIndex;
    const scene = scenes[sceneIndex];
    const isLast = sceneIndex >= scenes.length - 1;
    if (isLast) {
      // The final scene (the gold finale) has no answer — the show just ends.
      set({ phase: 'finished', mouthOpen: 0 });
      push('finished', sceneIndex);
    } else if (scene?.code) {
      // A scene with a `code` gates progress behind the kids entering it.
      set({ phase: 'entering', mouthOpen: 0 });
      push('entering', sceneIndex);
    } else if (scene?.pause) {
      // A `pause` scene (the C0 prologue) waits for a grown-up to press OK once
      // the kids have carried the chest into the living room — only then does
      // Coco reveal the locks. Hold here instead of auto-advancing.
      set({ phase: 'waiting', mouthOpen: 0 });
      push('waiting', sceneIndex);
    } else {
      // A codeless mid-show narration (a lock's intro, an unlock celebration or
      // a break) has nothing to enter — roll straight on to the next scene once
      // Coco finishes speaking. Without this the chest reveal that sends the
      // kids to the kitchen would end the show before C1 is asked.
      const next = sceneIndex + 1;
      set({ phase: 'playing', sceneIndex: next, mouthOpen: 0 });
      push('playing', next);
    }
  },

  continueShow: () => {
    if (get().phase !== 'waiting') return;
    const next = get().sceneIndex + 1;
    set({ phase: 'playing', sceneIndex: next, mouthOpen: 0 });
    push('playing', next);
  },

  submitCode: (code) => {
    if (get().phase !== 'entering') return;
    const scene = get().script?.scenes[get().sceneIndex];
    const correct = scene?.code === code.trim();
    const phase = correct ? 'celebrating' : 'rejecting';
    set({ phase });
    push(phase, get().sceneIndex);
  },

  reactionDone: () => {
    const phase = get().phase;
    if (phase === 'celebrating') {
      const next = get().sceneIndex + 1;
      if (next >= (get().script?.scenes.length ?? 0)) {
        set({ phase: 'finished' });
        push('finished', get().sceneIndex);
      } else {
        set({ phase: 'playing', sceneIndex: next });
        push('playing', next);
      }
    } else if (phase === 'rejecting') {
      // Wrong guess — back to the code prompt for another try.
      set({ phase: 'entering' });
      push('entering', get().sceneIndex);
    }
  },

  reset: () => {
    set({ phase: 'idle', sceneIndex: 0, mouthOpen: 0 });
    push('idle', 0);
  },

  setMouthOpen: (value) => set({ mouthOpen: value }),
}));

/** Wire up the live SSE subscription to the store. Idempotent per page load. */
let unsubscribe: (() => void) | null = null;
export function startStateSync(): void {
  if (unsubscribe) return;
  unsubscribe = subscribeState((state, origin) =>
    useShow.getState().applyRemoteState(state, origin)
  );
}
