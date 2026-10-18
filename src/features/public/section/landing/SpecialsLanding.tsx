import { Link } from 'react-router-dom';
import { SectionHeader } from '@/components/story/Story';
import { articlePath, type StoryItem } from '@/components/story/types';
import { ButtonLink } from '@/components/ui/Button';
import { Img } from '@/components/ui/Img';
import { cn } from '@/lib/cn';
import { formatShortDate } from '@/lib/format';
import { LandingEmpty, SeeAll, YearList, type LandingProps } from './blocks';
import { picker } from './data';
import { categoryHref } from './links';

type Tile = { to: string; eyebrow: string; title: string; body: string };
// middle tile is light so every text colour keeps AA contrast
const tileTone = [
  { bg: 'bg-green-700 text-on-dark', eyebrow: 'text-lime', body: 'text-on-dark-muted' },
  { bg: 'bg-lime text-green-900', eyebrow: 'text-green-900', body: 'text-green-900' },
  { bg: 'bg-green-900 text-on-dark', eyebrow: 'text-lime', body: 'text-on-dark-muted' },
];

function CoverageTile({ tile, i }: { tile: Tile; i: number }) {
  return (
    <li className={cn('group relative flex min-h-[220px] flex-col justify-end gap-2 rounded-[12px] p-6 md:min-h-[280px]', tileTone[i % 3].bg)}>
      <p className={cn('text-kicker uppercase', tileTone[i % 3].eyebrow)}>{tile.eyebrow}</p>
      <h3 className="font-serif text-[26px] font-bold leading-tight">
        <Link to={tile.to} className="after:absolute after:inset-0 hover:underline">
          {tile.title}
        </Link>
      </h3>
      <p className={cn('text-body-m', tileTone[i % 3].body)}>{tile.body}</p>
      <span className="text-button" aria-hidden>
        Open →
      </span>
    </li>
  );
}

/** /specials (Figma 34:554): special report hero with its parts, more coverage tiles, archive by year. */
export function SpecialsLanding({ section, categories, items }: LandingProps) {
  const pick = picker(items);
  const lead = pick.next(1)[0];
  // the other parts of the lead's series: same category, oldest first
  const parts = lead ? pick.nextWhere((s) => s.category === lead.category, 2).reverse() : [];
  const archive = pick.next(8);

  const tiles: Tile[] = [
    ...categories.slice(0, 2).map((c) => ({ to: categoryHref(section.slug, c.slug), eyebrow: section.name, title: c.name, body: `Every ${c.name.toLowerCase()} special from the newsroom.` })),
    { to: '/salingkusog', eyebrow: 'Salingkusog', title: 'Salingkusog 2026 Hub', body: 'Medal tally, schedules and results from the intramurals.' },
  ];

  return (
    <div>
      <header className="bg-green-900 text-on-dark">
        <div className="container-page flex flex-col gap-8 py-12 md:py-16">
          {lead ? (
            <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
              <div className="flex flex-col gap-4">
                <p className="text-kicker uppercase text-lime">
                  Special report{lead.categoryName ? ` · ${lead.categoryName}` : ''}
                  {parts.length ? ` · ${parts.length + 1}-part series` : ''}
                </p>
                <h1 className="font-serif text-[40px] font-bold leading-[1.02] tracking-[-1px] md:text-[64px]">
                  <Link to={articlePath(lead.slug)} className="hover:underline">
                    {lead.title}
                  </Link>
                </h1>
                {lead.excerpt && <p className="max-w-[560px] text-body-m text-on-dark-muted md:text-body-l">{lead.excerpt}</p>}
                <ButtonLink to={articlePath((parts[0] ?? lead).slug)} variant="accent" className="self-start">
                  {parts.length ? 'Start with part 1' : 'Read the report'}
                </ButtonLink>
              </div>
              <Img {...lead.image} ratio="560/400" priority sizes="(min-width: 768px) 560px, 100vw" className="rounded-[12px] bg-green-800" />
            </div>
          ) : (
            <h1 className="font-serif text-[44px] font-bold md:text-[64px]">{section.name}</h1>
          )}
          {parts.length > 0 && lead && (
            <ol className="grid gap-3 md:grid-cols-3 md:gap-4">
              {[...parts, lead].slice(0, 3).map((s: StoryItem, i) => (
                <li key={s.id} className="group relative flex flex-col gap-1.5 rounded-[10px] bg-green-800 p-5">
                  <p className="text-kicker uppercase text-lime">Part {i + 1}</p>
                  <Link to={articlePath(s.slug)} className="font-serif text-[18px] font-semibold leading-snug after:absolute after:inset-0 hover:underline">
                    {s.title}
                  </Link>
                  <p className="text-meta text-on-dark-muted">Published {formatShortDate(s.publishedAt)}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </header>

      {!lead && <LandingEmpty section={section} />}

      <section aria-labelledby="more-coverage" className="container-page flex flex-col gap-6 py-12">
        <SectionHeader id="more-coverage" title="More special coverage" />
        <ul className="grid gap-4 md:grid-cols-3">
          {tiles.map((t, i) => (
            <CoverageTile key={t.to} tile={t} i={i} />
          ))}
        </ul>
      </section>

      {archive.length > 0 && (
        <section aria-labelledby="special-archive" className="container-page flex flex-col gap-2 pb-6">
          <SectionHeader id="special-archive" title="Special issue archive" />
          <YearList items={archive} />
        </section>
      )}
      {lead && <SeeAll section={section} label="Every special" />}
    </div>
  );
}
