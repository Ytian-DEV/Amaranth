import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { getSupabase, unwrap } from '@/lib/supabase';
import { addMissingSizes, missingWidths } from './uploadMedia';

/**
 * Editors: images uploaded before the 320/960px sizes existed (or without any sizes) make phones
 * download bigger files than they need. This makes the missing sizes, one image at a time, in the browser.
 */
export function OptimiseImages() {
  const client = useQueryClient();
  const [run, setRun] = useState<{ done: number; failed: number; total: number } | null>(null);
  const pending = useQuery({
    queryKey: ['media', 'missing-sizes'],
    staleTime: 5 * 60_000,
    queryFn: async () =>
      unwrap(await getSupabase().from('media_assets').select('id, bucket, path, kind, mime_type, width, variants').eq('kind', 'image')).filter((a) => missingWidths(a).length > 0),
  });

  const list = pending.data ?? [];
  const busy = run !== null && run.done + run.failed < run.total;
  if (!list.length && !run) return null;

  const start = async () => {
    const todo = list;
    const state = { done: 0, failed: 0, total: todo.length };
    setRun({ ...state });
    for (const asset of todo) {
      try {
        await addMissingSizes(asset);
        state.done += 1;
      } catch {
        state.failed += 1;
      }
      setRun({ ...state });
    }
    await client.invalidateQueries({ queryKey: ['media'] });
  };

  return (
    <aside className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-lime-soft px-4 py-3 text-[14px]" aria-live="polite">
      {run && !busy ? (
        <p>
          Made web sizes for {run.done} {run.done === 1 ? 'image' : 'images'}
          {run.failed ? `; ${run.failed} couldn’t be processed (try again later)` : ''}.
        </p>
      ) : busy ? (
        <p>
          Making web sizes… {run.done + run.failed} of {run.total}. Keep this tab open.
        </p>
      ) : (
        <p>
          <strong>{list.length}</strong> older {list.length === 1 ? 'image is' : 'images are'} missing small sizes, so phones download bigger files than they need.
        </p>
      )}
      {!run && (
        <Button size="sm" onClick={() => void start()}>
          Make web sizes
        </Button>
      )}
    </aside>
  );
}
