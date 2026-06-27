import { create } from 'zustand';
import { fetchScript, type Script } from './script';

export type Phase =
  | 'idle'
  | 'playing'
  // Narration is done and the scene has a secret code: waiting for the kids to
  // type it on the remote.
  | 'entering'
  // The entered code was correct: the parrot plays its `celebrate` clip.
  | 'celebrating'
  // The entered code was wrong: the parrot plays its `wrong` clip, then the kids
  // get another try.
  | 'rejecting'
  | 'finished';

interface ShowState {
  phase: Phase;
  sceneIndex: number;
  /** 0..1 mouth-open value derived from the audio, drives the beak/jaw. */
  mouthOpen: number;
  /** The show script, fetched from the server. Null until it has loaded. */
  script: Script | null;

  /** Fetch the script from the server. Called once on startup. */
  loadScript: () => Promise<void>;
  start: () => void;
  /** Called when the current scene's narration has finished playing. */
  finishNarration: () => void;
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

export const useShow = create<ShowState>((set, get) => ({
  phase: 'idle',
  sceneIndex: 0,
  mouthOpen: 0,
  script: null,

  loadScript: async () => {
    if (get().script) return;
    try {
      set({ script: await fetchScript() });
    } catch (err) {
      console.error('Failed to load show script:', err);
    }
  },

  start: () => {
    // Don't start until the script has loaded, or there'd be nothing to play.
    if (get().phase !== 'idle' || !get().script) return;
    set({ phase: 'playing', sceneIndex: 0 });
  },

  finishNarration: () => {
    if (get().phase !== 'playing') return;
    const scenes = get().script?.scenes ?? [];
    const scene = scenes[get().sceneIndex];
    const isLast = get().sceneIndex >= scenes.length - 1;
    // A scene with a `code` gates progress behind the kids entering it; without
    // one (e.g. the outro) the show just ends.
    if (scene?.code && !isLast) {
      set({ phase: 'entering', mouthOpen: 0 });
    } else {
      set({ phase: 'finished', mouthOpen: 0 });
    }
  },

  submitCode: (code) => {
    if (get().phase !== 'entering') return;
    const scene = get().script?.scenes[get().sceneIndex];
    const correct = scene?.code === code.trim();
    set({ phase: correct ? 'celebrating' : 'rejecting' });
  },

  reactionDone: () => {
    const phase = get().phase;
    if (phase === 'celebrating') {
      const next = get().sceneIndex + 1;
      if (next >= (get().script?.scenes.length ?? 0)) {
        set({ phase: 'finished' });
      } else {
        set({ phase: 'playing', sceneIndex: next });
      }
    } else if (phase === 'rejecting') {
      // Wrong guess — back to the code prompt for another try.
      set({ phase: 'entering' });
    }
  },

  reset: () => set({ phase: 'idle', sceneIndex: 0, mouthOpen: 0 }),

  setMouthOpen: (value) => set({ mouthOpen: value }),
}));
