import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { formatDate, joinMeta } from '@/lib/format';
import { Img } from '@/components/ui/Img';
import { Kicker } from '@/components/ui/Tag';
import { articlePath, storyMeta, type StoryItem } from './types';

type HeadingLevel = 'h2' | 'h3' | 'h4';

/** Section title with lime accent bar, rule and optional "See all →" link (Figma "Section Header"). */
export function SectionHeader({
  title,
  href,
  linkLabel = 'See all',
  as: Heading = 'h2',
  size = 'l',
  id,
  rule = true,
  className,
}: {
  title: string;
  id?: string;
  rule?: boolean;
  href?: string;
  linkLabel?: string;
  as?: 'h1' | 'h2' | 'h3';
  size?: 'l' | 'm';
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <span className={cn('w-1.5 shrink-0 rounded-[2px] bg-lime', size === 'l' ? 'h-7' : 'h-6')} aria-hidden />
      <Heading id={id} className={cn('min-w-0 font-serif uppercase text-ink', size === 'l' ? 'text-[22px] font-extrabold leading-tight tracking-[0.01em] md:text-[28px]' : 'text-headline-m tracking-[0.01em]')}>
        {title}
      </Heading>
      {rule && <span className="h-px min-w-0 flex-1 bg-line" aria-hidden />}
      {href && (
        <Link to={href} className="shrink-0 text-button text-green-700 hover:text-green-900 hover:underline">
          {linkLabel} <span aria-hidden>→</span>
          <span className="sr-only"> {title}</span>
        </Link>
      )}
    </div>
  );
}

/** Standard article card (Figma "Story Card"). */
export function StoryCard({
  story,
  as: Heading = 'h3',
  showExcerpt = true,
  size = 'm',
  sizes = '(min-width: 1024px) 368px, (min-width: 768px) 50vw, 100vw',
  priority,
  className,
}: {
  story: StoryItem;
  as?: HeadingLevel;
  showExcerpt?: boolean;
  size?: 'm' | 'l';
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <article className={cn('group relative flex flex-col gap-2.5', className)}>
      <Img {...story.image} ratio="360/220" sizes={sizes} priority={priority} />
      <Kicker className="mt-1">{story.label}</Kicker>
      <Heading className={cn('font-serif text-ink group-hover:text-green-700', size === 'l' ? 'text-headline-l' : 'text-headline-m')}>
        <Link to={articlePath(story.slug)} className="after:absolute after:inset-0">
          {story.title}
        </Link>
      </Heading>
      {showExcerpt && story.excerpt && <p className="line-clamp-3 text-body-m text-ink-muted">{story.excerpt}</p>}
      <p className="text-meta text-ink-muted">{storyMeta(story)}</p>
    </article>
  );
}

/** Horizontal story with thumbnail (Figma "Story Compact"). */
export function StoryCompact({ story, as: Heading = 'h3', className }: { story: StoryItem; as?: HeadingLevel; className?: string }) {
  return (
    <article className={cn('group relative flex items-start gap-3.5', className)}>
      <Img {...story.image} ratio="104/76" sizes="104px" className="w-[104px] shrink-0 rounded-sm" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Kicker>{story.label}</Kicker>
        <Heading className="font-serif text-headline-s text-ink group-hover:text-green-700">
          <Link to={articlePath(story.slug)} className="after:absolute after:inset-0">
            {story.title}
          </Link>
        </Heading>
        <p className="text-meta text-ink-muted">{formatDate(story.publishedAt)}</p>
      </div>
    </article>
  );
}

/** Numbered list item for Most Read / Trending (Figma "Story Row"). */
export function StoryRow({
  story,
  index,
  meta,
  as: Heading = 'h3',
  className,
}: {
  story: StoryItem;
  index: number;
  meta?: ReactNode;
  as?: HeadingLevel;
  className?: string;
}) {
  return (
    <article className={cn('group relative flex items-start gap-4 border-b border-line py-4', className)}>
      <span className="w-9 shrink-0 font-serif text-numeral font-black italic text-lime-dark" aria-hidden>
        {String(index).padStart(2, '0')}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Heading className="font-serif text-headline-s text-ink group-hover:text-green-700">
          <Link to={articlePath(story.slug)} className="after:absolute after:inset-0">
            {story.title}
          </Link>
        </Heading>
        <p className="text-meta text-ink-muted">{meta ?? joinMeta(story.label, formatDate(story.publishedAt))}</p>
      </div>
    </article>
  );
}
