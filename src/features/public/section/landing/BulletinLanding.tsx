import { Link } from 'react-router-dom';
import { articlePath, type StoryItem } from '@/components/story/types';
import { Tag } from '@/components/ui/Tag';
import { cn } from '@/lib/cn';
import { formatDateTime, joinMeta } from '@/lib/format';
import { manilaDate } from '@/lib/manila';
import { CategoryChips, CtaCard, LandingEmpty, SectionIntro, SeeAll, type LandingProps } from './blocks';

function Notice({ story, fresh }: { story: StoryItem; fresh: boolean }) {
  return (
    <article className={cn('group relative flex flex-col gap-2 rounded-[12px] border bg-surface p-5 md:p-6', fresh ? 'border-lime-dark' : 'border-line')}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-meta text-ink-muted md:pr-32">
        {story.categoryName && <Tag>{story.categoryName}</Tag>}
        {fresh && <Tag className="bg-lime text-green-900">New</Tag>}
        <span>{joinMeta(story.byline, formatDateTime(story.publishedAt))}</span>
      </div>
      <h3 className="font-serif text-[20px] font-semibold leading-snug text-ink md:text-[22px]">
        <Link to={articlePath(story.slug)} className="after:absolute after:inset-0 group-hover:text-green-700">
          {story.title}
        </Link>
      </h3>
      {story.excerpt && <p className="line-clamp-2 text-body-m text-ink-muted">{story.excerpt}</p>}
      <span className="text-button text-green-700 md:absolute md:right-6 md:top-6" aria-hidden>
        View notice →
      </span>
    </article>
  );
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** This month in Manila: today, and the days notices went up. */
export function MonthCalendar({ marked, today = manilaDate() }: { marked: Set<string>; today?: string }) {
  const [y, m] = today.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (number | null)[] = [...Array(first.getUTCDay()).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const iso = (d: number) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const title = first.toLocaleDateString('en-PH', { month: 'long', year: 'numeric', timeZone: 'UTC' });

  return (
    <section aria-labelledby="bulletin-calendar" className="rounded-[14px] border border-line bg-surface p-5">
      <h2 id="bulletin-calendar" className="pb-3 font-serif text-[22px] font-semibold text-ink">
        {title}
      </h2>
      <table className="w-full table-fixed text-center text-[14px]">
        <thead>
          <tr>
            {WEEKDAYS.map((d, i) => (
              <th key={i} scope="col" className="pb-2 text-[11px] font-semibold text-ink-muted">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: Math.ceil(cells.length / 7) }, (_, r) => (
            <tr key={r}>
              {cells.slice(r * 7, r * 7 + 7).map((d, i) => {
                const isToday = d !== null && iso(d) === today;
                const isMarked = d !== null && marked.has(iso(d));
                return (
                  <td key={i} className="p-0.5">
                    {d !== null && (
                      <span
                        className={cn('mx-auto grid size-8 place-items-center rounded-md', isToday ? 'bg-green-900 font-semibold text-lime' : isMarked ? 'bg-lime-soft font-semibold text-lime-dark-text' : 'text-ink')}
                        aria-label={isToday ? `${d}, today` : isMarked ? `${d}, notices posted` : undefined}
                      >
                        {d}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 flex gap-4 text-meta text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-green-900" aria-hidden /> Today
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-lime-soft ring-1 ring-lime-dark/30" aria-hidden /> Notices posted
        </span>
      </p>
    </section>
  );
}

/** /bulletin (Figma 40:879): notice cards with category filters, a month calendar and "post an announcement". */
export function BulletinLanding({ section, categories, items }: LandingProps) {
  const notices = items.slice(0, 10);
  const today = manilaDate();
  const marked = new Set(items.filter((s) => s.publishedAt).map((s) => manilaDate(s.publishedAt!)));
  const recent = Date.now() - 3 * 86_400_000; // "New" for three days

  return (
    <div>
      <SectionIntro section={section} />
      {!items.length ? (
        <LandingEmpty section={section} />
      ) : (
        <div className="container-page grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_330px] lg:gap-12">
          <section aria-labelledby="notices" className="flex min-w-0 flex-col gap-4">
            <h2 id="notices" className="sr-only">
              Notices
            </h2>
            <CategoryChips section={section} categories={categories} allLabel="All" />
            <ul className="flex flex-col gap-4">
              {notices.map((s) => (
                <li key={s.id}>
                  <Notice story={s} fresh={Boolean(s.publishedAt && Date.parse(s.publishedAt) > recent)} />
                </li>
              ))}
            </ul>
          </section>
          <div className="flex flex-col gap-6 lg:pt-[52px]">
            <MonthCalendar marked={marked} today={today} />
            <CtaCard title="Post an announcement" body="University offices and accredited orgs can send notices for the Bulletin." to="/contact" label="Submit a notice" />
          </div>
        </div>
      )}
      <SeeAll section={section} label="Every notice" />
    </div>
  );
}
