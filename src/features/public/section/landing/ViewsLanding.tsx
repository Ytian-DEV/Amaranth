import { Link } from 'react-router-dom';
import { SectionHeader } from '@/components/story/Story';
import { articlePath, type StoryItem } from '@/components/story/types';
import { ButtonLink } from '@/components/ui/Button';
import { Img } from '@/components/ui/Img';
import { Kicker } from '@/components/ui/Tag';
import { formatReadingTime, formatShortDate, joinMeta } from '@/lib/format';
import { Band, CtaCard, Headline, LandingEmpty, MostRead, SeeAll, type LandingProps } from './blocks';
import { inCategory, picker } from './data';
import { allHref } from './links';

function OpinionRow({ story }: { story: StoryItem }) {
  return (
    <article className="group relative flex flex-col gap-2 border-b border-line py-6">
      <Kicker>{story.categoryName ?? story.label}</Kicker>
      <Headline story={story} as="h3" className="font-serif text-[22px] font-semibold leading-tight text-ink md:text-[26px]" />
      {story.excerpt && <p className="font-serif text-[16px] italic text-ink-muted md:text-[17px]">{story.excerpt}</p>}
      <p className="text-meta text-ink-muted">{joinMeta(story.byline ? `By ${story.byline}` : null, formatShortDate(story.publishedAt))}</p>
    </article>
  );
}

function Columnist({ story }: { story: StoryItem }) {
  const who = story.byline ?? 'Columnist';
  return (
    <article className="group relative flex h-full gap-4 rounded-[12px] bg-paper p-5">
      <span className="grid size-14 shrink-0 place-items-center rounded-full bg-photo font-serif text-[18px] font-semibold text-green-900" aria-hidden>
        {who.slice(0, 1).toUpperCase()}
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <Kicker>{story.categoryName}</Kicker>
        <Headline story={story} as="h3" className="font-serif text-[18px] font-semibold leading-snug text-ink" />
        <p className="text-meta text-ink-muted">by {who}</p>
      </div>
    </article>
  );
}

/** /views (Figma 36:507): editorial hero, columnists, latest opinion with most read and letters. */
export function ViewsLanding({ section, items, mostRead }: LandingProps) {
  const pick = picker(items);
  const editorial = pick.nextWhere(inCategory('editorial'), 1)[0] ?? pick.next(1)[0];
  const columns = pick.nextWhere(inCategory('column'), 3);
  const latest = pick.next(6);

  if (!editorial) {
    return (
      <>
        <header className="container-page py-12">
          <h1 className="font-serif text-[44px] font-bold text-ink md:text-[72px]">{section.name}</h1>
        </header>
        <LandingEmpty section={section} />
      </>
    );
  }

  return (
    <div>
      <header className="bg-paper">
        <div className="container-page grid items-center gap-10 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-14">
          <div className="flex flex-col gap-4">
            <p className="flex items-center gap-3 text-kicker uppercase text-green-500-text">
              <span className="h-0.5 w-6 bg-lime" aria-hidden />
              {editorial.categoryName ?? section.name}
              {editorial.category === 'editorial' && ' · The Amaranth Editorial Board'}
            </p>
            <h1 className="font-serif text-[40px] font-bold leading-[1.04] tracking-[-1px] text-ink md:text-[60px]">
              <Link to={articlePath(editorial.slug)} className="hover-lime">
                {editorial.title}
              </Link>
            </h1>
            {editorial.excerpt && <p className="max-w-[600px] font-serif text-[19px] italic leading-relaxed text-ink-muted md:text-[22px]">{editorial.excerpt}</p>}
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <ButtonLink to={articlePath(editorial.slug)}>{editorial.category === 'editorial' ? 'Read the editorial' : 'Read it'}</ButtonLink>
              <span className="text-meta text-ink-muted">{joinMeta(formatShortDate(editorial.publishedAt), formatReadingTime(editorial.readingMinutes))}</span>
            </div>
          </div>
          {editorial.image && (
            <figure className="flex flex-col gap-2">
              <Img {...editorial.image} priority sizes="(min-width: 1024px) 420px, 100vw" className="rounded-[10px] border-2 border-ink bg-surface" />
              {editorial.image.alt && <figcaption className="text-meta text-ink-muted">{editorial.image.alt}</figcaption>}
            </figure>
          )}
        </div>
      </header>

      {columns.length > 0 && (
        <Band tone="surface" label="Our columnists">
          <SectionHeader title="Our columnists" href={`/${section.slug}?category=column`} linkLabel="All columns" className="mb-6" />
          <ul className="grid gap-4 md:grid-cols-3">
            {columns.map((s) => (
              <li key={s.id}>
                <Columnist story={s} />
              </li>
            ))}
          </ul>
        </Band>
      )}

      <div className="container-page grid gap-12 py-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-14">
        <section aria-labelledby="latest-opinion">
          <SectionHeader id="latest-opinion" title="Latest opinion" href={allHref(section.slug)} linkLabel="All opinion" />
          <ul>
            {latest.map((s) => (
              <li key={s.id}>
                <OpinionRow story={s} />
              </li>
            ))}
          </ul>
        </section>
        <div className="flex flex-col gap-8">
          <MostRead items={mostRead} />
          <CtaCard title="Letters to the editor" body="Agree, disagree or want a follow-up? Write to the editorial board. Letters may be edited for length." to="/contact" label="Write a letter" />
        </div>
      </div>
      <SeeAll section={section} label="Every opinion piece" />
    </div>
  );
}
