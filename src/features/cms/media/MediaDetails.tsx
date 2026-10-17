import { Copy, Trash2 } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Feedback';
import { Img } from '@/components/ui/Img';
import type { MediaAssetRow } from '@/lib/database.types';
import { errorText } from '@/lib/errors';
import { formatDate } from '@/lib/format';
import { formatBytes } from '@/lib/images';
import { publicUrl } from '@/lib/media';

/** Edit alt/caption/credit, copy the URL, delete when unused. */
export function MediaDetails({
  asset,
  usage,
  canDelete,
  onSave,
  onDelete,
}: {
  asset: MediaAssetRow;
  usage: number | undefined;
  canDelete: boolean;
  onSave: (patch: Pick<MediaAssetRow, 'id' | 'alt_text' | 'caption' | 'credit'>) => Promise<unknown>;
  onDelete: () => Promise<unknown>;
}) {
  const [alt, setAlt] = useState(asset.alt_text);
  const [caption, setCaption] = useState(asset.caption ?? '');
  const [credit, setCredit] = useState(asset.credit ?? '');
  const [state, setState] = useState<{ kind: 'idle' | 'saving' | 'saved' | 'error'; message?: string }>({ kind: 'idle' });
  const ids = { alt: useId(), caption: useId(), credit: useId() };
  const url = publicUrl(asset.bucket, asset.path) ?? '';

  useEffect(() => {
    setAlt(asset.alt_text);
    setCaption(asset.caption ?? '');
    setCredit(asset.credit ?? '');
    setState({ kind: 'idle' });
  }, [asset]);

  const dirty = alt !== asset.alt_text || caption !== (asset.caption ?? '') || credit !== (asset.credit ?? '');

  async function save() {
    setState({ kind: 'saving' });
    try {
      await onSave({ id: asset.id, alt_text: alt.trim(), caption: caption.trim() || null, credit: credit.trim() || null });
      setState({ kind: 'saved' });
    } catch (err) {
      setState({ kind: 'error', message: errorText(err) });
    }
  }

  async function remove() {
    if (!window.confirm('Delete this image permanently?')) return;
    try {
      await onDelete();
    } catch (err) {
      setState({ kind: 'error', message: errorText(err)?.includes('foreign key') ? 'This image is still in use.' : errorText(err) });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Img bucket={asset.bucket} path={asset.path} width={asset.width} height={asset.height} variants={asset.variants} alt={asset.alt_text} sizes="360px" />
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-meta">
        <dt className="text-ink-muted">Size</dt>
        <dd>
          {asset.width && asset.height ? `${asset.width}×${asset.height} · ` : ''}
          {formatBytes(asset.size_bytes)}
        </dd>
        <dt className="text-ink-muted">Uploaded</dt>
        <dd>{formatDate(asset.created_at)}</dd>
        <dt className="text-ink-muted">Used in</dt>
        <dd>{usage === undefined ? '…' : usage === 0 ? 'Nothing yet' : `${usage} place${usage === 1 ? '' : 's'}`}</dd>
      </dl>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={ids.alt} className="text-[13px] font-semibold">
          Alt text {!alt && <span className="font-normal text-alert">— needed for accessibility</span>}
        </label>
        <Textarea id={ids.alt} rows={2} className="min-h-16" value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Describe what the image shows" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={ids.caption} className="text-[13px] font-semibold">
          Caption
        </label>
        <Textarea id={ids.caption} rows={2} className="min-h-16" value={caption} onChange={(e) => setCaption(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={ids.credit} className="text-[13px] font-semibold">
          Credit
        </label>
        <Input id={ids.credit} value={credit} onChange={(e) => setCredit(e.target.value)} placeholder="Photo by …" />
      </div>
      {state.kind === 'error' && <Alert tone="error">{state.message ?? 'Something went wrong.'}</Alert>}
      {state.kind === 'saved' && !dirty && <Alert tone="success">Saved.</Alert>}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={!dirty} loading={state.kind === 'saving'} onClick={() => void save()}>
          Save details
        </Button>
        <Button size="sm" variant="outline" icon={<Copy className="size-4" aria-hidden />} onClick={() => void navigator.clipboard?.writeText(url)}>
          Copy URL
        </Button>
        {canDelete && (
          <Button
            size="sm"
            variant="ghost"
            className="text-alert"
            disabled={usage !== 0}
            title={usage ? 'Remove it from articles first' : undefined}
            icon={<Trash2 className="size-4" aria-hidden />}
            onClick={() => void remove()}
          >
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}
