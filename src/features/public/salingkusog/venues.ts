// Venue guide: what each venue hosts and what is on there next.
import { manilaDate } from '@/lib/manila';
import { clockLabel, dayLabel } from './hub';
import type { HubData } from './skData';

export type VenueStatus = { tone: 'live' | 'next' | 'done' | 'none'; text: string };

export function venueGuide(hub: HubData, now = new Date()) {
  const today = manilaDate(now);
  const tomorrow = manilaDate(new Date(now.getTime() + 86_400_000));
  const label = (eventId: string) => {
    const e = hub.events.find((x) => x.id === eventId);
    const s = hub.sports.find((x) => x.id === e?.sport_id);
    return e?.name.includes('·') ? e.name : `${s?.name ?? ''} · ${e?.name ?? ''}`;
  };

  return hub.venues.map((v) => {
    const games = hub.matches.filter((m) => (m.venue_id ?? hub.events.find((e) => e.id === m.event_id)?.venue_id) === v.id);
    const sportIds = new Set([...hub.events.filter((e) => e.venue_id === v.id).map((e) => e.sport_id), ...games.map((m) => hub.events.find((e) => e.id === m.event_id)?.sport_id)]);
    const sports = hub.sports.filter((s) => sportIds.has(s.id)).map((s) => s.name);

    const live = games.filter((m) => m.status === 'live');
    const upcoming = games.filter((m) => m.status === 'upcoming' && Date.parse(m.scheduled_at) >= now.getTime() - 3600_000).sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
    const next = upcoming[0];
    let status: VenueStatus;
    if (live.length) status = { tone: 'live', text: `Live now: ${live.map((m) => label(m.event_id)).join(', ')}` };
    else if (next && manilaDate(next.scheduled_at) === today) status = { tone: 'next', text: `Next: ${label(next.event_id)}  ·  ${clockLabel(next.scheduled_at)}` };
    else if (games.some((m) => manilaDate(m.scheduled_at) === today)) status = { tone: 'done', text: 'Done for today' };
    else if (next) {
      const d = manilaDate(next.scheduled_at);
      status = { tone: 'next', text: `${d === tomorrow ? 'Tomorrow' : dayLabel(d, false)}: ${label(next.event_id)}  ·  ${clockLabel(next.scheduled_at)}` };
    } else status = { tone: 'none', text: games.length ? 'No more games here' : 'No games scheduled yet' };

    return { venue: v, sports, status, pinned: v.map_x !== null && v.map_y !== null };
  });
}
