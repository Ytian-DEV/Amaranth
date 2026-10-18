import { Link } from 'react-router-dom';
import { SectionHeader } from '@/components/story/Story';
import { articlePath, type StoryItem } from '@/components/story/types';
import { Img } from '@/components/ui/Img';
import { cn } from '@/lib/cn';
import { publicUrl, srcSet } from '@/lib/media';
import { Band, LandingEmpty, SeeAll, type LandingProps } from './blocks';
import { inCategory, picker } from './data';
import { allHref, categoryHref } from './links';

// tile colours when a story has no photo (from the design's sample tiles)
const tileBg = ['bg-green-700', 'bg-lime-dark', 'bg-green-900', 'bg-green-500', 'bg-green-800'];

function StoryTile({ story, i }: { story: StoryItem; i: number }) {
  const src = story.image ? publicUrl(story.image.bucket, story.image.path) : null;
  return (
    <article className={cn('group relative isolate flex aspect-[9/16] w-[160px] shrink-0 flex-col justify-end overflow-hidden rounded-[12px] p-3.5 text-on-dark md:w-[184px]', tileBg[i % tileBg.length])}>
      {src && <img src={src} srcSet={story.image ? srcSet(story.image) : undefined} sizes="184px" alt="" loading="lazy" className="absolute inset-0 -z-10 size-full object-cover" />}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-ink/85" aria-hidden />
      <div className="absolute inset-x-3 top-3 flex gap-1" aria-hidden>
        {Array.from({ length: 6 }, (_, k) => (
          <span key={k} className={cn('h-[3px] flex-1 rounded-full', k === 0 ? 'bg-on-dark' : 'bg-on-dark/35')} />
        ))}
      </div>
      <p className="text-kicker uppercase text-lime">{story.categoryName ?? story.label}</p>
      <h3 className="mt-1 font-serif text-[17px] font-semibold leading-snug">
        <Link to={articlePath(story.slug)} className="after:absolute after:inset-0">
          {story.title}
        </Link>
      </h3>
    </article>
  );
}

function QuoteCard({ story }: { story: StoryItem }) {
  return (
    <article className="group relative flex h-full flex-col gap-3 rounded-[12px] bg-paper p-3.5 pb-5">
      <Img {...story.image} ratio="4/3" sizes="(min-width: 768px) 380px, 100vw" className="rounded-lg" />
      <h3 className="px-1.5 font-serif text-[17px] italic leading-snug text-ink">
        <Link to={articlePath(story.slug)} className="after:absolute after:inset-0 group-hover:text-green-700">
          {story.excerpt ? (
            <>
              <span className="sr-only">{story.title}: </span>“{story.excerpt}”
            </>
          ) : (
            story.title
          )}
        </Link>
      </h3>
      <p className="px-1.5 text-meta text-ink-muted">— {story.byline ?? story.title}</p>
    </article>
  );
}

/** /stories (Figma 42:851): category circles, a swipeable row of tall story tiles and quote cards. */
export function StoriesLanding({ section, categories, items }: LandingProps) {
  const pick = picker(items);
  const isFaces = inCategory('faces-of-vsu');
  const faces = pick.nextWhere(isFaces, 3);
  const row = pick.next(6);
  const quotes = faces.length ? faces : pick.next(3);

  return (
    <div>
      <header className="border-b border-line bg-paper">
        <div className="container-page flex flex-col gap-3.5 pb-8 pt-9 md:pt-12">
          <p className="text-kicker uppercase text-green-500-text">More · Section</p>
          <h1 className="font-serif text-[44px] font-bold leading-none tracking-[-1px] text-ink md:text-[72px]">{section.name}</h1>
          {section.description && <p className="max-w-[720px] text-body-m text-ink-muted md:text-body-l">{section.description}</p>}
          {categories.length > 1 && (
            <nav aria-label={`${section.name} topics`} className="-mx-4 pt-3 md:mx-0">
              <ul data-scroll-x className="no-scrollbar flex gap-5 overflow-x-auto px-4 md:px-0">
                {categories.map((c, i) => (
                  <li key={c.slug} className="shrink-0">
                    <Link to={categoryHref(section.slug, c.slug)} className="group flex w-[76px] flex-col items-center gap-2 text-center">
                      <span className={cn('size-16 rounded-full border-[3px] border-paper ring-2 ring-lime', tileBg[i % tileBg.length])} aria-hidden />
                      <span className="text-[13px] font-semibold text-ink group-hover:text-green-700">{c.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </header>

      {!items.length ? (
        <LandingEmpty section={section} />
      ) : (
        <>
          {row.length > 0 && (
            <section aria-labelledby="new-stories" className="flex flex-col gap-6 py-10 md:py-12">
              <div className="container-page">
                <SectionHeader id="new-stories" title="New this week" href={allHref(section.slug)} linkLabel="All stories" />
              </div>
              <ul data-scroll-x className="no-scrollbar container-page flex snap-x gap-3 overflow-x-auto md:gap-4">
                {row.map((s, i) => (
                  <li key={s.id} className="snap-start">
                    <StoryTile story={s} i={i} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {quotes.length > 0 && (
            <Band tone="surface" label={faces.length ? 'Faces of VSU' : 'More stories'}>
              <SectionHeader title={faces.length ? 'Faces of VSU' : 'More stories'} href={faces.length ? categoryHref(section.slug, 'faces-of-vsu') : undefined} linkLabel="More faces" className="mb-6" />
              <ul className="grid gap-4 md:grid-cols-3 md:gap-5">
                {quotes.map((s) => (
                  <li key={s.id}>
                    <QuoteCard story={s} />
                  </li>
                ))}
              </ul>
            </Band>
          )}
          <SeeAll section={section} label="Every story" />
        </>
      )}
    </div>
  );
}
