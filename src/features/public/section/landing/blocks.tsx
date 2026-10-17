// Building blocks shared by the section landings (Figma page "Sections", 30:107).
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { SectionHeader, StoryRow } from '@/components/story/Story';
import { articlePath, storyMeta, type StoryItem } from '@/components/story/types';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Feedback';
import { Img } from '@/components/ui/Img';
import { Kicker } from '@/components/ui/Tag';
import { cn } from '@/lib/cn';
import { formatShortDate } from '@/lib/format';
import { allHref, categoryHref } from './links';

export type LandingSection = { slug: string; name: string; description: string | null; nav_placement?: string };
export type LandingProps = {
  section: LandingSection;
  categories: { slug: string; name: string }[];
  items: StoryItem[];
  mostRead: StoryItem[];
};

/** Pill links to the section's categories; the first ("All …") is the current page. */
export function CategoryChips({ section, categories, allLabel, className }: { section: LandingSection; categories: LandingProps['categories']; allLabel?: string; className?: string }) {
  if (categories.length < 2) return null;
  return (
    <nav aria-label={`${section.name} categories`} className={cn('-mx-4 md:mx-0', className)}>
      <ul data-scroll-x className="no-scrollbar flex gap-2 overflow-x-auto px-4 md:flex-wrap md:px-0">
        <li className="shrink-0">
          <span aria-current="page" className="inline-flex h-9 items-center rounded-full bg-green-900 px-3.5 text-button text-lime">
            {allLabel ?? `All ${section.name.toLowerCase()}`}
          </span>
        </li>
        {categories.map((c) => (
          <li key={c.slug} className="shrink-0">
            <Link to={categoryHref(section.slug, c.slug)} className="inline-flex h-9 items-center rounded-full border border-line bg-surface px-3.5 text-button text-ink hover:border-green-700">
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Kicker, big section name, pitch and category chips (Figma "Section Intro"). */
export function SectionIntro({ section, categories = [], allLabel, children }: { section: LandingSection; categories?: LandingProps['categories']; allLabel?: string; children?: ReactNode }) {
  return (
    <header className="border-b border-line bg-paper">
      <div className="container-page flex flex-col gap-3.5 pb-7 pt-9 md:pt-12">
        <Kicker>{section.nav_placement === 'more' ? 'More · Section' : 'Section'}</Kicker>
        <h1 className="font-serif text-[44px] font-bold leading-none tracking-[-1px] text-ink md:text-[72px] md:tracking-[-1.44px]">{section.name}</h1>
        {section.description && <p className="max-w-[720px] text-body-m text-ink-muted md:text-body-l">{section.description}</p>}
        <CategoryChips section={section} categories={categories} allLabel={allLabel} className="pt-2.5" />
        {children}
      </div>
    </header>
  );
}

/** A full-width band with the page container inside. */
export function Band({ tone = 'paper', className, children, label }: { tone?: 'paper' | 'surface' | 'dark' | 'ink' | 'lime'; className?: string; children: ReactNode; label?: string }) {
  const bg = { paper: 'bg-paper', surface: 'bg-surface', dark: 'bg-green-900 text-on-dark', ink: 'bg-ink text-on-dark', lime: 'bg-lime-soft' }[tone];
  return (
    <section aria-label={label} className={bg}>
      <div className={cn('container-page py-10 md:py-14', className)}>{children}</div>
    </section>
  );
}

export function Headline({ story, as: Heading = 'h2', className }: { story: StoryItem; as?: 'h2' | 'h3'; className?: string }) {
  return (
    <Heading className={className}>
      <Link to={articlePath(story.slug)} className="after:absolute after:inset-0 hover:text-green-700">
        {story.title}
      </Link>
    </Heading>
  );
}

/** Big lead story: photo, kicker, headline, dek and byline. */
export function LeadStory({ story, ratio = '16/9' }: { story: StoryItem; ratio?: string }) {
  return (
    <article className="group relative flex flex-col gap-3.5">
      <Img {...story.image} ratio={ratio} priority sizes="(min-width: 1024px) 770px, 100vw" className="rounded-[10px]" />
      <Kicker>{story.categoryName ?? story.label}</Kicker>
      <Headline story={story} className="font-serif text-[30px] font-bold leading-[1.08] tracking-[-0.46px] text-ink md:text-[46px]" />
      {story.excerpt && <p className="text-body-m text-ink-muted md:text-body-l">{story.excerpt}</p>}
      <p className="text-meta text-ink-muted">{storyMeta(story)}</p>
    </article>
  );
}

/** Horizontal story for long feeds: 240×150 photo, kicker, headline, dek, date. */
export function FeedStory({ story }: { story: StoryItem }) {
  return (
    <article className="group relative flex gap-4 border-b border-line py-5 md:gap-6 md:py-6">
      <Img {...story.image} ratio="240/150" sizes="(min-width: 768px) 240px, 112px" className="w-28 shrink-0 rounded-lg md:w-60" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Kicker>{story.categoryName ?? story.label}</Kicker>
        <Headline story={story} as="h3" className="font-serif text-headline-s text-ink md:text-[24px] md:font-semibold md:leading-tight" />
        {story.excerpt && <p className="line-clamp-2 hidden text-body-m text-ink-muted md:block">{story.excerpt}</p>}
        <p className="text-meta text-ink-muted">{formatShortDate(story.publishedAt)}</p>
      </div>
    </article>
  );
}

export function MostRead({ items, title = 'Most read' }: { items: StoryItem[]; title?: string }) {
  if (!items.length) return null;
  return (
    <section aria-labelledby="most-read" className="flex flex-col">
      <SectionHeader id="most-read" title={title} size="m" />
      <ol>
        {items.slice(0, 3).map((s, i) => (
          <li key={s.id}>
            <StoryRow story={s} index={i + 1} />
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Call-to-action box or band ("Got a news tip?", "Pitch a blog"). */
export function CtaCard({ eyebrow, title, body, to, label, tone = 'lime', className }: { eyebrow?: string; title: string; body: string; to: string; label: string; tone?: 'lime' | 'dark'; className?: string }) {
  const dark = tone === 'dark';
  return (
    <aside className={cn('flex flex-col gap-3 rounded-[14px] p-6', dark ? 'bg-green-900 text-on-dark' : 'bg-lime-soft', className)}>
      {eyebrow && <p className={cn('text-kicker uppercase', dark ? 'text-lime' : 'text-green-700')}>{eyebrow}</p>}
      <h2 className={cn('font-serif text-[24px] font-semibold leading-tight', dark ? 'text-on-dark' : 'text-green-900')}>{title}</h2>
      <p className={cn('text-body-m', dark ? 'text-on-dark-muted' : 'text-ink-muted')}>{body}</p>
      <ButtonLink to={to} variant={dark ? 'accent' : 'primary'} className="self-start">
        {label}
      </ButtonLink>
    </aside>
  );
}

export function CtaBand({ eyebrow, title, body, to, label, tone = 'lime', serifItalic }: { eyebrow: string; title: string; body?: string; to: string; label: string; tone?: 'lime' | 'dark' | 'ink'; serifItalic?: boolean }) {
  const dark = tone !== 'lime';
  return (
    <Band tone={tone === 'lime' ? 'lime' : tone} label={eyebrow}>
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-10">
        <div className="flex max-w-[760px] flex-col gap-2.5">
          <p className={cn('text-kicker uppercase', dark ? 'text-lime' : 'text-green-700')}>{eyebrow}</p>
          <h2 className={cn('font-serif text-[28px] leading-[1.15] md:text-[34px]', serifItalic ? 'italic' : 'font-semibold', dark ? 'text-on-dark' : 'text-green-900')}>{title}</h2>
          {body && <p className={cn('text-body-m', dark ? 'text-on-dark-muted' : 'text-ink-muted')}>{body}</p>}
        </div>
        <ButtonLink to={to} variant={dark ? 'accent' : 'primary'} className="self-start md:self-auto">
          {label}
        </ButtonLink>
      </div>
    </Band>
  );
}

/** "2025  Graduation Issue …  Read →" rows. */
export function YearList({ items, aside }: { items: StoryItem[]; aside?: (s: StoryItem) => ReactNode }) {
  return (
    <ul>
      {items.map((s) => (
        <li key={s.id} className="group relative flex items-baseline gap-4 border-b border-line py-4 md:gap-8">
          <span className="w-14 shrink-0 font-serif text-[22px] italic text-lime-dark md:w-16 md:text-numeral" aria-hidden>
            {s.publishedAt?.slice(0, 4)}
          </span>
          <Headline story={s} as="h3" className="min-w-0 flex-1 font-serif text-headline-s text-ink md:text-[20px]" />
          {aside?.(s) ?? (
            <span className="hidden shrink-0 text-button text-green-700 md:inline" aria-hidden>
              Read →
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

export function LandingEmpty({ section }: { section: LandingSection }) {
  return (
    <div className="container-page py-12">
      <EmptyState title="No stories here yet">New {section.name} stories will show up here.</EmptyState>
    </div>
  );
}

export function SeeAll({ section, label }: { section: LandingSection; label?: string }) {
  return (
    <div className="container-page pb-14 pt-2">
      <Link to={allHref(section.slug)} className="inline-flex items-center gap-1 text-button text-green-700 hover:underline">
        {label ?? `Every ${section.name} story`} <span aria-hidden>→</span>
      </Link>
    </div>
  );
}
