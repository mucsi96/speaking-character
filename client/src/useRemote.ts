import { useEffect } from 'react';
import { useShow } from './store';

// LG webOS / HbbTV colored remote buttons.
const COLOR_KEYCODES = new Set([403, 404, 405, 406]); // red, green, yellow, blue
// Keys that start the show (Enter / OK on the remote, plus Space for desktop).
const START_KEYS = new Set(['Enter', ' ', 'Spacebar']);

/**
 * Global key handling for the TV remote:
 * - Enter / OK starts the show when idle (or restarts when finished).
 * - Any colored button advances to the next scene while waiting.
 */
export function useRemote(): void {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const { phase, start, advance, reset } = useShow.getState();

      if (COLOR_KEYCODES.has(e.keyCode)) {
        e.preventDefault();
        if (phase === 'waiting') advance();
        return;
      }

      if (START_KEYS.has(e.key)) {
        e.preventDefault();
        if (phase === 'idle') start();
        else if (phase === 'finished') reset();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
