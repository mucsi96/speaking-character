import type { CSSProperties, ElementType } from 'react';
import { block, inline } from '../markdown';

/** Render an inline-markdown string into the given tag (default <span>). */
export function Inline({
  md,
  as: Tag = 'span' as ElementType,
  className,
  style,
}: {
  md: string;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
}) {
  return <Tag className={className} style={style} dangerouslySetInnerHTML={{ __html: inline(md) }} />;
}

/** Render a block-markdown string (paragraphs, lists) into a wrapper element. */
export function Block({
  md,
  as: Tag = 'div' as ElementType,
  className,
}: {
  md: string;
  as?: ElementType;
  className?: string;
}) {
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: block(md) }} />;
}

/** Render a trusted raw-HTML string (already produced from content sources). */
export function Raw({
  html,
  as: Tag = 'div' as ElementType,
  className,
  style,
}: {
  html: string;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
}) {
  return <Tag className={className} style={style} dangerouslySetInnerHTML={{ __html: html }} />;
}
