import { ImagePlus, Trash2, X } from 'lucide-react';
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { Img } from '@/components/ui/Img';
import type { MediaAssetRow } from '@/lib/database.types';
import { cn } from '@/lib/cn';
import { slugify } from '@/lib/slug';
import type { CategoryOption, ContributorOption, DraftAuthor, DraftTag } from '../api';

/** Collapsible-free sidebar panel. */
export function Panel({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={cn('flex flex-col gap-3 rounded-[12px] border border-line bg-surface p-4', className)}>
      <h2 id={id} className="text-kicker uppercase text-ink-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function Label({ htmlFor, children, hint }: { htmlFor: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="flex items-baseline justify-between gap-2 text-[13px] font-semibold text-ink">
      {children}
      {hint && <span className="font-normal text-ink-muted">{hint}</span>}
    </label>
  );
}

export function CategorySelect({
  value,
  options,
  canUseReserved,
  disabled,
  onChange,
}: {
  value: string;
  options: CategoryOption[];
  canUseReserved: boolean;
  disabled?: boolean;
  onChange: (id: string) => void;
}) {
  const id = useId();
  const groups = new Map<string, CategoryOption[]>();
  for (const o of options) groups.set(o.sectionName, [...(groups.get(o.sectionName) ?? []), o]);
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>Section & category</Label>
      <Select id={id} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} aria-required>
        <option value="" disabled>
          Choose a category…
        </option>
        {[...groups.entries()].map(([section, list]) => (
          <optgroup key={section} label={section}>
            {list.map((o) => (
              <option key={o.id} value={o.id} disabled={!o.assignable && !canUseReserved}>
                {o.name}
                {!o.assignable ? ' (editors)' : ''}
              </option>
            ))}
          </optgroup>
        ))}
      </Select>
    </div>
  );
}

export function AuthorsField({
  value,
  options,
  disabled,
  onChange,
}: {
  value: DraftAuthor[];
  options: ContributorOption[];
  disabled?: boolean;
  onChange: (authors: DraftAuthor[]) => void;
}) {
  const id = useId();
  const available = options.filter((o) => !value.some((a) => a.contributorId === o.id));
  return (
    <div className="flex flex-col gap-2">
      {value.length > 0 && (
        <ul className="flex flex-col gap-2">
          {value.map((a, i) => (
            <li key={a.contributorId} className="flex items-center gap-2 rounded-md bg-paper p-2">
              <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">{a.name}</span>
              <input
                aria-label={`Credit for ${a.name}`}
                value={a.credit}
                disabled={disabled}
                onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, credit: e.target.value } : x)))}
                className="h-8 w-24 rounded-md border border-line bg-surface px-2 text-meta"
              />
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                className="grid size-8 place-items-center rounded-md text-ink-muted hover:bg-surface hover:text-alert"
                aria-label={`Remove ${a.name}`}
              >
                <X className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      <Label htmlFor={id}>Add author</Label>
      <Select
        id={id}
        value=""
        disabled={disabled || available.length === 0}
        onChange={(e) => {
          const c = options.find((o) => o.id === e.target.value);
          if (c) onChange([...value, { contributorId: c.id, name: c.name, credit: 'Author' }]);
        }}
      >
        <option value="">{available.length ? 'Choose a contributor…' : 'Everyone is credited'}</option>
        {available.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </Select>
    </div>
  );
}

export function TagsField({ value, disabled, onChange }: { value: DraftTag[]; disabled?: boolean; onChange: (tags: DraftTag[]) => void }) {
  const id = useId();
  const [text, setText] = useState('');
  function add() {
    const name = text.trim().replace(/^#/, '');
    const slug = slugify(name);
    if (!slug || value.some((t) => t.slug === slug)) return setText('');
    onChange([...value, { slug, name }]);
    setText('');
  }
  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add();
    } else if (e.key === 'Backspace' && !text && value.length) {
      onChange(value.slice(0, -1));
    }
  }
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} hint="Enter to add">
        Tags
      </Label>
      <div className="flex flex-wrap gap-1.5 rounded-[8px] border border-line bg-surface p-1.5 focus-within:border-green-700">
        {value.map((t) => (
          <span key={t.slug} className="inline-flex items-center gap-1 rounded-full bg-green-soft py-1 pl-2.5 pr-1 text-[13px] font-semibold text-green-700">
            #{t.name}
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(value.filter((x) => x.slug !== t.slug))}
              className="grid size-5 place-items-center rounded-full hover:bg-surface"
              aria-label={`Remove tag ${t.name}`}
            >
              <X className="size-3" aria-hidden />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={text}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          onBlur={add}
          placeholder={value.length ? '' : 'environment, research…'}
          className="h-8 min-w-24 flex-1 bg-transparent px-1.5 text-[14px] outline-none"
        />
      </div>
    </div>
  );
}

export function CoverField({
  cover,
  caption,
  disabled,
  onUpload,
  onRemove,
  onCaption,
  onAlt,
}: {
  cover: MediaAssetRow | null;
  caption: string;
  disabled?: boolean;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => void;
  onCaption: (v: string) => void;
  onAlt: (v: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const captionId = useId();
  const altId = useId();

  async function pick(file?: File) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      await onUpload(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {cover ? (
        <>
          <Img bucket={cover.bucket} path={cover.path} width={cover.width} height={cover.height} alt={cover.alt_text} variants={cover.variants} sizes="320px" />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={disabled || busy} onClick={() => input.current?.click()}>
              Replace
            </Button>
            <Button size="sm" variant="ghost" disabled={disabled} onClick={onRemove} icon={<Trash2 className="size-4" aria-hidden />}>
              Remove
            </Button>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={altId} hint={cover.alt_text ? undefined : 'Required'}>
              Alt text
            </Label>
            <Input id={altId} value={cover.alt_text} disabled={disabled} onChange={(e) => onAlt(e.target.value)} placeholder="What the photo shows" />
          </div>
        </>
      ) : (
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => input.current?.click()}
          className="flex aspect-video flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-line text-green-700 hover:border-green-700 disabled:opacity-50"
        >
          <ImagePlus className="size-6" aria-hidden />
          <span className="text-button">{busy ? 'Uploading…' : 'Upload cover photo'}</span>
        </button>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={captionId}>Caption</Label>
        <Textarea id={captionId} rows={2} className="min-h-16" value={caption} disabled={disabled} onChange={(e) => onCaption(e.target.value)} />
      </div>
      {error && (
        <p role="alert" className="text-meta text-alert">
          {error}
        </p>
      )}
      <input ref={input} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => void pick(e.target.files?.[0])} />
    </div>
  );
}

export function SeoFields({
  title,
  description,
  slug,
  fallbackTitle,
  fallbackDescription,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  slug: string;
  fallbackTitle: string;
  fallbackDescription: string;
  disabled?: boolean;
  onChange: (patch: { seoTitle?: string; seoDescription?: string; slug?: string }) => void;
}) {
  const t = useId();
  const d = useId();
  const s = useId();
  const shownTitle = title || fallbackTitle || 'Article title';
  const shownDesc = description || fallbackDescription;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={s}>URL slug</Label>
        <Input id={s} value={slug} disabled={disabled} placeholder="made from the title" onChange={(e) => onChange({ slug: e.target.value })} onBlur={(e) => onChange({ slug: slugify(e.target.value) })} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={t} hint={`${(title || fallbackTitle).length}/60`}>
          Search title
        </Label>
        <Input id={t} value={title} disabled={disabled} placeholder={fallbackTitle} onChange={(e) => onChange({ seoTitle: e.target.value })} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={d} hint={`${(description || fallbackDescription).length}/160`}>
          Search description
        </Label>
        <Textarea id={d} rows={3} className="min-h-20" value={description} disabled={disabled} placeholder={fallbackDescription} onChange={(e) => onChange({ seoDescription: e.target.value })} />
      </div>
      <div className="rounded-md bg-paper p-3" aria-label="Search result preview">
        <p className="truncate text-meta font-normal text-ink-muted">amaranth · article › {slug || slugify(fallbackTitle) || '…'}</p>
        <p className="truncate font-sans text-[16px] text-status-scheduled">{shownTitle.slice(0, 70)}</p>
        <p className="line-clamp-2 text-meta font-normal text-ink-muted">{shownDesc.slice(0, 170)}</p>
      </div>
    </div>
  );
}
