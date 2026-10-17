import { FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SectionHeader } from '@/components/story/Story';
import { EmptyState, Skeleton } from '@/components/ui/Feedback';
import { Img } from '@/components/ui/Img';
import { formatDate, joinMeta } from '@/lib/format';
import type { ArchiveMonth, Issue } from './archivesData';
import { monthLabel } from './archivesData';

function IssueCard({ issue }: { issue: Issue }) {
  return (
    <article className="flex flex-col gap-3">
      <Img {...issue.cover} alt={issue.cover?.alt || `Cover of ${issue.title}`} ratio="3/4" sizes="(min-width: 1024px) 270px, 45vw" />
      <div className="flex flex-col gap-1">
        <p className="text-kicker uppercase text-green-500-text">
          {joinMeta(issue.volume ? `Vol. ${issue.volume}` : null, issue.issueNumber ? `No. ${issue.issueNumber}` : null) || issue.type}
        </p>
        <h3 className="font-serif text-headline-s text-ink">{issue.title}</h3>
        <p className="text-meta text-ink-muted">{formatDate(issue.date)}</p>
      </div>
      {issue.pdfUrl && (
        <a
          href={issue.pdfUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 self-start text-button text-green-700 hover:underline"
        >
          <FileText className="size-4" aria-hidden /> Read the PDF<span className="sr-only">: {issue.title}</span>
        </a>
      )}
    </article>
  );
}

export function ArchivesView({ issues, months }: { issues: Issue[] | undefined; months: ArchiveMonth[] | undefined }) {
  const years = new Map<string, ArchiveMonth[]>();
  for (const m of months ?? []) {
    const year = m.month.slice(0, 4);
    years.set(year, [...(years.get(year) ?? []), m]);
  }

  return (
    <div className="pb-16">
      <header className="border-b border-line bg-surface">
        <div className="container-page flex flex-col gap-3 py-8 md:py-12">
          <div className="flex items-center gap-4">
            <span className="h-8 w-1.5 rounded-[2px] bg-lime md:h-10" aria-hidden />
            <h1 className="font-serif text-[34px] font-bold leading-none tracking-[-1px] md:text-display-l">Archives</h1>
          </div>
          <p className="max-w-2xl text-body-m text-ink-muted md:text-body-l">
            Every print issue of Amaranth, and every story we have published online, month by month.
          </p>
        </div>
      </header>

      <section aria-labelledby="issues" className="container-page pt-10 md:pt-14">
        <SectionHeader id="issues" title="Print issues" />
        {!issues ? (
          <div className="mt-7 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="aspect-[3/4]" />
            ))}
          </div>
        ) : issues.length === 0 ? (
          <EmptyState title="No print issues yet" className="mt-7">
            Digitised issues will appear here.
          </EmptyState>
        ) : (
          <ul className="mt-7 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {issues.map((issue) => (
              <li key={issue.id}>
                <IssueCard issue={issue} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="by-month" className="container-page pt-14 md:pt-16">
        <SectionHeader id="by-month" title="Online, by month" />
        {!months ? (
          <Skeleton className="mt-7 h-24" />
        ) : months.length === 0 ? (
          <EmptyState title="Nothing published yet" className="mt-7" />
        ) : (
          <div className="mt-7 flex flex-col gap-8">
            {[...years.entries()].map(([year, list]) => (
              <div key={year} className="grid gap-3 md:grid-cols-[120px_1fr]">
                <h3 className="font-serif text-headline-m text-ink">{year}</h3>
                <ul className="flex flex-wrap gap-2">
                  {list.map((m) => (
                    <li key={m.month}>
                      <Link
                        to={`/archives/${m.month.slice(0, 7)}`}
                        className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-4 text-[14px] font-semibold text-ink hover:border-green-700"
                      >
                        {monthLabel(m.month.slice(0, 7)).split(' ')[0]}
                        <span className="text-meta text-ink-muted">{m.articles}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
