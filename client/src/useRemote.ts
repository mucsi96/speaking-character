import { useEffect } from 'react';
import { useShow } from './store';

// Keys that start / restart the show (Enter / OK on the remote, plus Space for
// desktop testing).
const START_KEYS = new Set(['Enter', ' ', 'Spacebar']);

/**
 * Global key handling for the TV remote:
 * - Enter / OK starts the show when idle (or restarts when finished).
 * - Enter / OK releases an OK-gated `waiting` pause (the C0 chest-fetch gate),
 *   so Coco reveals the locks once the chest is in the living room.
 *
 * Code entry between scenes is handled by the focused <input> in `CodeInput`
 * (the remote's number buttons type into it; OK submits the form), so we
 * deliberately only act here while `idle`, `waiting` or `finished` — otherwise
 * this listener's preventDefault would swallow the form's submit.
 */
export function useRemote(): void {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const { phase, start, reset, continueShow } = useShow.getState();

      if (!START_KEYS.has(e.key)) return;

      if (phase === 'idle') {
        e.preventDefault();
        start();
      } else if (phase === 'waiting') {
        e.preventDefault();
        continueShow();
      } else if (phase === 'finished') {
        e.preventDefault();
        reset();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
