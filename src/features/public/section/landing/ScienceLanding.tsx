import { Link } from 'react-router-dom';
import { SectionHeader } from '@/components/story/Story';
import { articlePath, type StoryItem } from '@/components/story/types';
import { Img } from '@/components/ui/Img';
import { cn } from '@/lib/cn';
import { Band, Headline, LandingEmpty, LeadStory, SectionIntro, SeeAll, type LandingProps } from './blocks';
import { picker } from './data';
import { allHref } from './links';

function LabCard({ story, i }: { story: StoryItem; i: number }) {
  return (
    <article className="group relative flex h-full flex-col gap-3 rounded-[12px] border border-line bg-surface p-3.5 pb-5">
      <Img {...story.image} ratio="200/124" sizes="(min-width: 1024px) 260px, 50vw" className={cn('rounded-lg', i % 2 ? 'bg-lime-soft' : 'bg-green-soft')} />
      <p className="flex items-center gap-1.5 px-1 text-kicker uppercase text-green-500-text">
        <span className="size-1.5 rounded-full bg-lime-dark" aria-hidden />
        {story.categoryName ?? story.label}
      </p>
      <Headline story={story} as="h3" className="px-1 font-serif text-headline-s text-ink" />
    </article>
  );
}

/** /science-technology (Figma 39:579): lead story, more research panel, lab cards and "tech explained". */
export function ScienceLanding({ section, categories, items }: LandingProps) {
  const pick = picker(items);
  const lead = pick.nextWhere((s) => Boolean(s.image), 1)[0] ?? pick.next(1)[0];
  const glance = pick.next(4);
  const labs = pick.next(4);
  const explained = pick.next(3);

  return (
    <div>
      <SectionIntro section={section} categories={categories} allLabel="All S&T" />
      {!lead ? (
        <LandingEmpty section={section} />
      ) : (
        <>
          <div className="container-page grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12">
            <LeadStory story={lead} />
            {glance.length > 0 && (
              <aside aria-labelledby="also-in" className="self-start rounded-[14px] bg-green-soft p-6">
                <h2 id="also-in" className="pb-2 font-serif text-[22px] font-semibold text-ink">
                  Also in {section.name.replace('Science & Technology', 'S&T')}
                </h2>
                <ul>
                  {glance.map((s) => (
                    <li key={s.id} className="flex flex-col gap-1 border-b border-green-900/10 py-3 last:border-0">
                      <p className="text-kicker uppercase text-green-700">{s.categoryName ?? s.label}</p>
                      <Link to={articlePath(s.slug)} className="text-[14px] font-medium leading-snug text-ink hover:text-green-700 hover:underline">
                        {s.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </aside>
            )}
          </div>

          {labs.length > 0 && (
            <section aria-labelledby="from-labs" className="container-page flex flex-col gap-6 pb-12">
              <SectionHeader id="from-labs" title="From VSU labs" href={allHref(section.slug)} linkLabel="All research" />
              <ul className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
                {labs.map((s, i) => (
                  <li key={s.id}>
                    <LabCard story={s} i={i} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {explained.length > 0 && (
            <Band tone="dark" label="Explained">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div className="flex flex-col gap-2">
                  <p className="text-kicker uppercase text-lime">Explained</p>
                  <h2 className="font-serif text-[28px] font-semibold md:text-[34px]">Big ideas in a few minutes</h2>
                </div>
                <Link to="/explainer" className="text-button text-lime hover:underline">
                  All explainers <span aria-hidden>→</span>
                </Link>
              </div>
              <ol className="grid gap-4 md:grid-cols-3">
                {explained.map((s, i) => (
                  <li key={s.id} className="group relative flex flex-col gap-3 rounded-[12px] bg-green-700 p-6">
                    <span className="font-serif text-[34px] italic leading-none text-lime" aria-hidden>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <Link to={articlePath(s.slug)} className="font-serif text-[20px] font-semibold leading-snug after:absolute after:inset-0 hover:underline">
                      {s.title}
                    </Link>
                    {s.excerpt && <p className="line-clamp-3 text-[14px] text-on-dark-muted">{s.excerpt}</p>}
                  </li>
                ))}
              </ol>
            </Band>
          )}
          <SeeAll section={section} label="Every S&T story" />
        </>
      )}
    </div>
  );
}
