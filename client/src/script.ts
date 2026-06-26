/**
 * The show script now lives on the server (see `server/src/scenes.ts`). The
 * client fetches it once on startup via `GET /api/script`; the server also
 * pre-renders all of its TTS on boot so the live show is smooth.
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

/** Fetch the German show script (scene text + codes) from the server. */
export async function fetchScript(): Promise<Script> {
  const res = await fetch('/api/script');
  if (!res.ok) {
    throw new Error(`Failed to load script (${res.status}).`);
  }
  return (await res.json()) as Script;
}
