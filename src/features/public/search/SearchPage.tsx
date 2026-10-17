import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { parsePage } from '@/components/ui/pageWindow';
import { useDebounced } from '@/lib/useDebounced';
import { useDocumentTitle } from '@/lib/useDocumentTitle';
import { useNavSections } from '../nav';
import { SearchView } from './SearchView';
import { useSearch, type SearchFilters } from './searchData';

const keys = ['q', 'section', 'from', 'to', 'tag', 'page'] as const;

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const filters: SearchFilters = useMemo(
    () => ({
      q: params.get('q') ?? '',
      section: params.get('section'),
      from: params.get('from'),
      to: params.get('to'),
      tag: params.get('tag'),
      page: parsePage(params.get('page')),
    }),
    [params],
  );
  const [draft, setDraft] = useState(filters.q);
  const debounced = useDebounced(draft, 400);
  const { all } = useNavSections();
  const search = useSearch(filters);
  useDocumentTitle(filters.q ? `Search: ${filters.q}` : filters.tag ? `#${filters.tag}` : 'Search');

  function update(patch: Partial<SearchFilters>) {
    const next = { ...filters, ...patch };
    const out = new URLSearchParams();
    for (const key of keys) {
      const value = next[key];
      if (key === 'page' ? value !== 1 : value) out.set(key, String(value));
    }
    setParams(out, { replace: true });
  }

  // typing searches after a pause (and drops any tag filter)
  useEffect(() => {
    if (debounced.trim() !== filters.q.trim()) update({ q: debounced.trim(), tag: debounced.trim() ? null : filters.tag, page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  // back/forward or a tag link changes q from outside
  useEffect(() => setDraft(filters.q), [filters.q]);

  return (
    <SearchView
      draft={draft}
      onDraftChange={setDraft}
      onSubmit={() => update({ q: draft.trim(), tag: null, page: 1 })}
      filters={filters}
      onFilter={(patch) => {
        if ('q' in patch) setDraft(patch.q ?? '');
        update(patch);
      }}
      sections={all}
      result={search.data}
      loading={search.isPending && search.fetchStatus !== 'idle'}
      fetching={search.isFetching}
      error={search.error}
      onRetry={() => void search.refetch()}
    />
  );
}
