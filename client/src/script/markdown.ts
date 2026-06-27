import { marked } from 'marked';
import { parse as parseYaml } from 'yaml';

// Render synchronously; the content is trusted (it ships in the bundle) and we
// embed inline HTML (e.g. <span class="hi">) directly in the markdown sources.
marked.setOptions({ async: false, gfm: true, breaks: false });

/** A parsed markdown file: its YAML frontmatter plus the markdown body. */
export interface ParsedFile {
  /** Frontmatter as a plain object (empty when the file has none). */
  data: Record<string, unknown>;
  /** The markdown body that follows the frontmatter. */
  body: string;
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/** Split a raw `.md` file into its YAML frontmatter and markdown body. */
export function parseFile(raw: string): ParsedFile {
  const match = raw.match(FRONTMATTER);
  if (!match) return { data: {}, body: raw.trim() };
  const data = (parseYaml(match[1]) as Record<string, unknown> | null) ?? {};
  return { data, body: raw.slice(match[0].length).trim() };
}

/** Render an inline markdown string (bold/italic + embedded HTML) to HTML. */
export function inline(md: string | undefined | null): string {
  if (!md) return '';
  return marked.parseInline(md) as string;
}

/** Render a block of markdown (paragraphs, lists, …) to HTML. */
export function block(md: string | undefined | null): string {
  if (!md) return '';
  return marked.parse(md) as string;
}
