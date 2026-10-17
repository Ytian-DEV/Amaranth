import { Navigate, useSearchParams } from 'react-router-dom';
import { ErrorState } from '@/components/ui/Feedback';
import { useAuth } from '@/features/auth/AuthProvider';
import { canViewStats } from '@/features/auth/permissions';
import { useDocumentTitle } from '@/lib/useDocumentTitle';
import { StatisticsView } from './StatisticsView';
import { useStatsArticles, useStatsAuthors, useStatsBreakdown, useStatsOverview, useStatsSections, useStatsShares, useStatsStaff } from './statsApi';
import { rangeFromParams, type RangePreset } from './statsFormat';

/** /admin/statistics — Super admin, Executive Editor and Managing editor only (the database enforces it too). */
export function StatisticsPage() {
  useDocumentTitle('Statistics');
  const { profile } = useAuth();
  if (!canViewStats(profile?.role)) return <Navigate to="/admin" replace />;
  return <Statistics />;
}

function Statistics() {
  const [params, setParams] = useSearchParams();
  const range = rangeFromParams(params);
  const overview = useStatsOverview(range);
  const articles = useStatsArticles(range);
  const authors = useStatsAuthors(range);
  const sections = useStatsSections(range);
  const sources = useStatsBreakdown(range, 'source');
  const referrers = useStatsBreakdown(range, 'referrer');
  const devices = useStatsBreakdown(range, 'device');
  const browsers = useStatsBreakdown(range, 'browser');
  const shares = useStatsShares(range);
  const staff = useStatsStaff(range);
  const all = [overview, articles, authors, sections, sources, referrers, devices, browsers, shares, staff];

  const error = all.find((q) => q.error)?.error;
  if (error) return <ErrorState error={error} onRetry={() => all.forEach((q) => void q.refetch())} />;

  const onRange = ({ preset, from, to }: { preset: RangePreset; from?: string; to?: string }) =>
    setParams(preset === 'custom' && from && to ? { from, to } : preset === '30d' ? {} : { range: preset }, { replace: true });

  return (
    <StatisticsView
      range={range}
      onRange={onRange}
      data={{
        overview: overview.data,
        articles: articles.data,
        authors: authors.data,
        sections: sections.data,
        sources: sources.data,
        referrers: referrers.data,
        devices: devices.data,
        browsers: browsers.data,
        shares: shares.data,
        staff: staff.data,
      }}
    />
  );
}
