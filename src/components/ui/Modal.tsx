import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Accessible modal on the native <dialog> (focus trap, Esc, backdrop). */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg';
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      // React passes a nested <dialog>'s close event up the tree (e.g. the media picker inside a form);
      // only react to this dialog closing, or the form closes and loses its changes
      onClose={(e) => e.target === e.currentTarget && onClose()}
      aria-labelledby={titleId}
      className={cn(
        'm-auto max-w-none rounded-[14px] bg-paper p-0 shadow-raised backdrop:bg-scrim',
        size === 'lg' ? 'w-[min(860px,calc(100vw-24px))]' : 'w-[min(560px,calc(100vw-24px))]',
      )}
    >
      {open && (
        <div className="flex max-h-[88dvh] flex-col">
          <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
            <h2 id={titleId} className="font-serif text-headline-m">
              {title}
            </h2>
            <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-md hover:bg-lime-soft" aria-label="Close">
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <div className="overflow-y-auto p-5">{children}</div>
          {footer && <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line px-5 py-3">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}
