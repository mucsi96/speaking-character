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

/** Coco's spoken lead-in for a lock — the narration before its first
 *  challenge (the red lock's intro doubles as the prologue). */
export interface LockIntro {
  who: string;
  lines: string[];
  hint?: string;
}

/** Lock header carried by the *first* challenge of each lock. The hunt's four
 *  colored locks are no longer their own directory; their styling, code and
 *  intro narration ride along with the challenge that opens them. */
export interface ChallengeLock {
  anchor: string;
  emoji: string;
  color: string;
  headGradient: string;
  unlockGradient?: string;
  title: string;
  subtitle: string;
  code: string;
  intro: LockIntro;
}

/** One task in the flat challenge list (C1–C12, plus the gold finale). Coco
 *  speaks the `lines` *before* the challenge to set the scene and never
 *  explains the task itself — the puzzle lives on the printable in the same
 *  challenge folder. `lock` opens a new lock; `unlock`/`break` close one. */
export interface Challenge {
  order: number;
  id: string;
  title: string;
  room: string;
  tags?: string[];
  dial?: string;
  /** Accent color for the challenge card's left border (its lock's color). */
  lockColor?: string;
  who: string;
  lines: string[];
  parent: { ph: string; entries: ParentEntry[] };
  /** "finale" renders the climax card; "intro" renders the codeless C0
   *  prologue (greeting + remote + chest reveal, no lock, no answer). */
  variant?: 'finale' | 'intro';
  /** Present on the C0 prologue: the greeting/remote lines spoken *before* the
   *  OK-gated pause. `lines` then carry the post-OK chest reveal. */
  intro?: LockIntro;
  icon?: string;
  headGradient?: string;
  /** Present on the first challenge of a lock: its header + intro narration. */
  lock?: ChallengeLock;
  /** Present on the last challenge of a lock: the unlock celebration. */
  unlock?: { title: string; text: string; gradient?: string };
  /** Present where a break follows a completed lock. */
  break?: { emoji: string; title: string; text: string };
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
