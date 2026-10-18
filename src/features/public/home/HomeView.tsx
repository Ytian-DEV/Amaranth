import { Link } from 'react-router-dom';
import { SectionHeader, StoryCard, StoryCompact, StoryRow } from '@/components/story/Story';
import { articlePath, storyMeta, type StoryItem } from '@/components/story/types';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState, Skeleton } from '@/components/ui/Feedback';
import { Img } from '@/components/ui/Img';
import { Kicker } from '@/components/ui/Tag';
import { formatReadingTime } from '@/lib/format';
import type { HomeData, TickerItem } from './homeData';

export function Ticker({ items }: { items: TickerItem[] }) {
  if (!items.length) return null;
  return (
    <section aria-label="Latest headlines" className="border-b border-line bg-surface">
      <div className="container-page flex items-center gap-4 py-2.5 md:py-3">
        <span className="shrink-0 rounded-sm bg-alert px-2 py-1 text-kicker uppercase text-on-dark">Latest</span>
        <ul data-scroll-x className="flex min-w-0 flex-1 gap-2 overflow-hidden text-[14px] md:text-body-m md:[mask-image:linear-gradient(to_right,black_92%,transparent)]">
          {items.map((item, i) => (
            <li key={item.text} className={i > 0 ? 'hidden shrink-0 md:flex md:gap-2' : 'min-w-0 truncate md:shrink-0'}>
              {i > 0 && (
                <span aria-hidden className="text-ink-muted">
                  ·
                </span>
              )}
              {item.href ? (
                <Link to={item.href} className="block truncate text-ink hover:text-green-700 hover:underline">
                  {item.text}
                </Link>
              ) : (
                <span className="block truncate">{item.text}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function LeadStory({ story }: { story: StoryItem }) {
  return (
    <article className="group relative flex flex-col gap-3">
      <Img {...story.image} ratio="772/430" priority sizes="(min-width: 1024px) 772px, 100vw" />
      <Kicker className="mt-1">{story.label}</Kicker>
      <h1 className="font-serif text-[30px] font-bold leading-[1.1] tracking-[-0.5px] text-ink group-hover:text-green-700 md:text-[44px] md:tracking-[-1px] lg:text-display-xl">
        <Link to={articlePath(story.slug)} className="after:absolute after:inset-0">
          {story.title}
        </Link>
      </h1>
      {story.excerpt && <p className="text-[15px] text-ink-muted md:text-body-l">{story.excerpt}</p>}
      <p className="text-meta text-ink-muted">{storyMeta(story)}</p>
    </article>
  );
}

function MostRead({ items, className }: { items: StoryItem[]; className?: string }) {
  if (!items.length) return null;
  return (
    <section aria-labelledby="most-read" className={className}>
      <SectionHeader id="most-read" title="Most Read" size="m" rule={false} />
      <ol className="mt-1">
        {items.map((s, i) => (
          <li key={s.id}>
            <StoryRow story={s} index={i + 1} />
          </li>
        ))}
      </ol>
    </section>
  );
}

function Folio({ folio }: { folio: NonNullable<HomeData['folio']> }) {
  return (
    <section aria-labelledby="folio" className="bg-green-900 text-on-dark">
      <div className="container-page grid gap-10 py-14 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-center lg:gap-20 lg:py-[72px]">
        <div className="flex flex-col items-start gap-5">
          <h2 id="folio" className="font-sans text-kicker uppercase text-lime">
            Literary Folio
          </h2>
          {folio.quote && (
            <blockquote className="font-serif text-[28px] italic leading-[1.25] text-on-dark md:text-[40px]">
              {folio.quote}
            </blockquote>
          )}
          {folio.attribution && <p className="text-meta text-green-soft">{folio.attribution}</p>}
          <ButtonLink to={folio.href} variant="accent">
            Read the Folio
          </ButtonLink>
        </div>
        {folio.items.length > 0 && (
          <ul>
            {folio.items.map((s) => (
              <li key={s.id} className="relative flex flex-col gap-1.5 border-b border-green-700 py-[18px]">
                <span className="text-kicker uppercase text-lime">{s.label.split(' · ').pop()}</span>
                <h3 className="font-serif text-headline-m text-on-dark hover:text-lime">
                  <Link to={articlePath(s.slug)} className="after:absolute after:inset-0">
                    {s.title}
                  </Link>
                </h3>
                {s.readingMinutes ? <p className="text-meta text-green-soft">{formatReadingTime(s.readingMinutes)}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function ViewItem({ story }: { story: StoryItem }) {
  return (
    <article className="group relative flex gap-5 border-b border-line py-5">
      <Img {...story.image} ratio="1/1" sizes="64px" rounded={false} className="size-16 shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-col gap-1.5">
        <Kicker>{story.label.split(' · ').pop()}</Kicker>
        <h3 className="font-serif text-headline-m text-ink group-hover:text-green-700">
          <Link to={articlePath(story.slug)} className="after:absolute after:inset-0">
            {story.title}
          </Link>
        </h3>
        {story.excerpt && <p className="line-clamp-2 text-body-m text-ink-muted">{story.excerpt}</p>}
      </div>
    </article>
  );
}

function ContributeCta() {
  return (
    <section aria-labelledby="contribute" className="container-page pb-16 pt-6 md:pb-20 md:pt-12">
      <div className="flex flex-col gap-6 rounded-[16px] bg-lime-soft p-5 md:p-12 lg:flex-row lg:items-center lg:gap-12">
        <div className="flex flex-1 flex-col gap-2.5">
          <h2 id="contribute" className="font-serif text-[24px] font-semibold leading-tight text-green-900 md:text-headline-l">
            Have a story the campus needs to hear?
          </h2>
          <p className="text-body-m text-ink-muted">
            <span className="md:hidden">Send us your articles, tips and event reports.</span>
            <span className="hidden md:inline">
              Amaranth is written by students, for students. Send us your articles, tips and event reports. Our editors
              review every submission within 3 to 5 school days.
            </span>
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink to="/submit" variant="primary">
            Submit an Article
          </ButtonLink>
          <ButtonLink to="/submit/event" variant="outline">
            Report an Event
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

export function HomeView({ data }: { data: HomeData }) {
  if (!data.lead) {
    return (
      <>
        <h1 className="sr-only">Amaranth</h1>
        <div className="container-page py-16">
          <EmptyState title="The first stories are on their way">
            Nothing has been published yet. Check back soon — or send us a story.
          </EmptyState>
        </div>
        <ContributeCta />
      </>
    );
  }

  return (
    <>
      <Ticker items={data.ticker} />

      <div className="container-page grid gap-12 pb-10 pt-5 md:pt-12 lg:grid-cols-[minmax(0,772fr)_minmax(0,380fr)] lg:gap-12">
        <LeadStory story={data.lead} />
        <MostRead items={data.mostRead} className="hidden lg:block" />
      </div>

      {data.latest.length > 0 && (
        <section aria-labelledby="latest" className="container-page pb-14 md:pb-16">
          <SectionHeader id="latest" title="Latest Stories" href="/latest" />
          <ul className="mt-6 hidden gap-12 md:grid md:grid-cols-2 lg:mt-7 lg:grid-cols-3">
            {data.latest.map((s) => (
              <li key={s.id}>
                <StoryCard story={s} />
              </li>
            ))}
          </ul>
          <ul className="mt-4 flex flex-col gap-4 md:hidden">
            {data.latest.map((s) => (
              <li key={s.id}>
                <StoryCompact story={s} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.mostRead.length > 0 && (
        <div className="bg-surface py-6 lg:hidden">
          <MostRead items={data.mostRead} className="container-page" />
        </div>
      )}

      {data.folio && <Folio folio={data.folio} />}

      {(data.sports.length > 0 || data.views.length > 0) && (
        <div className="container-page grid gap-14 py-14 md:py-[72px] lg:grid-cols-2 lg:gap-16">
          {data.sports.length > 0 && (
            <section aria-labelledby="sports">
              <SectionHeader id="sports" title="Sports" href="/sports" linkLabel="All sports" />
              <div className="mt-6 flex flex-col gap-6">
                <StoryCard story={data.sports[0]} showExcerpt={false} sizes="(min-width: 1024px) 568px, 100vw" />
                {data.sports.slice(1).map((s) => (
                  <StoryCompact key={s.id} story={s} />
                ))}
              </div>
            </section>
          )}
          {data.views.length > 0 && (
            <section aria-labelledby="views">
              <SectionHeader id="views" title="Views & Opinion" href="/views" linkLabel="All columns" />
              <div className="mt-2">
                {data.views.map((s) => (
                  <ViewItem key={s.id} story={s} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <ContributeCta />
    </>
  );
}

export function HomeSkeleton() {
  return (
    <div className="container-page grid gap-12 py-12 lg:grid-cols-[minmax(0,772fr)_minmax(0,380fr)]" aria-busy>
      <h1 className="sr-only">Loading the front page</h1>
      <div className="flex flex-col gap-4">
        <Skeleton className="aspect-[772/430]" />
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="hidden flex-col gap-6 lg:flex">
        <Skeleton className="h-7 w-40" />
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    </div>
  );
}
