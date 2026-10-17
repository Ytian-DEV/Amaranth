import type { SkAthleteRow, SkEventRow, SkFactionRow, SkSportRow, SkVenueRow } from '@/lib/database.types';
import { useSkRows } from '../skApi';

export type SkLookups = {
  sports: SkSportRow[];
  events: SkEventRow[];
  factions: SkFactionRow[];
  venues: SkVenueRow[];
  athletes: SkAthleteRow[];
};

/** Everything the score/result screens need to show names instead of ids. */
export function useSkLookups(editionId: string) {
  const qs = {
    sports: useSkRows('sk_sports', editionId),
    events: useSkRows('sk_events', editionId),
    factions: useSkRows('sk_factions', editionId),
    venues: useSkRows('sk_venues', editionId),
    athletes: useSkRows('sk_athletes', editionId),
  };
  const all = Object.values(qs);
  const error = all.find((q) => q.error)?.error ?? null;
  const data: SkLookups | null = all.every((q) => q.data)
    ? { sports: qs.sports.data!, events: qs.events.data!, factions: qs.factions.data!, venues: qs.venues.data!, athletes: qs.athletes.data! }
    : null;
  return { data, error, refetch: () => all.forEach((q) => void q.refetch()) };
}

export function namer(l: SkLookups) {
  const sport = (id: string | undefined) => l.sports.find((s) => s.id === id);
  const event = (id: string | null | undefined) => l.events.find((e) => e.id === id);
  return {
    sport,
    event,
    eventSport: (eventId: string | null | undefined) => sport(event(eventId)?.sport_id),
    /** "Basketball · Men" */
    eventName: (eventId: string | null | undefined) => {
      const e = event(eventId);
      return e ? `${sport(e.sport_id)?.name ?? ''} · ${e.name}` : '—';
    },
    faction: (id: string | null | undefined) => l.factions.find((f) => f.id === id),
    venue: (id: string | null | undefined) => l.venues.find((v) => v.id === id),
    athlete: (id: string | null | undefined) => l.athletes.find((a) => a.id === id),
  };
}
