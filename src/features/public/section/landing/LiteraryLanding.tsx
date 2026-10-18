import { Link } from 'react-router-dom';
import { SectionHeader } from '@/components/story/Story';
import { articlePath, type StoryItem } from '@/components/story/types';
import { ButtonLink } from '@/components/ui/Button';
import { Img } from '@/components/ui/Img';
import { Kicker } from '@/components/ui/Tag';
import { cn } from '@/lib/cn';
import { formatReadingTime } from '@/lib/format';
import type { ImageSource } from '@/lib/media';
import { CtaBand, LandingEmpty, SeeAll, type LandingProps } from './blocks';
import { inCategory, picker } from './data';
import { allHref, categoryHref } from './links';

/** The Folio cover: the featured work's photo in the green cover (lime sun over green waves when it has none). */
function FolioCover({ title, image }: { title: string; image?: ImageSource | null }) {
  return (
    <div className="flex aspect-[3/4] w-full max-w-[320px] flex-col justify-between gap-5 rounded-[6px] bg-green-900 p-6 text-on-dark shadow-[0_24px_48px_rgb(10_46_31/0.28)]" aria-hidden>
      <p className="text-kicker uppercase text-lime">Amaranth Literary Folio</p>
      {image?.path ? (
        <Img {...image} ratio="1/1" sizes="272px" className="w-full rounded-[4px] bg-green-800" />
      ) : (
      <svg viewBox="0 0 240 150" className="w-full">
        <circle cx="150" cy="50" r="42" fill="var(--color-lime)" />
        <path d="M0 80 Q60 55 120 80 T240 78 V150 H0Z" fill="var(--color-green-500)" />
        <path d="M0 100 Q60 80 120 102 T240 98 V150 H0Z" fill="var(--color-green-700)" />
        <path d="M0 120 Q60 104 120 122 T240 118 V150 H0Z" fill="var(--color-green-500)" opacity="0.6" />
      </svg>
      )}
      <p className="line-clamp-3 font-serif text-[28px] italic leading-tight">{title}</p>
    </div>
  );
}

const tileTone = ['bg-surface border border-line', 'bg-green-900 text-on-dark', 'bg-lime-soft'];

function FolioTile({ story, tone }: { story: StoryItem; tone: number }) {
  const dark = tone === 1;
  return (
    <article className={cn('group relative flex min-h-[220px] flex-col gap-3 rounded-[12px] p-6', tileTone[tone])}>
      <Kicker className={dark ? 'text-lime' : undefined}>{story.categoryName}</Kicker>
      <h3 className={cn('font-serif text-[22px] font-semibold leading-tight', dark ? 'text-on-dark' : 'text-ink')}>
        <Link to={articlePath(story.slug)} className="after:absolute after:inset-0 hover:underline">
          {story.title}
        </Link>
      </h3>
      {story.excerpt && <p className={cn('line-clamp-3 font-serif text-[15px] italic', dark ? 'text-on-dark-muted' : 'text-ink-muted')}>“{story.excerpt}”</p>}
      <p className={cn('mt-auto text-meta', dark ? 'text-on-dark-muted' : 'text-ink-muted')}>{formatReadingTime(story.readingMinutes)}</p>
    </article>
  );
}

/** /literary (Figma 33:366): folio hero, genre tabs, poem of the week, folio tiles, call for submissions. */
export function LiteraryLanding({ section, categories, items }: LandingProps) {
  const pick = picker(items);
  const lead = pick.next(1)[0];
  const poem = pick.nextWhere(inCategory('poetry'), 1)[0];
  const works = pick.next(6);

  return (
    <div>
      <header className="bg-paper">
        <div className="container-page grid items-center gap-10 py-12 md:grid-cols-[minmax(0,1fr)_auto] md:py-16 lg:gap-20">
          <div className="flex flex-col gap-4">
            <Kicker>The Literary Folio · {section.name}</Kicker>
            <h1 className="font-serif text-[44px] italic leading-[1.02] tracking-[-1px] text-green-900 md:text-[68px]">
              {lead ? (
                <Link to={articlePath(lead.slug)} className="hover:underline">
                  {lead.title}
                </Link>
              ) : (
                section.name
              )}
            </h1>
            <p className="max-w-[560px] text-body-m text-ink-muted md:text-body-l">{lead?.excerpt ?? section.description}</p>
            <div className="flex flex-wrap gap-3 pt-1">
              {lead && <ButtonLink to={articlePath(lead.slug)}>Read it</ButtonLink>}
              <ButtonLink to="/submit" variant="outline">
                Submit your work
              </ButtonLink>
            </div>
          </div>
          <div className="hidden md:flex md:justify-end">
            <FolioCover title={lead?.title ?? 'The Literary Folio'} image={lead?.image} />
          </div>
        </div>
      </header>

      {categories.length > 1 && (
        <nav aria-label={`${section.name} genres`} className="border-y border-line bg-surface">
          <ul data-scroll-x className="no-scrollbar container-page flex gap-7 overflow-x-auto">
            <li className="shrink-0">
              <span aria-current="page" className="inline-flex h-12 items-center border-b-[3px] border-green-700 text-nav uppercase text-ink">
                All works
              </span>
            </li>
            {categories.map((c) => (
              <li key={c.slug} className="shrink-0">
                <Link to={categoryHref(section.slug, c.slug)} className="inline-flex h-12 items-center border-b-[3px] border-transparent text-nav uppercase text-ink-muted hover:text-ink">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {!lead ? (
        <LandingEmpty section={section} />
      ) : (
        <>
          {poem && (
            <section aria-labelledby="poem-of-the-week" className="container-page flex flex-col items-center gap-3 py-14 text-center md:py-16">
              <Kicker>Poem of the week</Kicker>
              <h2 id="poem-of-the-week" className="font-serif text-[30px] font-semibold text-ink md:text-[38px]">
                {poem.title}
              </h2>
              {poem.byline && <p className="text-meta text-ink-muted">by {poem.byline}</p>}
              <span className="my-2 h-[3px] w-12 rounded bg-lime" aria-hidden />
              {poem.excerpt && <p className="max-w-[560px] whitespace-pre-line font-serif text-[20px] italic leading-[1.6] text-green-900 md:text-[22px]">{poem.excerpt}</p>}
              <Link to={articlePath(poem.slug)} className="mt-2 text-button text-green-700 hover:underline">
                Read the full poem <span aria-hidden>→</span>
              </Link>
            </section>
          )}

          {works.length > 0 && (
            <section aria-labelledby="from-the-folio" className={cn('container-page flex flex-col gap-6 pb-6', !poem && 'pt-12')}>
              <SectionHeader id="from-the-folio" title="From the Folio" href={allHref(section.slug)} linkLabel="All works" />
              <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
                {works.map((s, i) => (
                  <li key={s.id} className="flex">
                    <FolioTile story={s} tone={(i + Math.floor(i / 3)) % 3} />
                  </li>
                ))}
              </ul>
            </section>
          )}
          <SeeAll section={section} label="Every literary work" />
        </>
      )}

      <CtaBand
        tone="ink"
        serifItalic
        eyebrow="Call for submissions"
        title="The Folio is open. Send us what you’ve been writing."
        body="Poetry, fiction, essays, visual art and spoken word."
        to="/submit"
        label="Submit your work"
      />
    </div>
  );
}
