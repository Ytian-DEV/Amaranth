import { Download, Upload } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Textarea } from '@/components/ui/Field';
import { Alert, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Pill } from '@/components/ui/StatusPill';
import type { SkEditionRow } from '@/lib/database.types';
import { cn } from '@/lib/cn';
import { Card, CardHeader } from '../../ui';
import { resolveSchedule, scheduleColumns, scheduleTemplate, type ScheduleInsert, type ScheduleSetup } from '../scheduleCsv';
import { skErrorText, useImportMatches, useSkMatchKeys, useSkRows } from '../skApi';
import { SetupNote } from './shared';

const templateHref = `data:text/csv;charset=utf-8,${encodeURIComponent(scheduleTemplate)}`;

export function ImportView({ setup, busy, result, onImport }: { setup: ScheduleSetup; busy?: boolean; result?: { tone: 'success' | 'error'; text: string } | null; onImport: (rows: ScheduleInsert[]) => void }) {
  const [text, setText] = useState('');
  const parsed = useMemo(() => (text.trim() ? resolveSchedule(text, setup) : null), [text, setup]);
  const ready = parsed?.lines.filter((l) => l.match && !l.duplicate) ?? [];
  const bad = parsed?.lines.filter((l) => l.errors.length) ?? [];
  const dupes = parsed?.lines.filter((l) => l.duplicate) ?? [];

  async function readFile(file: File | undefined) {
    if (file) setText(await file.text());
  }

  return (
    <div className="flex flex-col gap-5">
      <Card aria-labelledby="sk-import">
        <CardHeader id="sk-import" title="Import the schedule" />
        <div className="flex flex-col gap-4 p-5 pt-2">
          <SetupNote>
            One game per row. Columns: <code className="text-ink">{scheduleColumns.join(', ')}</code>. Dates are YYYY-MM-DD, times are Philippine time (14:30 or 2:30 PM).
            Sports, events, factions (name or short name) and venues must already be set up. Leave the sides empty or write TBD for games not decided yet.
          </SetupNote>
          <div className="flex flex-wrap gap-3">
            <a href={templateHref} download="salingkusog-schedule-template.csv" className="inline-flex items-center gap-2 text-button text-green-700 underline-offset-4 hover:underline">
              <Download className="size-4" aria-hidden /> Download the template
            </a>
            <label className="inline-flex cursor-pointer items-center gap-2 text-button text-green-700 underline-offset-4 hover:underline">
              <Upload className="size-4" aria-hidden /> Choose a CSV file
              <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => void readFile(e.target.files?.[0])} />
            </label>
          </div>
          <Field label="Or paste the rows (from Google Sheets or Excel, saved as CSV)">
            {({ id }) => <Textarea id={id} rows={6} value={text} onChange={(e) => setText(e.target.value)} className="font-mono text-[13px]" spellCheck={false} />}
          </Field>
          {result && <Alert tone={result.tone}>{result.text}</Alert>}
          {parsed?.headerError && <Alert tone="error">{parsed.headerError}</Alert>}
        </div>
      </Card>

      {parsed && !parsed.headerError && (
        <Card aria-labelledby="sk-import-preview">
          <CardHeader
            id="sk-import-preview"
            title="Check before importing"
            action={
              <Button loading={busy} disabled={!ready.length} onClick={() => onImport(ready.map((l) => l.match!))}>
                Import {ready.length} game{ready.length === 1 ? '' : 's'}
              </Button>
            }
          />
          <p className="px-5 text-meta font-normal text-ink-muted" aria-live="polite">
            {ready.length} ready · {bad.length} with problems · {dupes.length} already in the schedule (skipped)
          </p>
          <div data-scroll-x className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-[14px]">
              <thead className="border-y border-line bg-paper text-kicker uppercase text-ink-muted">
                <tr>
                  <th scope="col" className="px-5 py-2">Line</th>
                  <th scope="col" className="px-2 py-2">When</th>
                  <th scope="col" className="px-2 py-2">Game</th>
                  <th scope="col" className="px-2 py-2">Sides</th>
                  <th scope="col" className="px-2 py-2">Venue</th>
                  <th scope="col" className="px-5 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {parsed.lines.map((l) => (
                  <tr key={l.line} className={cn('border-b border-line align-top last:border-0', l.errors.length > 0 && 'bg-alert-soft')}>
                    <td className="px-5 py-2.5 text-ink-muted">{l.line}</td>
                    <td className="whitespace-nowrap px-2 py-2.5">{l.cells.date} {l.cells.time}</td>
                    <td className="px-2 py-2.5">
                      {l.cells.sport}
                      {l.cells.event && ` · ${l.cells.event}`}
                      {l.cells.round && <span className="block text-meta text-ink-muted">{l.cells.round}</span>}
                    </td>
                    <td className="px-2 py-2.5">{[l.cells.side_a || 'TBD', l.cells.side_b || 'TBD'].join(' vs ')}</td>
                    <td className="px-2 py-2.5">{l.cells.venue || <span className="text-ink-muted">event venue</span>}</td>
                    <td className="px-5 py-2.5">
                      {l.errors.length ? (
                        <ul className="list-disc pl-4 text-alert">
                          {l.errors.map((e) => <li key={e}>{e}</li>)}
                        </ul>
                      ) : l.duplicate ? (
                        <Pill tone="neutral">Already added</Pill>
                      ) : (
                        <Pill tone="green">Ready</Pill>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

export function ImportTab({ edition }: { edition: SkEditionRow }) {
  const sports = useSkRows('sk_sports', edition.id);
  const events = useSkRows('sk_events', edition.id);
  const factions = useSkRows('sk_factions', edition.id);
  const venues = useSkRows('sk_venues', edition.id);
  const existing = useSkMatchKeys(edition.id);
  const importer = useImportMatches();
  const [result, setResult] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const queries = [sports, events, factions, venues, existing];

  const setup = useMemo<ScheduleSetup | null>(
    () =>
      sports.data && events.data && factions.data && venues.data && existing.data
        ? { edition, sports: sports.data, events: events.data, factions: factions.data, venues: venues.data, existing: existing.data }
        : null,
    [edition, sports.data, events.data, factions.data, venues.data, existing.data],
  );

  const error = queries.find((q) => q.error)?.error;
  if (error) return <ErrorState error={error} onRetry={() => queries.forEach((q) => void q.refetch())} />;
  if (!setup) return <Skeleton className="h-64" />;

  return (
    <ImportView
      setup={setup}
      busy={importer.isPending}
      result={result}
      onImport={(rows) => {
        setResult(null);
        importer.mutate(rows, {
          onSuccess: (r) => setResult({ tone: 'success', text: `Imported ${r.length} game${r.length === 1 ? '' : 's'}. They are now on the schedule as “upcoming”.` }),
          onError: (err) => setResult({ tone: 'error', text: skErrorText(err) }),
        });
      }}
    />
  );
}
