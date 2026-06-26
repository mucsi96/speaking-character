import { allSpeech } from './scenes';

let requested = false;

/**
 * Ask the server to warm the TTS disk cache for every line Coco can speak, so
 * the first time each line plays during the live show there's no ElevenLabs
 * latency. Fire-and-forget: the actual warm-up runs (and logs progress) on the
 * server. Safe to call more than once — it only fires a single request per load.
 */
export function precacheSpeech(): void {
  if (requested) return;
  requested = true;

  void fetch('/api/precache', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts: allSpeech }),
  })
    .then(async (res) => {
      if (!res.ok) {
        console.warn(`Precache request rejected (${res.status}).`);
        return;
      }
      const data = await res.json().catch(() => null);
      console.log('Precache requested; warm-up runs in the server logs.', data ?? '');
    })
    .catch((err) => {
      // Non-fatal: lines are still synthesized on demand if warm-up fails.
      console.warn('Precache request failed:', err);
    });
}
