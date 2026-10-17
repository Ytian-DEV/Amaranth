import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { Select } from '@/components/ui/Field';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { useAuth } from '@/features/auth/AuthProvider';
import { canEditSk, canManageSkTeam } from '@/features/auth/permissions';
import type { SkEditionRow } from '@/lib/database.types';
import { cn } from '@/lib/cn';
import { useDocumentTitle } from '@/lib/useDocumentTitle';
import { CmsPageHeader } from '../ui';
import { AwardsTab } from './awards/AwardsTab';
import { ResultsEditor, ResultsTab } from './results/ResultsTab';
import { Scorekeeper } from './scores/Scorekeeper';
import { ScoresTab } from './scores/ScoresTab';
import { AthletesTab } from './setup/AthletesTab';
import { EditionTab } from './setup/EditionTab';
import { FactionsTab } from './setup/FactionsTab';
import { ImportTab } from './setup/ImportTab';
import { SportsTab } from './setup/SportsTab';
import { VenuesTab } from './setup/VenuesTab';
import { useOnSkTeam, useSkEditions } from './skApi';
import { TeamTab } from './TeamTab';

const STORAGE_KEY = 'amaranth.sk.edition';
const readStored = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? undefined;
  } catch {
    return undefined;
  }
};

/** Edition being edited: remembered per browser, else the current one, else the newest. */
function useSelectedEdition(editions: SkEditionRow[] | undefined) {
  const [id, setId] = useState<string | undefined>(readStored);
  const edition = editions?.find((e) => e.id === id) ?? editions?.find((e) => e.is_current) ?? editions?.[0] ?? null;
  useEffect(() => {
    try {
      if (edition) localStorage.setItem(STORAGE_KEY, edition.id);
    } catch {
      /* private mode */
    }
  }, [edition]);
  return [edition, setId] as const;
}

const tabs = [
  { to: 'scores', label: 'Scores' },
  { to: 'results', label: 'Results & medals' },
  { to: 'awards', label: 'Awards' },
  { to: 'athletes', label: 'Athletes' },
  { to: 'edition', label: 'Edition' },
  { to: 'factions', label: 'Factions' },
  { to: 'sports', label: 'Sports & events' },
  { to: 'venues', label: 'Venues' },
  { to: 'import', label: 'Schedule import' },
  { to: 'team', label: 'Team' },
];

/** /admin/salingkusog/* — intramurals data. Managing roles and Salingkusog team members only. */
export function SalingkusogPage() {
  useDocumentTitle('Salingkusog');
  const { profile } = useAuth();
  const onTeam = useOnSkTeam();
  const manager = canManageSkTeam(profile?.role);
  const editions = useSkEditions();
  const [edition, setEditionId] = useSelectedEdition(editions.data);

  if (!manager && onTeam.isPending) return <Skeleton className="h-64" />;
  if (!canEditSk(profile?.role, onTeam.data ?? false)) return <Navigate to="/admin" replace />;

  const needsEdition = (node: (e: SkEditionRow) => ReactNode) => {
    if (editions.error) return <ErrorState error={editions.error} onRetry={() => void editions.refetch()} />;
    if (!editions.data) return <Skeleton className="h-64" />;
    if (!edition) return <EmptyState title="Create an edition first">Open the Edition tab and add this year’s Salingkusog.</EmptyState>;
    return node(edition);
  };

  return (
    <div className="flex flex-col gap-6">
      <CmsPageHeader
        title="Salingkusog"
        subtitle="VSU intramurals: live scores, results, medals and awards, plus the edition setup."
        actions={
          editions.data && editions.data.length > 1 ? (
            <label className="flex items-center gap-2 text-[14px] font-semibold">
              Edition
              <Select value={edition?.id ?? ''} onChange={(e) => setEditionId(e.target.value)} className="w-48">
                {editions.data.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </Select>
            </label>
          ) : undefined
        }
      />
      <nav aria-label="Salingkusog sections" className="-mx-4 md:mx-0">
        <ul data-scroll-x className="no-scrollbar flex gap-1 overflow-x-auto border-b border-line px-4 md:px-0">
          {tabs.map((t) => (
            <li key={t.to} className="shrink-0">
              <NavLink
                to={`/admin/salingkusog/${t.to}`}
                className={({ isActive }) =>
                  cn('-mb-px block border-b-2 px-3 py-2.5 text-button', isActive ? 'border-green-700 text-green-700' : 'border-transparent text-ink-muted hover:text-ink')
                }
              >
                {t.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <Routes>
        <Route index element={<Navigate to="scores" replace />} />
        <Route path="scores" element={needsEdition((e) => <ScoresTab key={e.id} edition={e} />)} />
        <Route path="scores/:matchId" element={needsEdition((e) => <Scorekeeper edition={e} />)} />
        <Route path="results" element={needsEdition((e) => <ResultsTab key={e.id} edition={e} />)} />
        <Route path="results/:eventId" element={needsEdition((e) => <ResultsEditor edition={e} />)} />
        <Route path="awards" element={needsEdition((e) => <AwardsTab key={e.id} edition={e} />)} />
        <Route path="athletes" element={needsEdition((e) => <AthletesTab key={e.id} editionId={e.id} />)} />
        <Route
          path="edition"
          element={
            editions.error ? (
              <ErrorState error={editions.error} onRetry={() => void editions.refetch()} />
            ) : !editions.data ? (
              <Skeleton className="h-64" />
            ) : (
              <EditionTab edition={edition} canUploadPdf={manager} onSelect={setEditionId} />
            )
          }
        />
        <Route path="factions" element={needsEdition((e) => <FactionsTab key={e.id} editionId={e.id} />)} />
        <Route path="sports" element={needsEdition((e) => <SportsTab key={e.id} editionId={e.id} />)} />
        <Route path="venues" element={needsEdition((e) => <VenuesTab key={e.id} editionId={e.id} />)} />
        <Route path="import" element={needsEdition((e) => <ImportTab key={e.id} edition={e} />)} />
        <Route path="team" element={<TeamTab canManage={manager} />} />
        <Route path="*" element={<Navigate to="/admin/salingkusog" replace />} />
      </Routes>
    </div>
  );
}
