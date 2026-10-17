// Formatting and date-range helpers for the Statistics page (all dates are Manila calendar days).
import { manilaDate } from '@/lib/manila';

/** 4523 → "1:15:23" (hours not capped, for weekly/monthly totals). */
export function formatHMS(totalSeconds: number) {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}:${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/** 95 → "1:35" (read time). */
export function formatMS(totalSeconds: number | null | undefined) {
  if (totalSeconds == null) return '–';
  const s = Math.max(0, Math.round(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export const formatCount = (n: number) => new Intl.NumberFormat('en-US', { notation: n >= 10_000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(n);

/** Percent change vs the previous period, or null when there is nothing to compare with. */
export function pctChange(current: number, previous: number) {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export const changeNote = (current: number, previous: number) => {
  const p = pctChange(current, previous);
  if (p === null) return { text: 'No earlier data', tone: 'muted' as const };
  if (p === 0) return { text: 'Same as the previous period', tone: 'muted' as const };
  return { text: `${p > 0 ? '+' : ''}${p}% vs previous period`, tone: p > 0 ? ('good' as const) : ('alert' as const) };
};

export type RangePreset = '7d' | '30d' | '90d' | '365d' | 'custom';
export type DateRange = { from: string; to: string; preset: RangePreset };

const addDays = (day: string, n: number) => new Date(Date.parse(`${day}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

/** Range from the URL (?range=30d or ?from=YYYY-MM-DD&to=YYYY-MM-DD), defaulting to the last 30 days. */
export function rangeFromParams(params: URLSearchParams, today = manilaDate()): DateRange {
  const from = params.get('from');
  const to = params.get('to');
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  if (from && to && iso.test(from) && iso.test(to) && from <= to && to <= today) {
    const span = (Date.parse(to) - Date.parse(from)) / 86_400_000;
    if (span <= 730) return { from, to, preset: 'custom' };
  }
  const preset = (['7d', '30d', '90d', '365d'] as const).find((p) => p === params.get('range')) ?? '30d';
  const days = Number.parseInt(preset, 10);
  return { from: addDays(today, -(days - 1)), to: today, preset };
}

export const presetLabels: Record<Exclude<RangePreset, 'custom'>, string> = { '7d': 'Last 7 days', '30d': 'Last 30 days', '90d': 'Last 90 days', '365d': 'Last 12 months' };

export const sourceLabels: Record<string, string> = { direct: 'Direct', social: 'Social media', search: 'Search', referral: 'Other sites', internal: 'Within the site', campaign: 'Campaign links' };
export const channelLabels: Record<string, string> = { facebook: 'Facebook', messenger: 'Messenger', x: 'X', copy: 'Copy link', native: 'Phone share sheet', other: 'Other' };
export const deviceLabels: Record<string, string> = { mobile: 'Phone', tablet: 'Tablet', desktop: 'Desktop' };
