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
 *  narration is no longer duplicated here; the challenges, the gold finale and
 *  the server's reaction lines are the single source for what Coco speaks.) */
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

/** One `[term, description, "sol"?]` row of a challenge's parent note list. */
export type ParentEntry = [string, string] | [string, string, string];

/** Lock header carried by the *first* challenge of each lock. The hunt's four
 *  colored locks are no longer their own directory; their styling and code ride
 *  along with the challenge that opens them. The lock's lead-in narration is
 *  part of that challenge's own `lines`. */
export interface ChallengeLock {
  anchor: string;
  emoji: string;
  color: string;
  headGradient: string;
  title: string;
  subtitle: string;
  code: string;
}

/** One task in the flat challenge list (C0–C12, plus the gold finale). Coco
 *  speaks the single `lines` block *before* the challenge to set the scene
 *  (and, where it opens a lock, to reveal that lock) and never explains the
 *  task itself — the puzzle lives on the printable in the same challenge
 *  folder. `lock` opens a new lock; a `break` scene sits between locks. */
export interface Challenge {
  order: number;
  id: string;
  title: string;
  room?: string;
  tags?: string[];
  dial?: string;
  /** Single-digit answer the kids enter on the remote. Absent ⇒ an OK-gated
   *  scene (the C0 prologue, a break, the finale). */
  code?: string;
  /** Accent color for the challenge card's left border (its lock's color). */
  lockColor?: string;
  who?: string;
  lines: string[];
  /** Optional Hungarian hint for the parent, shown under Coco's bubble. */
  hint?: string;
  parent?: { ph: string; entries: ParentEntry[] };
  /** Picks the printable card style. Absent ⇒ a normal task card.
   *  "intro" also renders as a task card; "break" renders the colored break
   *  bar; "finale" renders the gold climax card. */
  variant?: 'intro' | 'break' | 'finale';
  icon?: string;
  headGradient?: string;
  /** Present on the first challenge of a lock: its header (printable only). */
  lock?: ChallengeLock;
  /** "break" bar fields: a heading and an emoji. A break bar shows the
   *  parent-only `note` (its `lines` are Coco's spoken break cue). */
  emoji?: string;
  note?: string;
}

/** All print-ready cards of one challenge, grouped so each challenge prints
 *  onto a single A4 page. Each card is the raw markup of a self-contained,
 *  A4-composable SVG (challenges/<id>/print/*.svg) — every card carries its own
 *  frame, header and styling, so the guide only has to inline it. */
export interface PrintGroup {
  challengeId: string;
  cards: string[];
}

export interface ScriptDoc {
  meta: Meta;
  overview: OverviewSection;
  codes: CodesSection;
  flow: FlowSection;
  challenges: Challenge[];
  tv: TvSection;
  printIntro: PrintIntro;
  printGroups: PrintGroup[];
}
