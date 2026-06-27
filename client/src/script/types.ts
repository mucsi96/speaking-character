// Typed shape of the parsed `content/` markdown directory. The frontmatter in
// each file maps onto these interfaces; see content.ts for the assembly.

export interface NavLink {
  href: string;
  label: string;
}

export interface Lock {
  color: string;
  label: string;
}

export interface Meta {
  title: string;
  eyebrow: string;
  subtitle: string;
  brand: string;
  nav: NavLink[];
  locks: Lock[];
  footer: string[];
}

export interface OverviewColumn {
  title: string;
  /** Markdown (may contain inline HTML), rendered as a block. */
  body: string;
}

export interface OverviewSection {
  id?: string;
  num: string;
  title: string;
  note?: string;
  /** Lead paragraph(s) from the markdown body, pre-rendered to HTML. */
  introHtml: string;
  columns: OverviewColumn[];
}

export interface CodeTable {
  heading: string;
  columns: string[];
  rows: string[][];
  /** Index of the column rendered as a code badge / single digit. */
  codeColumn?: number;
  digitColumn?: number;
  note?: string;
}

export interface CodesSection {
  id?: string;
  num: string;
  title: string;
  note?: string;
  secret: CodeTable;
  validation: CodeTable;
}

export interface FlowSession {
  when: string;
  title: string;
  lead: string;
  items: string[];
  foot?: string;
}

export interface FlowSection {
  num: string;
  title: string;
  note?: string;
  sessions: FlowSession[];
  footnote?: string;
}

/** §iv — the parent setup / preparation checklist. (Coco's connecting
 *  narration is no longer duplicated here; the zones, the gold finale and the
 *  server's reaction lines are the single source for what Coco speaks.) */
export interface TvSection {
  id?: string;
  num: string;
  title: string;
  note?: string;
  noteLang?: 'de' | 'hu';
  setup: { heading: string; ph: string; items: string[] };
}

export interface PrintIntro {
  id: string;
  heading: string;
  lead: string;
}

/** One `[term, description, "sol"?]` row of a station's parent note list. */
export type ParentEntry = [string, string] | [string, string, string];

export interface Station {
  order: number;
  id: string;
  title: string;
  room: string;
  tags?: string[];
  dial?: string;
  who: string;
  lines: string[];
  question?: string;
  parent: { ph: string; entries: ParentEntry[] };
  print?: string;
  /** "finale" renders the special climax card at the end of the gold zone. */
  variant?: 'finale';
  icon?: string;
  headGradient?: string;
}

export interface ZoneIntro {
  who: string;
  lines: string[];
  hint?: string;
}

export interface Zone {
  order: number;
  anchor: string;
  emoji: string;
  color: string;
  headGradient: string;
  unlockGradient?: string;
  title: string;
  subtitle: string;
  code: string;
  intro: ZoneIntro;
  unlock?: { title: string; text: string };
  break?: { emoji: string; title: string; text: string };
  stations: Station[];
}

export interface Printable {
  order: number;
  title: string;
  note?: string;
  pageBreak?: boolean;
  /** Discriminated by `visual.type`; rendered by the Visual dispatcher. */
  visual: Record<string, unknown> & { type: string };
}

export interface ScriptDoc {
  meta: Meta;
  overview: OverviewSection;
  codes: CodesSection;
  flow: FlowSection;
  zones: Zone[];
  tv: TvSection;
  printIntro: PrintIntro;
  printables: Printable[];
}
