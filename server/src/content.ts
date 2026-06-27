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
 *  The content is a *flat* list of challenges (`challenges/c1 … c13/`); the four
 *  locks ride along as metadata on the challenge that opens / closes each. Coco
 *  speaks before every challenge and never explains the task — the puzzle lives
 *  on the printable in the challenge's folder — so the challenge scene is the
 *  lead-in only, with no question appended.
 *
 *  Mapping (linear `Scene[]`), walking the challenges in `order`:
 *       `<anchor>-intro`   : a lock opener's intro lines (codeless). The red
 *                            lock's intro (`z1-intro`) is the prologue that opens
 *                            the whole hunt — greeting, birthday and the first
 *                            "find the chest" clue,
 *       `C1`..`C12`        : each challenge's spoken lead-in (no task), with the
 *                            single-digit answer from the codes table,
 *       `<id>-unlock`      : a lock closer's unlock narration (codeless),
 *       `<id>-break`       : the break narration (codeless, when present),
 *       `finale`           : the gold finale lines (codeless climax).
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
  variant?: string;
  /** Carried by the C0 prologue (`variant: intro`): the greeting/remote lines
   *  spoken before the OK-gated pause; `lines` carry the post-OK chest reveal. */
  intro?: { lines?: unknown[] };
  /** Carried by a lock's first challenge: its anchor + intro narration. */
  lock?: { anchor?: string; intro?: { lines?: unknown[] } };
  /** Carried by a lock's last challenge: the unlock / break narration. */
  unlock?: { text?: string };
  break?: { text?: string };
}

/** Build the `{ C1: '3', … }` answer lookup from `sections/02-codes.md`. */
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

/** Assemble the default `Script` from the markdown content directory. */
export function buildDefaultScript(): Script {
  const files = collect(CONTENT_DIR);
  const digits = buildDigitLookup(files);
  const scenes: Scene[] = [];

  // The hunt opens with the codeless C0 prologue (`variant: intro`): Coco's
  // greeting + the remote explanation, an OK-gated pause while the kids fetch
  // the chest and carry it to the living room, then the chest reveal. After
  // that each lock opens with its own intro, then its challenges; the unlock /
  // break narration closes each lock.
  let finale: Scene | null = null;

  for (const challenge of buildChallenges(files)) {
    // C0 — the codeless prologue. Two scenes: the greeting/remote lines, gated
    // with `pause` so the show waits for OK while the chest is fetched, then the
    // post-OK chest reveal. No code, no lock processing.
    if (challenge.variant === 'intro') {
      if (challenge.intro?.lines) {
        scenes.push({
          id: `${challenge.id}-intro`,
          text: speak(challenge.intro.lines),
          pause: true,
        });
      }
      scenes.push({ id: challenge.id, text: speak(challenge.lines) });
      continue;
    }

    // A lock opener carries the lock's intro — spoken before its challenge.
    if (challenge.lock?.intro?.lines) {
      const anchor = challenge.lock.anchor ?? challenge.id;
      scenes.push({ id: `${anchor}-intro`, text: speak(challenge.lock.intro.lines) });
    }

    if (challenge.variant === 'finale') {
      // The climax has no answer; emit it once at the very end.
      finale = { id: 'finale', text: speak(challenge.lines) };
      continue;
    }

    // Coco speaks the lead-in only — the task itself lives on the printable, so
    // there is no `question` to append.
    const code = digits[challenge.id];
    if (!code) throw new Error(`challenge ${challenge.id}: no answer in 02-codes.md`);
    if (!/^\d$/.test(code)) throw new Error(`challenge ${challenge.id}: bad answer "${code}"`);
    assertDialMatches(challenge, code);
    scenes.push({ id: challenge.id, text: speak(challenge.lines), code });

    // A lock closer celebrates the unlock and (sometimes) sends them to a break.
    if (challenge.unlock?.text) {
      scenes.push({ id: `${challenge.id}-unlock`, text: speak(challenge.unlock.text) });
    }
    if (challenge.break?.text) {
      scenes.push({ id: `${challenge.id}-break`, text: speak(challenge.break.text) });
    }
  }

  if (finale) scenes.push(finale);

  return { scenes, correctLines, wrongLines };
}

/** Guard against drift: the challenge's `dial` digit must match the codes table. */
function assertDialMatches(challenge: ChallengeData, code: string): void {
  if (!challenge.dial) return;
  const digit = challenge.dial.match(/(\d)\s*$/)?.[1];
  if (digit && digit !== code) {
    throw new Error(`challenge ${challenge.id}: dial "${challenge.dial}" disagrees with code ${code}`);
  }
}
