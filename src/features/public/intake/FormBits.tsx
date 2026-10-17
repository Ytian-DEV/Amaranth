import { CheckCircle2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

/** Off-screen field that only bots fill in. */
export function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden">
      <label>
        Website
        <input tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
    </div>
  );
}

export function SuccessPanel({ title, children, onAgain, againLabel }: { title: string; children: ReactNode; onAgain: () => void; againLabel: string }) {
  return (
    <div role="status" className="flex flex-col items-start gap-4 rounded-xl bg-green-soft p-6 md:p-8">
      <CheckCircle2 className="size-8 text-green-700" aria-hidden />
      <h2 className="font-serif text-headline-m text-green-900">{title}</h2>
      <div className="text-body-m text-ink">{children}</div>
      <Button variant="outline" onClick={onAgain}>
        {againLabel}
      </Button>
    </div>
  );
}
