import { create } from 'zustand';
import { scenes } from './scenes';

export type Phase = 'idle' | 'playing' | 'waiting' | 'finished';

interface ShowState {
  phase: Phase;
  sceneIndex: number;
  /** 0..1 mouth-open value derived from the audio, drives the beak/jaw. */
  mouthOpen: number;

  start: () => void;
  /** Called when the current scene's narration has finished playing. */
  finishNarration: () => void;
  /** Advance to the next scene (triggered by a colored remote button). */
  advance: () => void;
  reset: () => void;
  setMouthOpen: (value: number) => void;
}

export const useShow = create<ShowState>((set, get) => ({
  phase: 'idle',
  sceneIndex: 0,
  mouthOpen: 0,

  start: () => {
    if (get().phase !== 'idle') return;
    set({ phase: 'playing', sceneIndex: 0 });
  },

  finishNarration: () => {
    if (get().phase !== 'playing') return;
    const isLast = get().sceneIndex >= scenes.length - 1;
    set({ phase: isLast ? 'finished' : 'waiting', mouthOpen: 0 });
  },

  advance: () => {
    if (get().phase !== 'waiting') return;
    const next = get().sceneIndex + 1;
    if (next >= scenes.length) {
      set({ phase: 'finished' });
      return;
    }
    set({ phase: 'playing', sceneIndex: next });
  },

  reset: () => set({ phase: 'idle', sceneIndex: 0, mouthOpen: 0 }),

  setMouthOpen: (value) => set({ mouthOpen: value }),
}));
