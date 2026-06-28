/**
 * ============================================================================
 *  DEFAULT SCRIPT — built from the markdown show content.
 * ============================================================================
 *  The default show script is no longer hard-coded. It is assembled at startup
 *  from the markdown sources under `client/src/script/content/` — the same
 *  files that drive the printable guide — so the spoken show and the written
 *  plan can never drift apart.
 *
 *  This only produces the *default* used to seed a fresh state file. Admins can
 *  still replace the live script at runtime via the admin page
 *  (`PUT /api/state/script`); that edit is persisted and wins on later boots.
 *  Delete `data/state.json` to regenerate the default from the markdown. In
 *  local dev the server runs ephemerally (`EPHEMERAL_STATE=1`) and ignores the
 *  file entirely, so the markdown is always the source of truth.
 *
 *  The content is a *flat* list of challenges (`challenges/<id>/`), one per
 *  scene, walked in `order`. Every scene maps 1:1 onto a `challenge.md`:
 *       * a challenge with a `code` is a code gate — the kids enter the single
 *         digit to advance (`C1`..`C12`);
 *       * a challenge without a `code` is an OK gate — Coco speaks and the show
 *         waits for a grown-up to press OK (the C0 prologue, the breaks
 *         `<id>-break`). The very last codeless scene (the gold finale) simply
 *         ends the show. There is no separate unlock scene per lock: the kids
 *         set its dials digit by digit as they solve each challenge, so Coco's
 *         praise on the final digit is the celebration.
 *  Coco speaks before every challenge and never explains the task — the puzzle
 *  lives on the printable in the challenge's folder — so the scene is the
 *  spoken lead-in only, with no question appended. The four locks ride along as
 *  printable-only metadata (`lock:`) on the challenge that opens each; their
 *  lead-in narration is folded into that challenge's own `lines`.
 *
 *  The reaction lines (`correctLines`/`wrongLines`) are generic and stay curated
 *  here — the markdown has no equivalent and the gentle, encouraging tone for
 *  the kids matters.
 * ============================================================================
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import type { Scene, Script } from './scenes.js';

/** Where the markdown content lives. Resolves from `server/src` (dev) and
 *  `server/dist` (built) to the sibling client package, and to
 *  `/app/client/src/script/content` inside the Docker runtime image. */
const CONTENT_DIR = resolve(
  process.env.CONTENT_DIR ??
    join(dirname(fileURLToPath(import.meta.url)), '../../client/src/script/content')
);

/** Curated praise lines Käpten Coco speaks on a correct code (one at random). */
const correctLines: string[] = [
  'Yo-ho-ho! Das war goldrichtig, ihr schlauen Seeräuber!',
  'Arrr! Genau die richtige Zahl! Weiter geht die Schatzsuche!',
  'Bravo, kleine Piraten! Volltreffer!',
];

/** Curated encouragement lines for a wrong code. The tone stays calm and
 *  inviting — never cross — so the kids happily take another try. */
const wrongLines: string[] = [
  'Das war noch nicht die richtige Zahl, aber das macht gar nichts. ' +
    'Da habt ihr euch wohl verzählt. Geht nochmal ganz in Ruhe zur Aufgabe ' +
    'zurück, löst sie in Ruhe und holt euch die richtige Zahl. Ihr schafft das!',
  'Fast geschafft, kleine Piraten! Diese Zahl passt noch nicht ganz. ' +
    'Geht nochmal zurück zur Aufgabe und schaut euch alles ganz genau an, ' +
    'dann findet ihr die richtige Zahl. Ich glaube ganz fest an euch!',
  'Kein Problem, das passiert den besten Seeräubern! Da hat sich ein kleiner ' +
    'Fehler eingeschlichen. Macht die Aufgabe in Ruhe nochmal, dann habt ihr ' +
    'die richtige Zahl. Ihr seid clever genug, das zu lösen!',
];

// --- markdown parsing (mirrors client/src/script/markdown.ts) ----------------

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/** Frontmatter of a markdown file as a plain object (empty when absent). */
function frontmatter(raw: string): Record<string, unknown> {
  const match = raw.match(FRONTMATTER);
  if (!match) return {};
  return (parseYaml(match[1]) as Record<string, unknown> | null) ?? {};
}

/** Recursively collect every `.md` file under `dir`, keyed by its path. */
function collect(dir: string, out: Record<string, Record<string, unknown>> = {}): Record<
  string,
  Record<string, unknown>
> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) collect(full, out);
    else if (entry.name.endsWith('.md')) out[full] = frontmatter(readFileSync(full, 'utf8'));
  }
  return out;
}

// --- text cleaning for TTS ---------------------------------------------------

/** Turn show markdown into plain prose for ElevenLabs: drop emphasis markers,
 *  inline HTML, decorative quotes and emoji, then collapse whitespace. */
function cleanText(input: unknown): string {
  return String(input ?? '')
    .replace(/<[^>]+>/g, ' ') // inline HTML (e.g. <em>)
    .replace(/\*\*([^*]+)\*\*/g, '$1') // **bold**
    .replace(/__([^_]+)__/g, '$1') // __bold__
    .replace(/\*([^*]+)\*/g, '$1') // *italic*
    .replace(/[*_`]/g, '') // any stray markers
    .replace(/[„“”"‚‘’]/g, '') // decorative German/curly quotes
    .replace(/\p{Extended_Pictographic}/gu, '') // emoji
    .replace(/[️‍⃣]/g, '') // emoji modifiers / ZWJ
    .replace(/\s+/g, ' ')
    .trim();
}

/** Join several markdown lines into one cleaned spoken paragraph. */
function speak(lines: unknown): string {
  const arr = Array.isArray(lines) ? lines : [lines];
  return cleanText(arr.map((l) => String(l ?? '')).join(' '));
}

// --- assembly ----------------------------------------------------------------

interface ChallengeData {
  order: number;
  id: string;
  lines?: unknown[];
  dial?: string;
  /** Single-digit answer the kids enter. Absent ⇒ a codeless, OK-gated scene. */
  code?: string | number;
}

/** Build the `{ C1: '3', … }` answer lookup from the parent printable's
 *  validation table — the source of truth is each `challenge.md`'s `code`; this
 *  lookup only exists to cross-check the printable against it (drift guard). */
function buildDigitLookup(files: Record<string, Record<string, unknown>>): Record<string, string> {
  const codes = pick(files, 'sections/02-codes.md');
  const validation = codes.validation as { rows?: unknown[][]; digitColumn?: number } | undefined;
  if (!validation?.rows) throw new Error('02-codes.md: missing validation.rows');
  const col = validation.digitColumn ?? 2;
  const lookup: Record<string, string> = {};
  for (const row of validation.rows) {
    const id = String(row[0]).trim();
    lookup[id] = String(row[col]).trim();
  }
  return lookup;
}

/** The one collected file whose path ends with `suffix`. */
function pick(
  files: Record<string, Record<string, unknown>>,
  suffix: string
): Record<string, unknown> {
  const key = Object.keys(files).find((p) => p.replace(/\\/g, '/').endsWith(suffix));
  if (!key) throw new Error(`content missing: ${suffix}`);
  return files[key];
}

/** The flat list of challenges (`challenges/<id>/challenge.md`), sorted by
 *  `order`. Printables in the same folders are ignored here. */
function buildChallenges(files: Record<string, Record<string, unknown>>): ChallengeData[] {
  return Object.entries(files)
    .filter(([p]) => {
      const norm = p.replace(/\\/g, '/');
      return norm.includes('/challenges/') && norm.endsWith('/challenge.md');
    })
    .map(([, data]) => data as unknown as ChallengeData)
    .sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));
}

/** Assemble the default `Script` from the markdown content directory. Each
 *  `challenge.md` becomes exactly one scene, in `order`: a `code` makes it a
 *  code gate, its absence an OK gate (the store ends the show on the last one). */
export function buildDefaultScript(): Script {
  const files = collect(CONTENT_DIR);
  const digits = buildDigitLookup(files);
  const scenes: Scene[] = [];

  for (const challenge of buildChallenges(files)) {
    // Coco speaks the lead-in only — the task itself lives on the printable, so
    // there is no `question` to append.
    const text = speak(challenge.lines);
    if (challenge.code === undefined || challenge.code === null || challenge.code === '') {
      // Codeless ⇒ an OK-gated scene (the prologue, a break) or the
      // finale. The client waits for OK, or ends the show on the last scene.
      scenes.push({ id: challenge.id, text });
      continue;
    }

    const code = String(challenge.code).trim();
    if (!/^\d$/.test(code)) throw new Error(`challenge ${challenge.id}: bad code "${code}"`);
    assertDialMatches(challenge, code);
    assertCodesTableMatches(challenge, code, digits);
    scenes.push({ id: challenge.id, text, code });
  }

  return { scenes, correctLines, wrongLines };
}

/** Guard against drift: the challenge's `dial` digit must match its `code`. */
function assertDialMatches(challenge: ChallengeData, code: string): void {
  if (!challenge.dial) return;
  const digit = challenge.dial.match(/(\d)\s*$/)?.[1];
  if (digit && digit !== code) {
    throw new Error(`challenge ${challenge.id}: dial "${challenge.dial}" disagrees with code ${code}`);
  }
}

/** Guard against drift: the parent printable's validation table must agree with
 *  the challenge's own `code` (the source of truth). */
function assertCodesTableMatches(
  challenge: ChallengeData,
  code: string,
  digits: Record<string, string>
): void {
  const listed = digits[challenge.id];
  if (listed !== undefined && listed !== code) {
    throw new Error(
      `challenge ${challenge.id}: code ${code} disagrees with 02-codes.md ("${listed}")`
    );
  }
}
