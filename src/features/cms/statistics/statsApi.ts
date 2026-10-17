import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { StatsDim } from '@/lib/database.types';
import { getSupabase, unwrap } from '@/lib/supabase';
import type { DateRange } from './statsFormat';

const sb = () => getSupabase();
const key = (name: string, r: DateRange, extra?: string) => ['stats', name, r.from, r.to, extra];
// keep the last range on screen while a new one loads
const opts = { staleTime: 60_000, placeholderData: keepPreviousData };

export function useStatsOverview(r: DateRange) {
  return useQuery({ queryKey: key('overview', r), ...opts, queryFn: async () => unwrap(await sb().rpc('stats_overview', { p_from: r.from, p_to: r.to })) });
}

export function useStatsArticles(r: DateRange) {
  return useQuery({ queryKey: key('articles', r), ...opts, queryFn: async () => unwrap(await sb().rpc('stats_articles', { p_from: r.from, p_to: r.to, p_limit: 20 })) });
}

export function useStatsAuthors(r: DateRange) {
  return useQuery({ queryKey: key('authors', r), ...opts, queryFn: async () => unwrap(await sb().rpc('stats_authors', { p_from: r.from, p_to: r.to })) });
}

export function useStatsSections(r: DateRange) {
  return useQuery({ queryKey: key('sections', r), ...opts, queryFn: async () => unwrap(await sb().rpc('stats_sections', { p_from: r.from, p_to: r.to })) });
}

export function useStatsBreakdown(r: DateRange, dim: StatsDim) {
  return useQuery({ queryKey: key('breakdown', r, dim), ...opts, queryFn: async () => unwrap(await sb().rpc('stats_breakdown', { p_from: r.from, p_to: r.to, p_dim: dim })) });
}

export function useStatsShares(r: DateRange) {
  return useQuery({ queryKey: key('shares', r), ...opts, queryFn: async () => unwrap(await sb().rpc('stats_share_channels', { p_from: r.from, p_to: r.to })) });
}

export function useStatsStaff(r: DateRange) {
  return useQuery({ queryKey: key('staff', r), ...opts, queryFn: async () => unwrap(await sb().rpc('stats_staff_usage', { p_from: r.from, p_to: r.to })) });
}
