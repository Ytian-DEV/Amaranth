import { Link } from 'react-router-dom';
import { SectionHeader, StoryCard } from '@/components/story/Story';
import { articlePath, storyMeta, type StoryItem } from '@/components/story/types';
import { Img } from '@/components/ui/Img';
import { Kicker } from '@/components/ui/Tag';
import { cn } from '@/lib/cn';
import { formatReadingTime } from '@/lib/format';
import { publicUrl, srcSet } from '@/lib/media';
import { Band, CategoryChips, Headline, LandingEmpty, SeeAll, type LandingProps } from './blocks';
import { inCategory, picker } from './data';
import { allHref } from './links';

/** Full-bleed photo hero with the headline over a dark gradient. */
function PhotoHero({ story, section }: { story: StoryItem; section: LandingProps['section'] }) {
  const src = story.image ? publicUrl(story.image.bucket, story.image.path) : null;
  return (
    <header className="relative isolate overflow-hidden bg-green-900 text-on-dark">
      {src && <img src={src} srcSet={story.image ? srcSet(story.image) : undefined} sizes="100vw" alt="" className="absolute inset-0 -z-10 size-full object-cover" fetchPriority="high" />}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-green-900/30 via-green-900/60 to-ink/95" aria-hidden />
      <div className="container-page flex min-h-[420px] flex-col justify-end gap-3.5 pb-10 pt-24 md:min-h-[560px] md:pb-14">
        <p className="text-kicker uppercase text-lime">
          {section.name} · {story.categoryName ?? 'Long read'}
        </p>
        <h1 className="max-w-[820px] font-serif text-[36px] font-bold leading-[1.05] tracking-[-1px] md:text-[64px]">
          <Link to={articlePath(story.slug)} className="hover:underline">
            {story.title}
          </Link>
        </h1>
        {story.excerpt && <p className="max-w-[640px] text-body-m text-on-dark-muted md:text-body-l">{story.excerpt}</p>}
        <p className="text-meta text-on-dark-muted">{storyMeta(story)}</p>
      </div>
    </header>
  );
}

function LongRead({ story, flip }: { story: StoryItem; flip: boolean }) {
  return (
    <article className="group relative grid items-center gap-6 md:grid-cols-2 md:gap-12">
      <Img {...story.image} ratio="560/400" sizes="(min-width: 768px) 560px, 100vw" className={cn('rounded-[10px]', flip && 'md:order-2')} />
      <div className="flex flex-col gap-3">
        <Kicker>{story.categoryName ?? story.label}</Kicker>
        <Headline story={story} as="h3" className="font-serif text-[26px] font-semibold leading-tight tracking-[-0.5px] text-ink md:text-[34px]" />
        {story.excerpt && <p className="text-body-m text-ink-muted">{story.excerpt}</p>}
        <p className="flex gap-4 text-meta text-ink-muted">
          {story.readingMinutes ? formatReadingTime(story.readingMinutes) : null}
          <span className="font-semibold text-green-700" aria-hidden>
            Read the story →
          </span>
        </p>
      </div>
    </article>
  );
}

function Profile({ story }: { story: StoryItem }) {
  return (
    <article className="group relative flex flex-col items-center gap-2 text-center">
      <Img {...story.image} ratio="1/1" sizes="160px" rounded={false} className="mb-2 w-32 rounded-full md:w-40" />
      <Headline story={story} as="h3" className="font-serif text-headline-s text-ink md:text-[19px]" />
      <Kicker>{story.categoryName}</Kicker>
      {story.excerpt && <p className="line-clamp-3 font-serif text-[15px] italic text-ink-muted">“{story.excerpt}”</p>}
    </article>
  );
}

/** /feature (Figma 31:252): photo hero, long reads, profiles, a photo band and more features. */
export function FeatureLanding({ section, categories, items }: LandingProps) {
  const pick = picker(items);
  const hero = pick.nextWhere((s) => Boolean(s.image), 1)[0] ?? pick.next(1)[0];
  const isProfile = inCategory('people-events');
  const profiles = pick.nextWhere(isProfile, 4);
  const longReads = pick.nextWhere((s) => (s.readingMinutes ?? 0) >= 6, 2);
  if (longReads.length < 2) longReads.push(...pick.next(2 - longReads.length));
  const pictures = pick.nextWhere((s) => Boolean(s.image), 3);
  const photos = pictures.length === 3 ? pictures : [];
  const more = pick.rest().concat(pictures.length === 3 ? [] : pictures).slice(0, 6);

  if (!hero) {
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
      <PhotoHero story={hero} section={section} />
      <div className="container-page pt-6">
        <CategoryChips section={section} categories={categories} allLabel="All features" />
      </div>

      {longReads.length > 0 && (
        <section aria-labelledby="long-reads" className="container-page flex flex-col gap-10 py-10 md:gap-14 md:py-12">
          <SectionHeader id="long-reads" title="Long reads" href={allHref(section.slug)} linkLabel="All long reads" />
          {longReads.map((s, i) => (
            <LongRead key={s.id} story={s} flip={i % 2 === 1} />
          ))}
        </section>
      )}

      {profiles.length > 0 && (
        <Band tone="surface" label="Profiles">
          <SectionHeader title="Profiles" href={`/${section.slug}?category=people-events`} linkLabel="More profiles" className="mb-8" />
          <ul className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
            {profiles.map((s) => (
              <li key={s.id}>
                <Profile story={s} />
              </li>
            ))}
          </ul>
        </Band>
      )}

      {photos.length === 3 && (
        <Band tone="dark" label="In pictures">
          <div className="mb-6 flex flex-col gap-2">
            <p className="text-kicker uppercase text-lime">In pictures</p>
            <h2 className="font-serif text-[28px] font-semibold md:text-[34px]">From the {section.name.toLowerCase()} desk</h2>
          </div>
          <ul className="grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
            {photos.map((s, i) => (
              <li key={s.id} className="group relative flex flex-col gap-2">
                <Img {...s.image} ratio={i === 0 ? '400/260' : '200/260'} sizes="(min-width: 768px) 400px, 100vw" className="rounded-md bg-green-700" />
                <Link to={articlePath(s.slug)} className="text-meta text-on-dark-muted after:absolute after:inset-0 hover:text-on-dark">
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </Band>
      )}

      {more.length > 0 && (
        <section aria-labelledby="more-features" className="container-page flex flex-col gap-6 pb-6 pt-12">
          <SectionHeader id="more-features" title={`More ${section.name.toLowerCase()}s`} />
          <ul className="grid gap-10 md:grid-cols-3 md:gap-12">
            {more.map((s) => (
              <li key={s.id}>
                <StoryCard story={{ ...s, label: s.categoryName ?? s.label }} />
              </li>
            ))}
          </ul>
        </section>
      )}
      <SeeAll section={section} />
    </div>
  );
}
