import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { Alert, Skeleton } from '@/components/ui/Feedback';
import type { Json } from '@/lib/database.types';
import { errorText } from '@/lib/errors';
import { formatShortDate } from '@/lib/format';
import { useDebounced } from '@/lib/useDebounced';
import { Card, CardHeader } from '../ui';
import { searchLiveArticles, useHomeSlots, useSaveSetting, useSaveSlot, useSetting, type SlotWithTitle } from './settingsApi';

type Ticker = { mode: 'latest' | 'manual'; count: number; items: { text: string; href?: string }[] };

function ArticlePicker({ label, value, section, onPick }: { label: string; value: string | null; section?: string; onPick: (a: { id: string; title: string } | null) => void }) {
  const [q, setQ] = useState('');
  const debounced = useDebounced(q, 300);
  const [results, setResults] = useState<{ id: string; title: string; section_name: string; published_at: string | null }[]>([]);
  useEffect(() => {
    let live = true;
    void searchLiveArticles(debounced, section).then((r) => live && setResults(r)).catch(() => live && setResults([]));
    return () => {
      live = false;
    };
  }, [debounced, section]);
  return (
    <div className="flex flex-col gap-2">
      <Field label={label}>
        {({ id }) => <Input id={id} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={value ? `Current: ${value}` : 'Search published articles…'} />}
      </Field>
      <ul className="flex max-h-56 flex-col overflow-y-auto rounded-md border border-line bg-surface">
        <li>
          <button type="button" onClick={() => onPick(null)} className="w-full px-3 py-2 text-left text-meta text-ink-muted hover:bg-paper">
            Automatic (newest featured story)
          </button>
        </li>
        {results.map((r) => (
          <li key={r.id}>
            <button type="button" onClick={() => onPick({ id: r.id, title: r.title })} className="flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left hover:bg-green-soft">
              <span className="text-[14px] font-semibold">{r.title}</span>
              <span className="shrink-0 text-meta text-ink-muted">
                {r.section_name} · {formatShortDate(r.published_at)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SlotCard({ slot }: { slot: SlotWithTitle }) {
  const save = useSaveSlot();
  const [pick, setPick] = useState<{ id: string; title: string } | null>(slot.article_id ? { id: slot.article_id, title: slot.title ?? '' } : null);
  const [quote, setQuote] = useState(slot.pull_quote ?? '');
  const [attribution, setAttribution] = useState(slot.attribution ?? '');
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const isFolio = slot.slot === 'folio';

  async function submit() {
    try {
      await save.mutateAsync({ slot: slot.slot, article_id: pick?.id ?? null, pull_quote: isFolio ? quote.trim() || null : null, attribution: isFolio ? attribution.trim() || null : null });
      setMsg({ tone: 'success', text: 'Saved. The front page updates within a minute.' });
    } catch (err) {
      setMsg({ tone: 'error', text: errorText(err) ?? 'Couldn’t save.' });
    }
  }

  return (
    <Card>
      <CardHeader title={isFolio ? 'Literary Folio' : 'Lead story'} />
      <div className="flex flex-col gap-4 p-5 pt-2">
        <p className="text-body-m">
          <span className="text-ink-muted">Showing: </span>
          <strong>{pick?.title || 'Automatic'}</strong>
        </p>
        <ArticlePicker label={isFolio ? 'Featured literary piece' : 'Lead story'} value={pick?.title ?? null} section={isFolio ? 'literary' : undefined} onPick={setPick} />
        {isFolio && (
          <>
            <Field label="Pull quote">{({ id }) => <Textarea id={id} rows={2} value={quote} onChange={(e) => setQuote(e.target.value)} placeholder="“We write the river down so the river will remember us.”" />}</Field>
            <Field label="Attribution">{({ id }) => <Input id={id} value={attribution} onChange={(e) => setAttribution(e.target.value)} placeholder="— from “Baybay at Dusk,” a poem from this semester’s folio" />}</Field>
          </>
        )}
        {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
        <Button className="self-start" loading={save.isPending} onClick={() => void submit()}>
          Save
        </Button>
      </div>
    </Card>
  );
}

function TickerCard() {
  const setting = useSetting<Json>('ticker');
  const save = useSaveSetting('ticker');
  const [ticker, setTicker] = useState<Ticker>({ mode: 'latest', count: 3, items: [] });
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    const d = setting.data as Partial<Ticker> | null;
    if (d) setTicker({ mode: d.mode ?? 'latest', count: d.count ?? 3, items: d.items ?? [] });
  }, [setting.data]);

  return (
    <Card>
      <CardHeader title="Latest ticker" />
      <div className="flex flex-col gap-4 p-5 pt-2">
        <Field label="Show">
          {({ id }) => (
            <Select id={id} value={ticker.mode} onChange={(e) => setTicker((t) => ({ ...t, mode: e.target.value as Ticker['mode'] }))}>
              <option value="latest">The newest headlines</option>
              <option value="manual">My own announcements</option>
            </Select>
          )}
        </Field>
        {ticker.mode === 'latest' ? (
          <Field label="How many">{({ id }) => <Input id={id} type="number" min={1} max={6} value={ticker.count} onChange={(e) => setTicker((t) => ({ ...t, count: Number(e.target.value) }))} />}</Field>
        ) : (
          <div className="flex flex-col gap-2">
            {ticker.items.map((item, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[1fr_200px_auto]">
                <Input aria-label={`Announcement ${i + 1}`} value={item.text} onChange={(e) => setTicker((t) => ({ ...t, items: t.items.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) }))} />
                <Input aria-label={`Link ${i + 1} (optional)`} placeholder="/article/… (optional)" value={item.href ?? ''} onChange={(e) => setTicker((t) => ({ ...t, items: t.items.map((x, j) => (j === i ? { ...x, href: e.target.value || undefined } : x)) }))} />
                <button type="button" onClick={() => setTicker((t) => ({ ...t, items: t.items.filter((_, j) => j !== i) }))} className="grid size-11 place-items-center rounded-md text-ink-muted hover:bg-alert-soft hover:text-alert" aria-label={`Remove announcement ${i + 1}`}>
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
            ))}
            <Button size="sm" variant="ghost" className="self-start" icon={<Plus className="size-4" aria-hidden />} onClick={() => setTicker((t) => ({ ...t, items: [...t.items, { text: '' }] }))}>
              Add announcement
            </Button>
          </div>
        )}
        {msg && <Alert tone="success">{msg}</Alert>}
        <Button
          className="self-start"
          loading={save.isPending}
          onClick={() => void save.mutateAsync({ ...ticker, items: ticker.items.filter((i) => i.text.trim()) } as unknown as Json).then(() => setMsg('Saved.'))}
        >
          Save ticker
        </Button>
      </div>
    </Card>
  );
}

export function HomeTab() {
  const slots = useHomeSlots();
  if (!slots.data) return <Skeleton className="h-64" />;
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {(['lead', 'folio'] as const).map((name) => {
        const slot = slots.data.find((s) => s.slot === name) ?? { slot: name, article_id: null, pull_quote: null, attribution: null, updated_by: null, updated_at: '', title: null };
        return <SlotCard key={name} slot={slot} />;
      })}
      <TickerCard />
    </div>
  );
}
