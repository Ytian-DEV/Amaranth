// Salingkusog countdown: shared by the newsroom setting and the public page.
import { manilaTime } from './manila';

export const COUNTDOWN_PATH = '/salingkusog-2026/countdown';
export const HUB_ALIAS_PATH = '/salingkusog-2026';
/** 1200×630 link-preview image (public/images/salingkusog). */
export const COUNTDOWN_OG_IMAGE = '/images/salingkusog/countdown-og.png';

/** Default start when none is set: the first day at 8:00 AM, Philippine time. */
export const defaultCountdownAt = (startsOn: string) => `${startsOn}T08:00:00+08:00`;

export type Remaining = { days: number; hours: number; minutes: number; seconds: number; done: boolean };

/** Time left until `target` (absolute instant, so it reads the same in every time zone). */
export function remaining(target: string | Date, now: Date = new Date()): Remaining {
  const ms = new Date(target).getTime() - now.getTime();
  if (!Number.isFinite(ms) || ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  const s = Math.floor(ms / 1000);
  return { days: Math.floor(s / 86_400), hours: Math.floor((s % 86_400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60, done: false };
}

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;

/** "12 days, 4 hours and 30 minutes" — for screen readers (announced once a minute, not every second). */
export function remainingSentence(r: Remaining) {
  if (r.done) return 'The games have begun.';
  const parts = [r.days && plural(r.days, 'day'), r.hours && plural(r.hours, 'hour'), plural(r.minutes, 'minute')].filter(Boolean) as string[];
  return `${parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : parts[0]} until the games begin.`;
}

/** "Monday, October 13, 2026 · 8:00 AM, Philippine time" */
export function startLine(at: string) {
  const date = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' }).format(new Date(at));
  const [h, m] = manilaTime(at).split(':').map(Number);
  return `${date} · ${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}, Philippine time`;
}
