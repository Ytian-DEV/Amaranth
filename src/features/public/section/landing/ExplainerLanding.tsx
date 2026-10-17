import { Link } from 'react-router-dom';
import { SectionHeader } from '@/components/story/Story';
import { articlePath, type StoryItem } from '@/components/story/types';
import { Kicker } from '@/components/ui/Tag';
import { formatReadingTime, formatShortDate, joinMeta } from '@/lib/format';
import { CtaBand, LandingEmpty, SectionIntro, SeeAll, type LandingProps } from './blocks';
import { picker } from './data';
import { allHref } from './links';

function QuestionCard({ story }: { story: StoryItem }) {
  return (
    <article className="group relative flex h-full flex-col gap-4 rounded-[12px] border border-line bg-surface p-6">
      <div className="flex items-start justify-between gap-3">
        <Kicker>{story.categoryName ?? story.label}</Kicker>
        <span className="font-serif text-[28px] font-bold leading-none text-lime-dark" aria-hidden>
          ?
        </span>
      </div>
      <h3 className="font-serif text-[20px] font-semibold leading-snug text-ink">
        <Link to={articlePath(story.slug)} className="after:absolute after:inset-0 group-hover:text-green-700">
          {story.title}
        </Link>
      </h3>
      <span className="mt-auto text-button text-green-700" aria-hidden>
        Get the answer →
      </span>
    </article>
  );
}

/** /explainer (Figma 40:721): featured explainer with its short answer, more explainers, "ask us". */
export function ExplainerLanding({ section, categories, items }: LandingProps) {
  const pick = picker(items);
  const lead = pick.next(1)[0];
  const more = pick.next(9);

  return (
    <div>
      <SectionIntro section={section} categories={categories} />
      {!lead ? (
        <LandingEmpty section={section} />
      ) : (
        <>
          <div className="container-page grid gap-8 py-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-14">
            <article className="group relative flex flex-col gap-4">
              <Kicker>{joinMeta('Featured explainer', formatReadingTime(lead.readingMinutes))}</Kicker>
              <h2 className="font-serif text-[34px] font-bold leading-[1.06] tracking-[-0.8px] text-ink md:text-[52px]">
                <Link to={articlePath(lead.slug)} className="after:absolute after:inset-0 hover:text-green-700">
                  {lead.title}
                </Link>
              </h2>
              <p className="text-meta text-ink-muted">{joinMeta(lead.byline ? `By ${lead.byline}` : null, `Updated ${formatShortDate(lead.publishedAt)}`)}</p>
            </article>
            {lead.excerpt && (
              <aside aria-label="The short answer" className="self-start rounded-r-[14px] border-l-4 border-lime bg-lime-soft p-6">
                <p className="pb-2 text-kicker uppercase text-green-700">The short answer</p>
                <p className="font-serif text-[19px] font-semibold leading-snug text-green-900">{lead.excerpt}</p>
                <Link to={articlePath(lead.slug)} className="mt-4 inline-block text-button text-green-700 hover:underline">
                  Read the full explainer <span aria-hidden>→</span>
                </Link>
              </aside>
            )}
          </div>

          {more.length > 0 && (
            <section aria-labelledby="more-explainers" className="container-page flex flex-col gap-6 pb-6">
              <SectionHeader id="more-explainers" title="More explainers" href={allHref(section.slug)} linkLabel="All explainers" />
              <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
                {more.map((s) => (
                  <li key={s.id}>
                    <QuestionCard story={s} />
                  </li>
                ))}
              </ul>
            </section>
          )}
          <SeeAll section={section} label="Every explainer" />
        </>
      )}
      <CtaBand tone="dark" eyebrow="Ask Amaranth" title="Confused about a campus policy? Ask us and we’ll explain it." to="/contact" label="Ask a question" />
    </div>
  );
}
