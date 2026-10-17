import { Check, UploadCloud } from 'lucide-react';
import { useRef, useState } from 'react';
import { Img } from '@/components/ui/Img';
import type { MediaAssetRow } from '@/lib/database.types';
import { cn } from '@/lib/cn';
import { MEDIA_ACCEPT, mediaProblem } from './uploadMedia';

/** Image tiles; the selected one gets a ring. */
export function MediaGrid({
  items,
  selectedId,
  onSelect,
  loading,
}: {
  items: MediaAssetRow[];
  selectedId?: string | null;
  onSelect: (asset: MediaAssetRow) => void;
  loading?: boolean;
}) {
  return (
    <ul className={cn('grid content-start grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6', loading && 'opacity-60')}>
      {items.map((a) => {
        const selected = a.id === selectedId;
        return (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => onSelect(a)}
              aria-pressed={selected}
              className={cn(
                'group relative block w-full overflow-hidden rounded-md text-left outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-green-700',
                selected && 'ring-2 ring-green-700',
              )}
            >
              <Img bucket={a.bucket} path={a.path} width={a.width} height={a.height} variants={a.variants} alt={a.alt_text} ratio="1/1" sizes="200px" rounded={false} />
              <span className="sr-only">{a.alt_text || 'Image without alt text'}</span>
              {!a.alt_text && (
                <span className="absolute left-1.5 top-1.5 rounded-sm bg-alert px-1.5 py-0.5 text-[10px] font-bold uppercase text-on-dark">No alt</span>
              )}
              {selected && (
                <span className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-green-700 text-on-dark">
                  <Check className="size-4" aria-hidden />
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** Drop zone that uploads several images one after another. */
export function MediaUploader({ onFiles, busy, progress }: { onFiles: (files: File[]) => void; busy: boolean; progress?: string | null }) {
  const input = useRef<HTMLInputElement>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [over, setOver] = useState(false);

  function take(list: FileList | null) {
    if (!list?.length) return;
    const files = [...list];
    const bad = files.map(mediaProblem).find(Boolean) ?? null;
    setProblem(bad);
    const ok = files.filter((f) => !mediaProblem(f));
    if (ok.length) onFiles(ok);
    if (input.current) input.current.value = '';
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          take(e.dataTransfer.files);
        }}
        className={cn(
          'flex w-full flex-col items-center gap-1.5 rounded-[12px] border-2 border-dashed px-4 py-7 text-center transition-colors disabled:opacity-60',
          over ? 'border-green-700 bg-green-soft' : 'border-line bg-surface hover:border-green-700',
        )}
      >
        <UploadCloud className="size-7 text-green-700" aria-hidden />
        <span className="text-button text-green-700">{busy ? (progress ?? 'Uploading…') : 'Upload images'}</span>
        <span className="text-meta font-normal text-ink-muted">Drop files here. Photos are resized and converted to WebP automatically.</span>
      </button>
      {problem && (
        <p role="alert" className="text-meta text-alert">
          {problem}
        </p>
      )}
      <input ref={input} type="file" accept={MEDIA_ACCEPT} multiple className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => take(e.target.files)} />
    </div>
  );
}
