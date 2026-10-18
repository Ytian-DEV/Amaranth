import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/** Category pill (Figma "Tag"). */
export function Tag({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm bg-green-soft px-2 py-1 font-sans text-kicker uppercase text-green-700',
        className,
      )}
      {...rest}
    />
  );
}

/** Uppercase section label above headlines ("NEWS · ENVIRONMENT"). */
export function Kicker({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('block font-sans text-kicker uppercase text-green-500-text', className)} {...rest} />;
}

/**
 * Lime category pill from the posts: "ENVIRONMENT NEWS" with the first word heavy.
 * Takes a story label ("News · Environment") and puts the specific part first.
 */
export function CategoryPill({ label, size = 'md', className }: { label: string; size?: 'sm' | 'md'; className?: string }) {
  const parts = label.split(' · ').map((p) => p.trim()).filter(Boolean);
  const [lead, rest] = parts.length > 1 ? [parts[parts.length - 1], parts[0]] : [parts[0], null];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-lime font-sans uppercase leading-none text-green-900',
        size === 'md' ? 'px-5 py-2.5 text-[15px]' : 'px-3.5 py-1.5 text-[12px]',
        className,
      )}
    >
      <span className="font-black">{lead}</span>
      {rest && <span className="font-medium">{rest}</span>}
    </span>
  );
}
