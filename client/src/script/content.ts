import { block, parseFile, type ParsedFile } from './markdown';
import type {
  CodesSection,
  FlowSection,
  Meta,
  OverviewSection,
  PrintIntro,
  Printable,
  ScriptDoc,
  Station,
  TvSection,
  Zone,
} from './types';

// Pull every markdown file in content/ into the bundle at build time. Vite
// inlines the raw text, so the guide needs no server round-trip.
const files = import.meta.glob('./content/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

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

/** All files under a directory, sorted by their numeric `order` frontmatter. */
function group(dir: string, exclude?: string): Array<ParsedFile & { path: string }> {
  return Object.entries(parsed)
    .filter(([p]) => p.includes(dir) && (!exclude || !p.endsWith(exclude)))
    .map(([path, f]) => ({ path, ...f }))
    .sort((a, b) => Number(a.data.order ?? 0) - Number(b.data.order ?? 0));
}

function buildZones(): Zone[] {
  // Each zones/<name>/ directory holds a zone.md plus its station files.
  const dirs = new Set(
    Object.keys(parsed)
      .filter((p) => p.includes('/zones/'))
      .map((p) => p.replace(/\/[^/]+$/, ''))
  );

  return [...dirs]
    .map((dir) => {
      const zone = file(`${dir.replace(/^.*\/zones\//, '/zones/')}/zone.md`).data as unknown as Zone;
      const stations = group(`${dir}/`, 'zone.md').map((f) => f.data as unknown as Station);
      return { ...zone, stations };
    })
    .sort((a, b) => a.order - b.order);
}

function buildDoc(): ScriptDoc {
  const overview = file('sections/01-overview.md');
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
    zones: buildZones(),
    printables: group('/printables/').map((f) => f.data as unknown as Printable),
  };
}

export const scriptDoc: ScriptDoc = buildDoc();
