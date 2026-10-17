import { Link } from 'react-router-dom';
import { SectionHeader } from '@/components/story/Story';
import { articlePath, type StoryItem } from '@/components/story/types';
import { Img } from '@/components/ui/Img';
import { Tag } from '@/components/ui/Tag';
import { cn } from '@/lib/cn';
import { formatShortDate, joinMeta } from '@/lib/format';
import { CtaCard, Headline, LandingEmpty, SectionIntro, SeeAll, type LandingProps } from './blocks';
import { categoryHref } from './links';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

function Avatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'lg' }) {
  return (
    <span className={cn('grid shrink-0 place-items-center rounded-full bg-photo font-semibold text-green-900', size === 'lg' ? 'size-16 text-[20px]' : 'size-6 text-[10px]')} aria-hidden>
      {initials(name)}
    </span>
  );
}

/** One card per writer: their name, how many recent posts, and the newest one. */
function bloggers(items: StoryItem[], max = 4) {
  const by = new Map<string, StoryItem[]>();
  for (const s of items) {
    if (!s.byline) continue;
    by.set(s.byline, [...(by.get(s.byline) ?? []), s]);
  }
  return [...by.entries()].slice(0, max).map(([name, posts]) => ({ name, posts }));
}

function PostRow({ story }: { story: StoryItem }) {
  return (
    <article className="group relative grid gap-4 border-b border-line py-6 sm:grid-cols-[minmax(0,1fr)_144px] sm:gap-8">
      <div className="flex min-w-0 flex-col gap-2">
        <p className="flex items-center gap-2 text-meta text-ink-muted">
          {story.byline && <Avatar name={story.byline} />}
          <span>{joinMeta(story.byline ? `${story.byline}` : null, story.categoryName ? `in ${story.categoryName}` : null, formatShortDate(story.publishedAt))}</span>
        </p>
        <Headline story={story} as="h3" className="font-serif text-[22px] font-semibold leading-tight text-ink md:text-[24px]" />
        {story.excerpt && <p className="line-clamp-2 text-body-m text-ink-muted">{story.excerpt}</p>}
        {story.categoryName && (
          <p>
            <Tag>{story.categoryName}</Tag>
          </p>
        )}
      </div>
      <Img {...story.image} ratio="144/108" sizes="144px" className="hidden rounded-lg sm:block" />
    </article>
  );
}

/** /blogs (Figma 34:349): featured bloggers, latest posts, topics and a pitch box. */
export function BlogsLanding({ section, categories, items }: LandingProps) {
  const writers = bloggers(items);
  const posts = items.slice(0, 8);

  return (
    <div>
      <SectionIntro section={section} />
      {!items.length ? (
        <LandingEmpty section={section} />
      ) : (
        <>
          {writers.length > 1 && (
            <section aria-labelledby="bloggers" className="container-page flex flex-col gap-6 pt-12">
              <SectionHeader id="bloggers" title="Featured bloggers" />
              <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
                {writers.map((w, i) => (
                  <li key={w.name} className={cn('group relative flex flex-col items-center gap-2 rounded-[12px] px-4 py-6 text-center', i % 2 ? 'bg-green-soft' : 'bg-lime-soft')}>
                    <Avatar name={w.name} size="lg" />
                    <h3 className="mt-1 font-serif text-[20px] font-semibold text-ink md:text-[22px]">
                      <Link to={articlePath(w.posts[0].slug)} className="after:absolute after:inset-0 hover:text-green-700">
                        {w.name}
                      </Link>
                    </h3>
                    <p className="text-meta text-ink-muted">
                      {w.posts.length} recent {w.posts.length === 1 ? 'post' : 'posts'}
                    </p>
                    {w.posts[0].categoryName && <Tag className="bg-surface/70">{w.posts[0].categoryName}</Tag>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="container-page grid gap-12 py-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16">
            <section aria-labelledby="latest-posts">
              <SectionHeader id="latest-posts" title="Latest posts" />
              <ul>
                {posts.map((s) => (
                  <li key={s.id}>
                    <PostRow story={s} />
                  </li>
                ))}
              </ul>
            </section>
            <div className="flex flex-col gap-8">
              {categories.length > 1 && (
                <section aria-labelledby="topics" className="flex flex-col gap-4">
                  <SectionHeader id="topics" title="Topics" size="m" />
                  <ul className="flex flex-wrap gap-2">
                    {categories.map((c) => (
                      <li key={c.slug}>
                        <Link to={categoryHref(section.slug, c.slug)} className="inline-flex h-8 items-center rounded-full border border-line bg-surface px-3 text-[14px] font-medium text-ink hover:border-green-700">
                          {c.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              <CtaCard tone="dark" eyebrow="Write with us" title="Start your own Amaranth blog" body="Pitch a regular column about anything you know well. Editors will help you get started." to="/submit" label="Pitch a blog" />
            </div>
          </div>
          <SeeAll section={section} label="Every post" />
        </>
      )}
    </div>
  );
}
