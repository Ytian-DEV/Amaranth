import { Route, Routes } from 'react-router-dom';
import { ArticlesTable } from '@/features/cms/articles/ArticlesListPage';
import { ActivityPanel, RevisionsPanel } from '@/features/cms/articles/editor/HistoryPanels';
import { RichText } from '@/features/cms/articles/editor/RichText';
import { WorkflowPanel } from '@/features/cms/articles/editor/WorkflowPanel';
import { DashboardView } from '@/features/cms/dashboard/DashboardView';
import { IntakeDetailView } from '@/features/cms/intake/IntakePage';
import { AdminShell } from '@/features/cms/layout/AdminLayout';
import { MediaDetails } from '@/features/cms/media/MediaDetails';
import { MediaGrid, MediaUploader } from '@/features/cms/media/MediaGrid';
import { buildTeam, type SkStaff } from '@/features/cms/salingkusog/skApi';
import { TeamView } from '@/features/cms/salingkusog/TeamTab';
import { EditionTab } from '@/features/cms/salingkusog/setup/EditionTab';
import { FactionsView } from '@/features/cms/salingkusog/setup/FactionsTab';
import { ImportView } from '@/features/cms/salingkusog/setup/ImportTab';
import { SportsView } from '@/features/cms/salingkusog/setup/SportsTab';
import type { MediaAssetRow } from '@/lib/database.types';
import { fixtureArticle, fixtureEditor, fixtureQueue, fixtureRecent, fixtureStats } from './fixtures';
import { FixtureAwardsAthletes, FixtureResults, FixtureScorekeeper, FixtureScores } from './SkFixturePages';
import { skFixture } from './skFixtures';

const fixtureMedia: MediaAssetRow[] = Array.from({ length: 8 }, (_, i) => ({
  id: `m${i + 1}`,
  bucket: 'media',
  path: `/amaranth-logo.svg`,
  kind: 'image',
  mime_type: 'image/webp',
  size_bytes: 120_000 + i * 9000,
  width: 1600,
  height: 1200,
  alt_text: i === 2 ? '' : `Photo ${i + 1}`,
  caption: null,
  credit: null,
  variants: [],
  uploaded_by: null,
  created_at: '2026-10-1' + (i % 9) + 'T08:00:00+08:00',
  updated_at: '2026-10-10T08:00:00+08:00',
}));

const fixtureSkStaff: SkStaff[] = [
  { id: 'p1', display_name: 'Administrator', email: 'editor@amaranth.vsu.edu.ph', role: 'editor_in_chief', is_active: true, avatar_url: null },
  { id: 'p2', display_name: 'Mara Managing', email: 'mara@vsu.edu.ph', role: 'managing_editor', is_active: true, avatar_url: null },
  { id: 'p3', display_name: 'Sam Sports', email: 'sam@vsu.edu.ph', role: 'section_editor', is_active: true, avatar_url: null },
  { id: 'p4', display_name: 'Wes Writer', email: 'wes@vsu.edu.ph', role: 'staff_writer', is_active: true, avatar_url: null },
  { id: 'p5', display_name: 'Cora Contributor', email: 'cora@vsu.edu.ph', role: 'contributor', is_active: true, avatar_url: null },
  { id: 'p6', display_name: 'Old Scorer', email: 'old@vsu.edu.ph', role: 'staff_writer', is_active: false, avatar_url: null },
];
const fixtureSkTeam = buildTeam(fixtureSkStaff, [
  { profile_id: 'p3', added_by: 'p1', created_at: '2026-10-12T09:00:00+08:00' },
  { profile_id: 'p6', added_by: 'p2', created_at: '2026-10-02T09:00:00+08:00' },
]);

/** /dev/admin/* — newsroom fixtures (lazy, so the editor stays out of the public fixtures). */
export default function AdminFixtures() {
  return (
    <Routes>
      <Route
        index
        element={
          <AdminShell profile={fixtureEditor} pending={3} onSignOut={() => undefined}>
            <DashboardView name="Editor" canReview stats={fixtureStats} recent={fixtureRecent} queue={fixtureQueue} onDecline={() => undefined} db={{ ok: true, latencyMs: 84, fetchedAt: new Date(Date.now() - 120_000) }} />
          </AdminShell>
        }
      />
      <Route
        path="writer"
        element={
          <AdminShell profile={{ ...fixtureEditor, display_name: 'Wes Writer', role: 'staff_writer' }} pending={0} onSignOut={() => undefined}>
            <DashboardView name="Wes Writer" canReview={false} stats={{ ...fixtureStats, pending_submissions: null }} recent={fixtureRecent.slice(2)} />
          </AdminShell>
        }
      />
      <Route
        path="loading"
        element={
          <AdminShell profile={fixtureEditor} pending={0} onSignOut={() => undefined}>
            <DashboardView name="Editor" canReview />
          </AdminShell>
        }
      />
      <Route
        path="articles"
        element={
          <AdminShell profile={fixtureEditor} pending={3} onSignOut={() => undefined}>
            <h1 className="sr-only">Articles</h1>
            <div className="rounded-[12px] border border-line bg-surface">
              <ArticlesTable rows={fixtureRecent.map((r) => ({ id: r.id, title: r.title, slug: r.slug, status: r.status, section: r.category, category: r.category, byline: 'Maria Santos', updatedAt: r.date, publishedAt: r.date }))} />
            </div>
          </AdminShell>
        }
      />
      <Route
        path="editor"
        element={
          <AdminShell profile={fixtureEditor} pending={3} onSignOut={() => undefined}>
            <h1 className="sr-only">Edit article</h1>
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <RichText initial={fixtureArticle.bodyHtml} onChange={() => undefined} uploadImage={async () => ({ bucket: 'media', path: '/images/x.jpg' })} />
              <div className="rounded-[12px] border border-line bg-surface p-4">
                <WorkflowPanel status="in_review" publishedAt={null} options={['published', 'scheduled', 'draft', 'rejected']} busy={false} onTransition={() => undefined} />
                <div className="mt-6 border-t border-line pt-4">
                  <ActivityPanel
                    onAddNote={async () => undefined}
                    items={[
                      { id: 3, action: 'note', from: null, to: null, note: 'Can we get a quote from the forest rangers?', actor: 'Nora News', createdAt: new Date(Date.now() - 3_600_000).toISOString() },
                      { id: 2, action: 'status', from: 'draft', to: 'submitted', note: 'Ready for review', actor: 'Wes Writer', createdAt: new Date(Date.now() - 86_400_000).toISOString() },
                      { id: 1, action: 'created', from: null, to: 'draft', note: null, actor: 'Wes Writer', createdAt: new Date(Date.now() - 3 * 86_400_000).toISOString() },
                    ]}
                  />
                </div>
                <div className="mt-6 border-t border-line pt-4">
                  <RevisionsPanel canRestore onRestore={() => undefined} items={[{ id: 2, kind: 'autosave', title: 'x', savedBy: 'Wes Writer', createdAt: new Date(Date.now() - 600_000).toISOString() }, { id: 1, kind: 'status', title: 'x', savedBy: 'Wes Writer', createdAt: new Date(Date.now() - 86_400_000).toISOString() }]} />
                </div>
              </div>
            </div>
          </AdminShell>
        }
      />
      <Route
        path="media"
        element={
          <AdminShell profile={fixtureEditor} pending={3} onSignOut={() => undefined}>
            <div className="flex flex-col gap-6">
              <h1 className="sr-only">Media library</h1>
              <MediaUploader onFiles={() => undefined} busy={false} />
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                <MediaGrid items={fixtureMedia} selectedId="m2" onSelect={() => undefined} />
                <div className="rounded-[12px] border border-line bg-surface p-4">
                  <MediaDetails asset={fixtureMedia[1]} usage={2} canDelete onSave={async () => undefined} onDelete={async () => undefined} />
                </div>
              </div>
            </div>
          </AdminShell>
        }
      />
      <Route
        path="salingkusog-team"
        element={
          <AdminShell profile={fixtureEditor} pending={3} onSignOut={() => undefined}>
            <div className="flex flex-col gap-6">
              <h1 className="font-serif text-headline-l text-ink">Salingkusog</h1>
              <TeamView {...fixtureSkTeam} canManage onAdd={() => undefined} onRemove={() => undefined} message={{ tone: 'success', text: 'Sam Sports can now enter Salingkusog data.' }} />
            </div>
          </AdminShell>
        }
      />
      <Route
        path="salingkusog-team-member"
        element={
          <AdminShell profile={{ ...fixtureEditor, display_name: 'Sam Sports', role: 'section_editor' }} skTeam pending={0} onSignOut={() => undefined}>
            <div className="flex flex-col gap-6">
              <h1 className="font-serif text-headline-l text-ink">Salingkusog</h1>
              <TeamView {...fixtureSkTeam} canManage={false} onAdd={() => undefined} onRemove={() => undefined} />
            </div>
          </AdminShell>
        }
      />
      <Route
        path="salingkusog-setup"
        element={
          <AdminShell profile={fixtureEditor} pending={3} onSignOut={() => undefined}>
            <div className="flex flex-col gap-8">
              <h1 className="font-serif text-headline-l text-ink">Salingkusog setup</h1>
              <section className="flex flex-col gap-3" aria-label="Edition">
                <EditionTab edition={skFixture.edition} onSelect={() => undefined} />
              </section>
              <section className="flex flex-col gap-3" aria-label="Factions">
                <FactionsView factions={skFixture.factions} logos={[]} onAdd={() => undefined} onEdit={() => undefined} onDelete={() => undefined} />
              </section>
              <section className="flex flex-col gap-3" aria-label="Sports and events">
                <SportsView sports={skFixture.sports} events={skFixture.events} venues={skFixture.venues} onAddSport={() => undefined} onEditSport={() => undefined} onDeleteSport={() => undefined} onAddEvent={() => undefined} onEditEvent={() => undefined} onDeleteEvent={() => undefined} />
              </section>
              <section className="flex flex-col gap-3" aria-label="Schedule import">
                <ImportView setup={{ ...skFixture, existing: [] }} onImport={() => undefined} />
              </section>
            </div>
          </AdminShell>
        }
      />
      <Route
        path="salingkusog-scores"
        element={
          <AdminShell profile={fixtureEditor} pending={3} onSignOut={() => undefined}>
            <div className="flex flex-col gap-6">
              <h1 className="font-serif text-headline-l text-ink">Scores</h1>
              <FixtureScores />
            </div>
          </AdminShell>
        }
      />
      <Route
        path="salingkusog-scorekeeper"
        element={
          <AdminShell profile={fixtureEditor} pending={3} onSignOut={() => undefined}>
            <div className="flex flex-col gap-6">
              <h1 className="font-serif text-headline-l text-ink">Scores</h1>
              <FixtureScorekeeper />
            </div>
          </AdminShell>
        }
      />
      <Route
        path="salingkusog-results"
        element={
          <AdminShell profile={fixtureEditor} pending={3} onSignOut={() => undefined}>
            <div className="flex flex-col gap-6">
              <h1 className="font-serif text-headline-l text-ink">Results & medals</h1>
              <FixtureResults />
            </div>
          </AdminShell>
        }
      />
      <Route
        path="salingkusog-awards"
        element={
          <AdminShell profile={fixtureEditor} pending={3} onSignOut={() => undefined}>
            <div className="flex flex-col gap-6">
              <h1 className="font-serif text-headline-l text-ink">Awards and athletes</h1>
              <FixtureAwardsAthletes />
            </div>
          </AdminShell>
        }
      />
      <Route
        path="intake"
        element={
          <AdminShell profile={fixtureEditor} pending={3} onSignOut={() => undefined}>
            <IntakeDetailView
              item={{ id: 's1', kind: 'submission', title: 'A love letter to the Agri canteen', from: 'Juan Dela Cruz', email: 'juan@example.com', affiliation: 'BS Agriculture 3', section: 'Feature', summary: 'How the canteen behind the Agri building has fed four generations of students.', body: 'Every morning at six, before the first class bell, Manang Lita lights the stove. She has done this for thirty-one years.', eventDate: null, venue: null, status: 'reviewing', reviewNote: null, convertedArticleId: null, createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString() }}
              files={[{ id: 'f1', name: 'agri-canteen-final.docx', mime: 'application/msword', size: 48000, path: 'submissions/x/1.docx' }]}
              categories={[{ id: 'c1', name: 'Campus Feature', sectionName: 'Feature' }, { id: 'c2', name: 'Campus News', sectionName: 'News' }]}
              busy={false}
              onStatus={() => undefined}
              onConvert={() => undefined}
            />
          </AdminShell>
        }
      />
    </Routes>
  );
}
