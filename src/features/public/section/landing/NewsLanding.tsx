import { Link } from 'react-router-dom';
import { SectionHeader, StoryCard } from '@/components/story/Story';
import { articlePath } from '@/components/story/types';
import { CtaCard, FeedStory, LandingEmpty, LeadStory, MostRead, SectionIntro, type LandingProps } from './blocks';
import { allHref, briefTime } from './links';
import { picker } from './data';

/** /news (Figma 30:108): lead + campus briefs, top stories, feed with most read and a tip box. */
export function NewsLanding({ section, categories, items, mostRead }: LandingProps) {
  const pick = picker(items);
  const lead = pick.nextWhere((s) => Boolean(s.image), 1)[0] ?? pick.next(1)[0];
  const briefs = pick.next(5);
  const top = pick.next(3);
  const feed = pick.next(8);

  return (
    <div>
      <SectionIntro section={section} categories={categories} />
      {!lead ? (
        <LandingEmpty section={section} />
      ) : (
        <>
          <div className="container-page grid gap-10 pb-12 pt-9 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
            <LeadStory story={lead} />
            {briefs.length > 0 && (
              <section aria-labelledby="briefs" className="self-start rounded-[14px] border border-line bg-surface px-6 pb-3 pt-6">
                <h2 id="briefs" className="flex items-center gap-2.5 pb-2.5 font-serif text-[24px] font-semibold text-ink">
                  <span className="size-2 rounded-full bg-alert" aria-hidden />
                  {section.slug === 'news' ? 'Campus briefs' : 'Briefs'}
                </h2>
                <ul>
                  {briefs.map((s) => (
                    <li key={s.id} className="flex gap-3.5 border-b border-line py-3.5 last:border-0">
                      <span className="w-[72px] shrink-0 text-meta text-green-500-text">{briefTime(s.publishedAt)}</span>
                      <Link to={articlePath(s.slug)} className="font-serif text-[16px] font-semibold leading-snug text-ink hover-lime">
                        {s.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {top.length > 0 && (
            <section aria-labelledby="top-stories" className="container-page flex flex-col gap-6 pb-14 pt-2">
              <SectionHeader id="top-stories" title="Top stories" href={allHref(section.slug)} linkLabel={`All ${section.name.toLowerCase()}`} />
              <ul className="grid gap-10 md:grid-cols-3 md:gap-12">
                {top.map((s) => (
                  <li key={s.id}>
                    <StoryCard story={{ ...s, label: s.categoryName ?? s.label }} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="container-page grid gap-12 pb-20 pt-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <section aria-labelledby="more-news" className="flex flex-col">
              {feed.length > 0 && (
                <>
                  <SectionHeader id="more-news" title={`More ${section.name.toLowerCase()}`} href={allHref(section.slug)} linkLabel="Older stories" />
                  <ul>
                    {feed.map((s) => (
                      <li key={s.id}>
                        <FeedStory story={s} />
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
            <div className="flex flex-col gap-7">
              <MostRead items={mostRead} />
              <CtaCard title="Got a news tip?" body="Tell our newsroom what’s happening on campus. You can stay anonymous." to="/contact" label="Send a tip" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
