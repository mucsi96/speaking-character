/**
 * ============================================================================
 *  SCRIPT TYPES + DEFAULT SCRIPT
 * ============================================================================
 *  The script is the complete text Käpten Coco (the pirate parrot) speaks.
 *  It is no longer hard-coded here: the *default* is assembled at startup from
 *  the markdown show content under `client/src/script/content/` — see
 *  `content.ts` for the mapping. This keeps the spoken show and the printable
 *  guide in lock-step.
 *
 *  A `Scene` has a `text` (read aloud via ElevenLabs) and an optional single
 *  digit `code` the kids enter to continue. `correctLines`/`wrongLines` are the
 *  generic reactions Coco plays on a right/wrong answer.
 *
 *  The script lives on the server: it is served via `GET /api/script` /
 *  `GET /api/state` and pre-rendered on startup (cache preheat) so the live
 *  show never waits on ElevenLabs. The default only seeds a fresh state file —
 *  admins can still override it at runtime from the admin page.
 * ============================================================================
 */
import { buildDefaultScript } from './content.js';

export interface Scene {
  id: string;
  text: string;
  /** Single-digit answer the kids must enter to continue (optional). */
  code?: string;
  /**
   * When true, the show does NOT auto-advance after this codeless scene's
   * narration — it waits for a grown-up to press OK/Enter. Used by the C0
   * prologue so the kids have time to fetch the chest and carry it to the
   * living room before Coco reveals the locks.
   */
  pause?: boolean;
}

export interface Script {
  scenes: Scene[];
  correctLines: string[];
  wrongLines: string[];
}

/** The default script, built from the markdown content (used to seed state). */
export const script: Script = buildDefaultScript();
