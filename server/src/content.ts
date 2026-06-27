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
 *  Delete `data/state.json` to regenerate the default from the markdown.
 *
 *  Mapping (linear `Scene[]`):
 *   - `intro`          : TV-script Begrüßung + "Truhe gefunden".
 *   - per zone (red→blue→green→gold):
 *       `<anchor>-intro`  : the zone's intro lines (codeless),
 *       `C1`..`C12`       : each station's spoken lines + question, with the
 *                            single-digit answer from the codes table,
 *       `<anchor>-unlock` : the unlock narration (codeless, when present),
 *       `<anchor>-break`  : the break narration (codeless, when present).
 *   - `finale`         : the gold finale lines (codeless climax).
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

interface ZoneData {
  order: number;
  anchor: string;
  intro?: { lines?: unknown[] };
  unlock?: { text?: string };
  break?: { text?: string };
}

interface StationData {
  order: number;
  id: string;
  lines?: unknown[];
  question?: string;
  dial?: string;
  variant?: string;
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

/** Group zones with their stations, sorted by `order`. */
function buildZones(files: Record<string, Record<string, unknown>>): Array<{
  zone: ZoneData;
  stations: StationData[];
}> {
  const zoneDirs = new Set(
    Object.keys(files)
      .filter((p) => p.replace(/\\/g, '/').includes('/zones/') && p.endsWith('zone.md'))
      .map((p) => p.replace(/[/\\]zone\.md$/, ''))
  );

  return [...zoneDirs]
    .map((dir) => {
      const zone = files[join(dir, 'zone.md')] as unknown as ZoneData;
      const stations = Object.entries(files)
        .filter(([p]) => p.startsWith(dir + '/') || p.startsWith(dir + '\\'))
        .filter(([p]) => !p.endsWith('zone.md'))
        .map(([, data]) => data as unknown as StationData)
        .sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));
      return { zone, stations };
    })
    .sort((a, b) => Number(a.zone.order ?? 0) - Number(b.zone.order ?? 0));
}

/** Assemble the default `Script` from the markdown content directory. */
export function buildDefaultScript(): Script {
  const files = collect(CONTENT_DIR);
  const digits = buildDigitLookup(files);
  const scenes: Scene[] = [];

  // Intro: the TV-script connecting narration that opens the hunt.
  const tv = pick(files, 'sections/04-tv-script.md');
  const tvLines = (tv.lines as Array<{ label?: string; text?: string }>) ?? [];
  const byLabel = (label: string) => tvLines.find((l) => l.label === label)?.text ?? '';
  scenes.push({
    id: 'intro',
    text: speak([byLabel('Begrüßung'), byLabel('Truhe gefunden')]),
  });

  let finale: Scene | null = null;

  for (const { zone, stations } of buildZones(files)) {
    if (zone.intro?.lines) {
      scenes.push({ id: `${zone.anchor}-intro`, text: speak(zone.intro.lines) });
    }

    for (const station of stations) {
      if (station.variant === 'finale') {
        // The climax has no answer; emit it once at the very end.
        finale = { id: 'finale', text: speak(station.lines) };
        continue;
      }
      const code = digits[station.id];
      if (!code) throw new Error(`station ${station.id}: no answer in 02-codes.md`);
      if (!/^\d$/.test(code)) throw new Error(`station ${station.id}: bad answer "${code}"`);
      assertDialMatches(station, code);
      const parts = [...((station.lines as unknown[]) ?? [])];
      if (station.question) parts.push(station.question);
      scenes.push({ id: station.id, text: speak(parts), code });
    }

    if (zone.unlock?.text) {
      scenes.push({ id: `${zone.anchor}-unlock`, text: speak(zone.unlock.text) });
    }
    if (zone.break?.text) {
      scenes.push({ id: `${zone.anchor}-break`, text: speak(zone.break.text) });
    }
  }

  if (finale) scenes.push(finale);

  return { scenes, correctLines, wrongLines };
}

/** Guard against drift: the station's `dial` digit must match the codes table. */
function assertDialMatches(station: StationData, code: string): void {
  if (!station.dial) return;
  const digit = station.dial.match(/(\d)\s*$/)?.[1];
  if (digit && digit !== code) {
    throw new Error(`station ${station.id}: dial "${station.dial}" disagrees with code ${code}`);
  }
}
