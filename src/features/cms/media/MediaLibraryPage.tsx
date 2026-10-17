import { Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Checkbox, Input } from '@/components/ui/Field';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Pagination } from '@/components/ui/Pagination';
import { parsePage } from '@/components/ui/pageWindow';
import { useAuth } from '@/features/auth/AuthProvider';
import { isEditor } from '@/features/auth/permissions';
import type { MediaAssetRow } from '@/lib/database.types';
import { errorText } from '@/lib/errors';
import { useDebounced } from '@/lib/useDebounced';
import { useDocumentTitle } from '@/lib/useDocumentTitle';
import { useQueryClient } from '@tanstack/react-query';
import { CmsPageHeader } from '../ui';
import { MediaDetails } from './MediaDetails';
import { MediaGrid, MediaUploader } from './MediaGrid';
import { MEDIA_PAGE_SIZE, useDeleteMedia, useMediaList, useMediaUsage, useUpdateMedia, type MediaFilters } from './mediaApi';
import { uploadMediaImage } from './uploadMedia';

/** Upload queue shared by the library page and the picker. */
function useUploads(userId: string | undefined, onDone: (asset: MediaAssetRow) => void) {
  const client = useQueryClient();
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function upload(files: File[]) {
    if (!userId) return;
    setError(null);
    for (const [i, file] of files.entries()) {
      setProgress(`Uploading ${i + 1} of ${files.length}…`);
      try {
        onDone(await uploadMediaImage(file, userId));
      } catch (err) {
        setError(errorText(err) ?? `Couldn’t upload ${file.name}.`);
      }
    }
    setProgress(null);
    void client.invalidateQueries({ queryKey: ['media'] });
  }
  return { upload, progress, error };
}

function useMediaBrowser(initial: Partial<MediaFilters> = {}) {
  const { session } = useAuth();
  const [filters, setFilters] = useState<MediaFilters>({ q: '', mine: false, page: 1, ...initial });
  const [q, setQ] = useState(filters.q);
  const debounced = useDebounced(q);
  useEffect(() => setFilters((f) => (f.q === debounced ? f : { ...f, q: debounced, page: 1 })), [debounced]);
  const list = useMediaList(filters, session?.user.id);
  return { filters, setFilters, q, setQ, list, userId: session?.user.id };
}

function Toolbar({ q, setQ, mine, onMine }: { q: string; setQ: (v: string) => void; mine: boolean; onMine: (v: boolean) => void }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted" aria-hidden />
        <Input type="search" aria-label="Search images" placeholder="Search alt text, caption, credit…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
      </div>
      <Checkbox label="My uploads" checked={mine} onChange={(e) => onMine(e.target.checked)} />
    </div>
  );
}

export function MediaLibraryPage() {
  useDocumentTitle('Media library');
  const { profile } = useAuth();
  const [params, setParams] = useSearchParams();
  const page = parsePage(params.get('page'));
  const browser = useMediaBrowser({ page });
  const { filters, setFilters, list, userId } = browser;
  const [selected, setSelected] = useState<MediaAssetRow | null>(null);
  const usage = useMediaUsage(selected?.id);
  const update = useUpdateMedia();
  const del = useDeleteMedia();
  const uploads = useUploads(userId, (asset) => setSelected(asset));

  useEffect(() => setFilters((f) => (f.page === page ? f : { ...f, page })), [page, setFilters]);
  useEffect(() => {
    if (filters.page !== page) setParams(filters.page > 1 ? { page: String(filters.page) } : {}, { replace: true });
  }, [filters.page, page, setParams]);

  const canDelete = Boolean(selected && (selected.uploaded_by === userId || isEditor(profile?.role)));
  const total = list.data?.total ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <CmsPageHeader title="Media library" subtitle={list.data ? `${total} image${total === 1 ? '' : 's'}` : undefined} />
      <MediaUploader onFiles={(files) => void uploads.upload(files)} busy={Boolean(uploads.progress)} progress={uploads.progress} />
      {uploads.error && <p role="alert" className="text-meta text-alert">{uploads.error}</p>}
      <Toolbar q={browser.q} setQ={browser.setQ} mine={filters.mine} onMine={(mine) => setFilters((f) => ({ ...f, mine, page: 1 }))} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-6">
          {list.error ? (
            <ErrorState error={list.error} onRetry={() => void list.refetch()} />
          ) : !list.data ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {Array.from({ length: 12 }, (_, i) => (
                <Skeleton key={i} className="aspect-square" />
              ))}
            </div>
          ) : list.data.items.length === 0 ? (
            <EmptyState title={filters.q || filters.mine ? 'No images match' : 'No images yet'}>Upload photos above to use them in articles.</EmptyState>
          ) : (
            <MediaGrid items={list.data.items} selectedId={selected?.id} onSelect={setSelected} loading={list.isPlaceholderData} />
          )}
          <Pagination page={filters.page} pageCount={Math.max(1, Math.ceil(total / MEDIA_PAGE_SIZE))} />
        </div>
        <aside aria-label="Image details" className="rounded-[12px] border border-line bg-surface p-4 lg:sticky lg:top-6 lg:self-start">
          {selected ? (
            <MediaDetails
              asset={selected}
              usage={usage.data}
              canDelete={canDelete}
              onSave={async (p) => setSelected(await update.mutateAsync(p))}
              onDelete={async () => {
                await del.mutateAsync(selected);
                setSelected(null);
              }}
            />
          ) : (
            <p className="text-body-m text-ink-muted">Select an image to edit its alt text, caption and credit.</p>
          )}
        </aside>
      </div>
    </div>
  );
}

/** Modal picker used by the article editor. */
export function MediaPickerDialog({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (asset: MediaAssetRow) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const browser = useMediaBrowser();
  const { filters, setFilters, list, userId } = browser;
  const [selected, setSelected] = useState<MediaAssetRow | null>(null);
  const uploads = useUploads(userId, (asset) => setSelected(asset));
  const total = useMemo(() => list.data?.total ?? 0, [list.data]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="media-picker-title"
      className="m-auto w-[min(960px,calc(100vw-24px))] max-w-none rounded-[14px] bg-paper p-0 shadow-raised backdrop:bg-scrim"
    >
      <div className="flex max-h-[85dvh] flex-col">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id="media-picker-title" className="font-serif text-headline-m">
            Choose an image
          </h2>
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-md hover:bg-green-soft" aria-label="Close">
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="flex flex-col gap-4 overflow-y-auto p-5">
          <MediaUploader onFiles={(files) => void uploads.upload(files)} busy={Boolean(uploads.progress)} progress={uploads.progress} />
          <Toolbar q={browser.q} setQ={browser.setQ} mine={filters.mine} onMine={(mine) => setFilters((f) => ({ ...f, mine, page: 1 }))} />
          {list.error ? (
            <ErrorState error={list.error} onRetry={() => void list.refetch()} />
          ) : list.data?.items.length ? (
            <MediaGrid items={list.data.items} selectedId={selected?.id} onSelect={setSelected} loading={list.isPlaceholderData} />
          ) : (
            <p className="text-body-m text-ink-muted">{list.data ? 'No images yet.' : 'Loading…'}</p>
          )}
          {total > filters.page * MEDIA_PAGE_SIZE && (
            <Button variant="ghost" size="sm" className="self-center" onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>
              Older images →
            </Button>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-line px-5 py-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!selected}
            onClick={() => {
              if (selected) onPick(selected);
              onClose();
            }}
          >
            Use image
          </Button>
        </div>
      </div>
    </dialog>
  );
}
