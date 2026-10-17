import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { SectionHeader, StoryCard } from '@/components/story/Story';
import type { StoryItem } from '@/components/story/types';
import { Alert, Skeleton } from '@/components/ui/Feedback';
import { Img } from '@/components/ui/Img';
import { statusInfo } from '@/components/ui/status';
import { Kicker } from '@/components/ui/Tag';
import { formatDate, formatDateTime, formatReadingTime, joinMeta } from '@/lib/format';
import { sanitizeArticleHtml } from '@/lib/sanitize';
import { sectionPath } from '../nav';
import type { ArticleDetail } from './articleData';
import { ShareButtons } from './ShareButtons';

function Byline({ article }: { article: ArticleDetail }) {
  const names = article.authors.length
    ? article.authors.map((a, i) => (
        <span key={a.id}>
          {i > 0 && (i === article.authors.length - 1 ? ' and ' : ', ')}
          <span className="font-semibold text-ink">{a.name}</span>
        </span>
      ))
    : article.byline && <span className="font-semibold text-ink">{article.byline}</span>;

  return (
    <div className="flex items-center gap-3">
      {article.authors.length > 0 && (
        <div className="flex -space-x-2">
          {article.authors.slice(0, 3).map((a) => (
            <Img
              key={a.id}
              {...a.avatar}
              alt=""
              ratio="1/1"
              sizes="40px"
              rounded={false}
              className="size-10 rounded-full border-2 border-paper"
            />
          ))}
        </div>
      )}
      <div className="text-meta text-ink-muted">
        {names && <p>By {names}</p>}
        <p>
          {article.publishedAt ? (
            <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
          ) : (
            'Not published'
          )}
          {' · '}
          {formatReadingTime(article.readingMinutes)}
        </p>
      </div>
    </div>
  );
}

export function ArticleView({
  article,
  url,
  related,
  comments,
}: {
  article: ArticleDetail;
  url: string;
  related: StoryItem[];
  comments?: ReactNode;
}) {
  const html = useMemo(() => sanitizeArticleHtml(article.bodyHtml), [article.bodyHtml]);
  const authorsWithBio = article.authors.filter((a) => a.bio);

  return (
    <article className="pb-16">
      {!article.isLive && (
        <div className="container-page pt-6">
          <Alert tone="info">
            <strong>Preview.</strong> This article is <strong>{statusInfo[article.status].label.toLowerCase()}</strong>
            {article.status === 'scheduled' && article.publishedAt ? ` for ${formatDateTime(article.publishedAt)}` : ''} and
            only staff can see it.
          </Alert>
        </div>
      )}

      <header className="container-page flex max-w-[800px] flex-col gap-4 pt-8 md:pt-14">
        <nav aria-label="Breadcrumb" className="text-kicker uppercase">
          <Link to={sectionPath(article.sectionSlug)} className="text-green-500-text hover:underline">
            {article.sectionName}
          </Link>
          {article.label.includes(' · ') && <span className="text-green-500-text"> · {article.label.split(' · ').pop()}</span>}
        </nav>
        <h1 className="font-serif text-[32px] font-bold leading-[1.1] tracking-[-0.5px] text-ink md:text-[48px] md:tracking-[-1px] lg:text-display-xl">
          {article.title}
        </h1>
        {article.dek && <p className="text-[18px] leading-[1.5] text-ink-muted md:text-[20px]">{article.dek}</p>}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4 border-y border-line py-4">
          <Byline article={article} />
          <ShareButtons url={url} title={article.title} />
        </div>
      </header>

      {article.cover && (
        <figure className="container-page mt-8 max-w-[1100px]">
          <Img {...article.cover} priority sizes="(min-width: 1100px) 1068px, 100vw" />
          {(article.coverCaption || article.cover.alt) && (
            <figcaption className="mt-2 text-meta font-normal text-ink-muted">{article.coverCaption || article.cover.alt}</figcaption>
          )}
        </figure>
      )}

      <div className="container-page mt-8 max-w-[800px] md:mt-12">
        <div className="prose-article" dangerouslySetInnerHTML={{ __html: html }} />

        {article.tags.length > 0 && (
          <ul aria-label="Tags" className="mt-10 flex flex-wrap gap-2">
            {article.tags.map((t) => (
              <li key={t.slug}>
                <Link
                  to={`/search?tag=${encodeURIComponent(t.slug)}`}
                  className="inline-flex h-8 items-center rounded-full bg-green-soft px-3 text-[13px] font-semibold text-green-700 hover:bg-green-700 hover:text-on-dark"
                >
                  #{t.name}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
          <p className="text-meta text-ink-muted">
            {joinMeta(
              article.publishedAt && `Published ${formatDate(article.publishedAt)}`,
              article.publishedAt &&
                new Date(article.updatedAt).getTime() - new Date(article.publishedAt).getTime() > 86_400_000 &&
                `Updated ${formatDate(article.updatedAt)}`,
            )}
          </p>
          <ShareButtons url={url} title={article.title} />
        </div>

        {authorsWithBio.length > 0 && (
          <aside aria-label="About the authors" className="mt-10 flex flex-col gap-4">
            {authorsWithBio.map((a) => (
              <div key={a.id} className="flex gap-4 rounded-lg bg-surface p-5">
                <Img {...a.avatar} alt="" ratio="1/1" sizes="56px" rounded={false} className="size-14 shrink-0 rounded-full" />
                <div className="flex flex-col gap-1">
                  <p className="font-serif text-headline-s text-ink">{a.name}</p>
                  {a.position && <Kicker>{a.position}</Kicker>}
                  <p className="text-body-m text-ink-muted">{a.bio}</p>
                </div>
              </div>
            ))}
          </aside>
        )}

        {comments && <div className="mt-14">{comments}</div>}
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related" className="container-page mt-16 border-t border-line pt-12">
          <SectionHeader id="related" title={`More from ${article.sectionName}`} href={sectionPath(article.sectionSlug)} />
          <ul className="mt-7 grid gap-12 md:grid-cols-2 lg:grid-cols-3">
            {related.map((s) => (
              <li key={s.id}>
                <StoryCard story={s} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

export function ArticleSkeleton() {
  return (
    <div className="container-page flex max-w-[860px] flex-col gap-4 py-14" aria-busy>
      <h1 className="sr-only">Loading the article</h1>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-4/5" />
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="mt-6 aspect-video w-full" />
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  );
}
