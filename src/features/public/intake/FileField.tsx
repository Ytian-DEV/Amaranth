import { Paperclip, X } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { formatBytes } from '@/lib/images';
import { ACCEPT_ATTR, fileProblem, MAX_FILES } from './uploads';

/** Multi-file picker with validation and a removable list. */
export function FileField({
  label,
  hint,
  files,
  onChange,
}: {
  label: string;
  hint?: string;
  files: File[];
  onChange: (files: File[]) => void;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [problem, setProblem] = useState<string | null>(null);

  function add(list: FileList | null) {
    if (!list) return;
    const incoming = [...list];
    const bad = incoming.map(fileProblem).find(Boolean) ?? null;
    const ok = incoming.filter((f) => !fileProblem(f));
    const next = [...files, ...ok].slice(0, MAX_FILES);
    setProblem(bad ?? (files.length + ok.length > MAX_FILES ? `Attach at most ${MAX_FILES} files.` : null));
    onChange(next);
    if (input.current) input.current.value = '';
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span id={`${id}-label`} className="text-[14px] font-semibold text-ink">
        {label}
      </span>
      <label
        htmlFor={id}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          add(e.dataTransfer.files);
        }}
        className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed border-line bg-surface px-4 py-6 text-center hover:border-lime"
      >
        <Paperclip className="size-5 text-green-700" aria-hidden />
        <span className="text-button text-green-700">Choose files</span>
        <span className="text-meta font-normal text-ink-muted">or drop them here</span>
        <input
          ref={input}
          id={id}
          type="file"
          multiple
          accept={ACCEPT_ATTR}
          aria-labelledby={`${id}-label`}
          aria-describedby={`${id}-hint`}
          className="sr-only"
          onChange={(e) => add(e.target.files)}
        />
      </label>
      <p id={`${id}-hint`} className="text-meta font-normal text-ink-muted">
        {hint ?? `Up to ${MAX_FILES} files, 20 MB each. JPG, PNG, WebP, PDF, Word or text.`}
      </p>
      {problem && (
        <p role="alert" className="text-meta text-alert">
          {problem}
        </p>
      )}
      {files.length > 0 && (
        <ul className="mt-1 flex flex-col gap-1.5">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-3 rounded-md bg-green-soft px-3 py-2 text-[14px]">
              <span className="min-w-0 truncate">{f.name}</span>
              <span className="flex shrink-0 items-center gap-2 text-meta text-ink-muted">
                {formatBytes(f.size)}
                <button
                  type="button"
                  onClick={() => onChange(files.filter((_, j) => j !== i))}
                  className="grid size-7 place-items-center rounded-md hover:bg-surface"
                  aria-label={`Remove ${f.name}`}
                >
                  <X className="size-4" aria-hidden />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
