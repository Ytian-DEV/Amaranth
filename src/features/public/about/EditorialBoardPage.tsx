import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { SectionHeader } from '@/components/story/Story';
import { ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Img } from '@/components/ui/Img';
import { groupLabels, groups } from '@/features/cms/people/labels';
import type { MediaVariant, TeamRoleGroup } from '@/lib/database.types';
import type { ImageSource } from '@/lib/media';
import { getSupabase, unwrap } from '@/lib/supabase';
import { useDocumentTitle } from '@/lib/useDocumentTitle';
import { PageHeader } from '../PageHeader';

export type BoardPerson = { id: string; name: string; position: string; group: TeamRoleGroup; photo: ImageSource | null };
export type BoardData = { terms: { label: string; is_current: boolean }[]; term: string | null; people: BoardPerson[] };

type Asset = { bucket: string; path: string; width: number | null; height: number | null; variants: MediaVariant[] } | null;

async function fetchBoard(label: string | null): Promise<BoardData> {
  const supabase = getSupabase();
  const terms = unwrap(await supabase.from('team_terms').select('id, label, is_current').order('starts_on', { ascending: false }));
  const term = terms.find((t) => t.label === label) ?? terms.find((t) => t.is_current) ?? terms[0];
  if (!term) return { terms: [], term: null, people: [] };
  const rows = unwrap(
    await supabase
      .from('team_members')
      .select('id, role_group, position_title, display_name, sort_order, photo:media_assets(bucket, path, width, height, variants), contributor:contributors(name, avatar:media_assets(bucket, path, width, height, variants))')
      .eq('term_id', term.id)
      .order('sort_order'),
  ) as unknown as {
    id: string;
    role_group: TeamRoleGroup;
    position_title: string;
    display_name: string | null;
    photo: Asset;
    contributor: { name: string; avatar: Asset } | null;
  }[];
  return {
    terms: terms.map((t) => ({ label: t.label, is_current: t.is_current })),
    term: term.label,
    people: rows.map((r) => {
      const a = r.photo ?? r.contributor?.avatar ?? null;
      return {
        id: r.id,
        name: r.contributor?.name ?? r.display_name ?? '',
        position: r.position_title,
        group: r.role_group,
        photo: a ? { bucket: a.bucket, path: a.path, width: a.width, height: a.height, variants: a.variants } : null,
      };
    }),
  };
}

function PersonCard({ person }: { person: BoardPerson }) {
  return (
    <figure className="flex flex-col gap-3">
      <Img {...person.photo} alt={person.name} ratio="4/5" sizes="(min-width: 1024px) 270px, 45vw" />
      <figcaption>
        <p className="font-serif text-headline-s text-ink">{person.name}</p>
        <p className="text-kicker uppercase text-green-500-text">{person.position}</p>
      </figcaption>
    </figure>
  );
}

export function EditorialBoardView({ data }: { data: BoardData }) {
  return (
    <div className="pb-16">
      <PageHeader
        title="Editorial Board"
        intro={
          <>
            The students and advisers who run Amaranth{data.term ? `, ${data.term}` : ''}. Want to join?{' '}
            <Link to="/contact" className="text-green-700 underline">
              Get in touch
            </Link>
            .
          </>
        }
      >
        {data.terms.length > 1 && (
          <nav aria-label="Past boards" className="mt-2 flex flex-wrap gap-2">
            {data.terms.map((t) => (
              <Link
                key={t.label}
                to={t.is_current ? '/editorial-board' : `/editorial-board?term=${encodeURIComponent(t.label)}`}
                aria-current={t.label === data.term ? 'page' : undefined}
                className={
                  t.label === data.term
                    ? 'inline-flex h-9 items-center rounded-full bg-green-700 px-4 text-[14px] font-semibold text-on-dark'
                    : 'inline-flex h-9 items-center rounded-full border border-line px-4 text-[14px] font-semibold text-ink hover:border-green-700'
                }
              >
                {t.label}
              </Link>
            ))}
          </nav>
        )}
      </PageHeader>
      <div className="container-page flex flex-col gap-14 pt-10 md:pt-14">
        {data.people.length === 0 && <p className="text-body-l text-ink-muted">The board for this term hasn’t been announced yet.</p>}
        {groups.map((g) => {
          const people = data.people.filter((p) => p.group === g);
          if (!people.length) return null;
          return (
            <section key={g} aria-labelledby={`board-${g}`}>
              <SectionHeader id={`board-${g}`} title={groupLabels[g]} />
              <ul className="mt-7 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
                {people.map((p) => (
                  <li key={p.id}>
                    <PersonCard person={p} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export function EditorialBoardPage() {
  useDocumentTitle('Editorial Board');
  const [params] = useSearchParams();
  const term = params.get('term');
  const board = useQuery({ queryKey: ['board', term], staleTime: 30 * 60_000, queryFn: () => fetchBoard(term) });
  if (board.isPending) {
    return (
      <div className="container-page grid grid-cols-2 gap-6 py-16 md:grid-cols-4" aria-busy>
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="aspect-[4/5]" />
        ))}
      </div>
    );
  }
  if (board.error) {
    return (
      <div className="container-page py-16">
        <h1 className="sr-only">Editorial Board</h1>
        <ErrorState error={board.error} onRetry={() => void board.refetch()} />
      </div>
    );
  }
  return <EditorialBoardView data={board.data} />;
}
