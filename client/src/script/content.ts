import { block, parseFile, type ParsedFile } from './markdown';
import type {
  Challenge,
  CodesSection,
  FlowSection,
  Meta,
  OverviewSection,
  PrintGroup,
  PrintIntro,
  Printable,
  ScriptDoc,
  TvSection,
} from './types';

// Pull every markdown file in content/ into the bundle at build time. Vite
// inlines the raw text, so the guide needs no server round-trip.
const files = import.meta.glob('./content/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

// Print-ready SVG cards live beside their challenge (challenges/<id>/print/*.svg)
// and are the single source of truth for both the on-screen sheet and the A4
// printout. Vite inlines the raw markup so we can render it inline.
const svgFiles = import.meta.glob('./content/**/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/** The `cN` folder a content path belongs to (challenges/<id>/...). */
function challengeIdOf(path: string): string {
  return path.match(/\/challenges\/([^/]+)\//)?.[1] ?? '';
}

const parsed: Record<string, ParsedFile> = {};
for (const [path, raw] of Object.entries(files)) {
  parsed[path] = parseFile(raw);
}

/** The one file whose path ends with `suffix`. */
function file(suffix: string): ParsedFile {
  const key = Object.keys(parsed).find((p) => p.endsWith(suffix));
  if (!key) throw new Error(`Script content missing: ${suffix}`);
  return parsed[key];
}

function buildChallenges(): Challenge[] {
  // Each challenges/<id>/ directory holds one challenge.md (the task narration)
  // plus its printable sheet(s). The challenges form a flat list — the four
  // locks ride along as metadata on the challenge that opens / closes each.
  return Object.entries(parsed)
    .filter(([p]) => p.includes('/challenges/') && p.endsWith('/challenge.md'))
    .map(([, f]) => f.data as unknown as Challenge)
    .sort((a, b) => a.order - b.order);
}

/** Group every challenge's printables so each prints onto one A4 page. A
 *  challenge's sheets are either SVG cards (challenges/<id>/print/*.svg, tiled
 *  into a grid) or a classic HTML sheet (challenges/<id>/*.md). Groups follow
 *  challenge order; cards sort by filename. */
function buildPrintGroups(challenges: Challenge[]): PrintGroup[] {
  const order = new Map(challenges.map((c) => [c.id.toLowerCase(), c.order]));
  const groups = new Map<string, PrintGroup>();
  const groupFor = (id: string): PrintGroup => {
    let g = groups.get(id);
    if (!g) {
      g = { challengeId: id, svg: false, sheets: [] };
      groups.set(id, g);
    }
    return g;
  };

  // Markdown printable sheets — every challenge file except challenge.md.
  for (const { path, sheet } of Object.entries(parsed)
    .filter(([p]) => p.includes('/challenges/') && p.endsWith('.md') && !p.endsWith('/challenge.md'))
    .map(([path, f]) => ({ path, sheet: f.data as unknown as Printable })))
    groupFor(challengeIdOf(path)).sheets.push(sheet);

  // SVG cards — the raw markup rides along on the visual so Visual can inline it.
  for (const [path, svg] of Object.entries(svgFiles).sort(([a], [b]) => a.localeCompare(b))) {
    const g = groupFor(challengeIdOf(path));
    g.svg = true;
    g.sheets.push({ order: 0, title: '', visual: { type: 'svg', svg } });
  }

  return [...groups.values()].sort(
    (a, b) => (order.get(a.challengeId) ?? 0) - (order.get(b.challengeId) ?? 0)
  );
}

function buildDoc(): ScriptDoc {
  const overview = file('sections/01-overview.md');
  const challenges = buildChallenges();
  return {
    meta: file('content/index.md').data as unknown as Meta,
    overview: {
      ...(overview.data as unknown as Omit<OverviewSection, 'introHtml'>),
      introHtml: block(overview.body),
    },
    codes: file('sections/02-codes.md').data as unknown as CodesSection,
    flow: file('sections/03-flow.md').data as unknown as FlowSection,
    tv: file('sections/04-tv-script.md').data as unknown as TvSection,
    printIntro: file('sections/05-printables.md').data as unknown as PrintIntro,
    challenges,
    printGroups: buildPrintGroups(challenges),
  };
}

export const scriptDoc: ScriptDoc = buildDoc();
