import { Pencil, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { Img } from '@/components/ui/Img';
import type { MediaAssetRow } from '@/lib/database.types';
import { MediaPickerDialog } from '../../media/MediaLibraryPage';

export function SlugInput({ value, onChange, hint = 'Used in web addresses. Lowercase letters, numbers and dashes.' }: { value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <Field label="Web name (slug)" required hint={hint}>
      {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} value={value} onChange={(e) => onChange(e.target.value.toLowerCase())} pattern="[a-z0-9]+(-[a-z0-9]+)*" />}
    </Field>
  );
}

export function RowActions({ label, onEdit, onDelete }: { label: string; onEdit: () => void; onDelete?: () => void }) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button type="button" onClick={onEdit} className="grid size-9 place-items-center rounded-md text-ink-muted hover:bg-paper hover:text-ink" aria-label={`Edit ${label}`}>
        <Pencil className="size-4" aria-hidden />
      </button>
      {onDelete && (
        <button type="button" onClick={onDelete} className="grid size-9 place-items-center rounded-md text-ink-muted hover:bg-alert-soft hover:text-alert" aria-label={`Delete ${label}`}>
          <Trash2 className="size-4" aria-hidden />
        </button>
      )}
    </div>
  );
}

/** Image chooser backed by the media library (upload or pick). */
export function ImagePick({ label, asset, onChange, round }: { label: string; asset: MediaAssetRow | null; onChange: (a: MediaAssetRow | null) => void; round?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[14px] font-semibold">{label}</span>
      <div className="flex flex-wrap items-center gap-3">
        {asset && (
          <Img bucket={asset.bucket} path={asset.path} variants={asset.variants} width={asset.width} alt="" ratio="1/1" sizes="64px" rounded={false} className={round ? 'size-16 rounded-full' : 'size-16 rounded-md'} />
        )}
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          {asset ? 'Change' : 'Choose image'}
        </Button>
        {asset && (
          <Button size="sm" variant="ghost" onClick={() => onChange(null)}>
            Remove
          </Button>
        )}
      </div>
      <MediaPickerDialog open={open} onClose={() => setOpen(false)} onPick={(a) => onChange(a)} />
    </div>
  );
}

export function SetupNote({ children }: { children: ReactNode }) {
  return <p className="text-meta font-normal text-ink-muted">{children}</p>;
}
