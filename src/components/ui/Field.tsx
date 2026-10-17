import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/cn';

const control =
  'w-full rounded-[8px] border border-line bg-surface px-3.5 text-body-m text-ink placeholder:text-ink-muted ' +
  'transition-colors hover:border-ink-muted focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-soft ' +
  'disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-alert';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...rest },
  ref,
) {
  return <input ref={ref} className={cn(control, 'h-11', className)} {...rest} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return <textarea ref={ref} className={cn(control, 'min-h-28 py-2.5', className)} {...rest} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...rest },
  ref,
) {
  return (
    <div className={cn('relative', className)}>
      <select ref={ref} className={cn(control, 'h-11 appearance-none pr-9')} {...rest}>
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
      >
        <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  );
});

type FieldProps = {
  label: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
  /** Receives the ids to wire the control: <Input id={id} aria-describedby={describedBy} aria-invalid={invalid} /> */
  children: (ids: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
};

/** Label + control + hint/error with the aria wiring done. */
export function Field({ label, hint, error, required, className, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-[14px] font-semibold text-ink">
        {label}
        {required && (
          <span className="text-alert" aria-hidden>
            {' '}
            *
          </span>
        )}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && !error && (
        <p id={hintId} className="text-meta font-normal text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-meta text-alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function Checkbox({ label, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return (
    <label className={cn('inline-flex cursor-pointer items-center gap-2 text-body-m', className)}>
      <input type="checkbox" className="size-4 accent-green-700" {...rest} />
      {label}
    </label>
  );
}
