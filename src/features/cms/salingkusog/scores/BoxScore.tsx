import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Feedback';
import type { SkMatchRow, SkStatPair } from '@/lib/database.types';
import { Card, CardHeader } from '../../ui';
import { formatStatLine, parseStatLine } from '../scoring';
import { skErrorText, useAthleteStats, useSaveAthleteStats } from '../skApi';
import type { SkLookups } from './lookups';

function TeamStats({ stats, disabled, onSave }: { stats: SkStatPair[]; disabled: boolean; onSave: (s: SkStatPair[]) => void }) {
  const [rows, setRows] = useState(stats);
  useEffect(() => setRows(stats), [stats]);
  const set = (i: number, patch: Partial<SkStatPair>) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const commit = (next = rows) => onSave(next.filter((r) => r.label.trim()));
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[14px] font-semibold">Team stats</p>
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-[minmax(0,1fr)_80px_80px_36px] items-center gap-2">
          <Input aria-label={`Team stat ${i + 1}`} placeholder="Rebounds" value={r.label} disabled={disabled} onChange={(e) => set(i, { label: e.target.value })} onBlur={() => commit()} />
          <Input aria-label={`${r.label || 'Stat'} side A`} value={r.a} disabled={disabled} onChange={(e) => set(i, { a: e.target.value })} onBlur={() => commit()} className="text-center" />
          <Input aria-label={`${r.label || 'Stat'} side B`} value={r.b} disabled={disabled} onChange={(e) => set(i, { b: e.target.value })} onBlur={() => commit()} className="text-center" />
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              const next = rows.filter((_, j) => j !== i);
              setRows(next);
              commit(next);
            }}
            className="grid size-9 place-items-center rounded-md text-ink-muted hover:bg-alert-soft hover:text-alert"
            aria-label={`Remove ${r.label || 'stat'}`}
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        </div>
      ))}
      <Button size="sm" variant="ghost" disabled={disabled} icon={<Plus className="size-4" aria-hidden />} className="self-start" onClick={() => setRows((r) => [...r, { label: '', a: '', b: '' }])}>
        Add team stat
      </Button>
    </div>
  );
}

function PlayerStats({ match, lookups, disabled }: { match: SkMatchRow; lookups: SkLookups; disabled: boolean }) {
  const stats = useAthleteStats(match.id);
  const save = useSaveAthleteStats(match.id);
  const [pick, setPick] = useState('');
  const [text, setText] = useState<Record<string, string>>({});
  const sides = [match.side_a_id, match.side_b_id].filter(Boolean);
  const roster = lookups.athletes.filter((a) => sides.includes(a.faction_id));
  const rows = stats.data ?? [];
  const name = (id: string) => lookups.athletes.find((a) => a.id === id)?.name ?? 'Unknown athlete';

  const commit = (athleteId: string) => {
    const t = text[athleteId];
    if (t === undefined) return;
    save.mutate({ athlete_id: athleteId, stats: parseStatLine(t) });
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[14px] font-semibold">Player stats</p>
      <p className="text-meta font-normal text-ink-muted">Write them as “PTS 24, REB 9, AST 5”. Numbers add up into the top-scorer lists.</p>
      {save.error && <Alert tone="error">{skErrorText(save.error)}</Alert>}
      {rows.map((r) => (
        <div key={r.athlete_id} className="grid grid-cols-[minmax(0,140px)_minmax(0,1fr)_36px] items-center gap-2">
          <span className="truncate text-[14px] font-semibold">{name(r.athlete_id)}</span>
          <Input
            aria-label={`${name(r.athlete_id)} stats`}
            value={text[r.athlete_id] ?? formatStatLine(r.stats)}
            disabled={disabled}
            onChange={(e) => setText((t) => ({ ...t, [r.athlete_id]: e.target.value }))}
            onBlur={() => commit(r.athlete_id)}
          />
          <button type="button" disabled={disabled} onClick={() => save.mutate({ athlete_id: r.athlete_id, stats: null })} className="grid size-9 place-items-center rounded-md text-ink-muted hover:bg-alert-soft hover:text-alert" aria-label={`Remove ${name(r.athlete_id)} stats`}>
            <Trash2 className="size-4" aria-hidden />
          </button>
        </div>
      ))}
      {roster.length === 0 ? (
        <p className="text-meta font-normal text-ink-muted">Add athletes for these factions in the Athletes tab to record player stats.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Select aria-label="Athlete" value={pick} onChange={(e) => setPick(e.target.value)} className="w-56" disabled={disabled}>
            <option value="">Choose an athlete…</option>
            {roster
              .filter((a) => !rows.some((r) => r.athlete_id === a.id))
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} · {lookups.factions.find((f) => f.id === a.faction_id)?.short_name ?? ''}
                </option>
              ))}
          </Select>
          <Button
            size="sm"
            variant="outline"
            disabled={!pick || disabled}
            onClick={() => {
              save.mutate({ athlete_id: pick, stats: {} });
              setPick('');
            }}
          >
            Add player
          </Button>
        </div>
      )}
    </div>
  );
}

export function BoxScore({ match, lookups, disabled, onTeamStats }: { match: SkMatchRow; lookups: SkLookups; disabled: boolean; onTeamStats: (s: SkStatPair[]) => void }) {
  return (
    <Card aria-labelledby="sk-box">
      <CardHeader id="sk-box" title="Box score" />
      <div className="flex flex-col gap-6 px-5 pb-5">
        <TeamStats stats={match.team_stats} disabled={disabled} onSave={onTeamStats} />
        <PlayerStats match={match} lookups={lookups} disabled={disabled} />
      </div>
    </Card>
  );
}
