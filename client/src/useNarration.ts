import { useEffect } from 'react';
import { useShow } from './store';
import { audioEngine } from './audio';

function pick(lines: string[]): string {
  return lines[Math.floor(Math.random() * lines.length)];
}

/**
 * Drives all of the parrot's speech and the phase transitions that follow it:
 *
 * - `playing`     → speak the scene's task, then wait for the code (or finish).
 * - `celebrating` → speak a generic praise line over the `celebrate` animation,
 *   then advance to the next scene.
 * - `rejecting`   → speak a generic "try again" line over the `wrong` animation,
 *   then return to the code prompt.
 *
 * Tying the transition to the *speech* (not the animation) means feedback always
 * has duration and a voice line even if the model lacks the reaction clips, and
 * the show still advances when TTS is unavailable (the speak() fallback resolves
 * after a short delay).
 */
export function useNarration(): void {
  const phase = useShow((s) => s.phase);
  const sceneIndex = useShow((s) => s.sceneIndex);
  const script = useShow((s) => s.script);
  const finishNarration = useShow((s) => s.finishNarration);
  const reactionDone = useShow((s) => s.reactionDone);

  useEffect(() => {
    if (!script) return;

    let text: string;
    let onDone: () => void;

    if (phase === 'playing') {
      const scene = script.scenes[sceneIndex];
      if (!scene) return;
      text = scene.text;
      onDone = finishNarration;
    } else if (phase === 'celebrating') {
      text = pick(script.correctLines);
      onDone = reactionDone;
    } else if (phase === 'rejecting') {
      text = pick(script.wrongLines);
      onDone = reactionDone;
    } else {
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    audioEngine
      .speak(text, controller.signal)
      .catch((err) => {
        // If TTS is unavailable, don't get stuck: log and continue the show
        // after a short delay so the kids can still proceed.
        console.error('Narration failed:', err);
        return new Promise<void>((r) => setTimeout(r, 1500));
      })
      .then(() => {
        if (!cancelled) onDone();
      });

    return () => {
      cancelled = true;
      controller.abort();
      audioEngine.stop();
    };
  }, [phase, sceneIndex, script, finishNarration, reactionDone]);
}
