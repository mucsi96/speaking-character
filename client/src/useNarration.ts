import { useEffect } from 'react';
import { useShow } from './store';
import { scenes } from './scenes';
import { audioEngine } from './audio';

/**
 * Whenever the show enters the `playing` phase for a scene, fetch and play that
 * scene's German narration, then report completion to the store so the parrot
 * can disappear and the color prompt can appear.
 */
export function useNarration(): void {
  const phase = useShow((s) => s.phase);
  const sceneIndex = useShow((s) => s.sceneIndex);
  const finishNarration = useShow((s) => s.finishNarration);

  useEffect(() => {
    if (phase !== 'playing') return;
    const scene = scenes[sceneIndex];
    if (!scene) return;

    const controller = new AbortController();
    let cancelled = false;

    audioEngine
      .speak(scene.text, controller.signal)
      .catch((err) => {
        // If TTS is unavailable, don't get stuck: log and continue the show
        // after a short delay so the kids can still proceed.
        console.error('Narration failed:', err);
        return new Promise<void>((r) => setTimeout(r, 1500));
      })
      .then(() => {
        if (!cancelled) finishNarration();
      });

    return () => {
      cancelled = true;
      controller.abort();
      audioEngine.stop();
    };
  }, [phase, sceneIndex, finishNarration]);
}
