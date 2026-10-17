import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useBlocker, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Checkbox, Input, Textarea } from '@/components/ui/Field';
import { Alert, ErrorState, Spinner } from '@/components/ui/Feedback';
import { useAuth } from '@/features/auth/AuthProvider';
import { allowedTransitions, canEditContent, canPublish, isEditor } from '@/features/auth/permissions';
import type { ArticleRow, ArticleStatus } from '@/lib/database.types';
import { errorText } from '@/lib/errors';
import { formatRelative } from '@/lib/format';
import { autoExcerpt } from '@/lib/slug';
import { getSupabase, unwrap } from '@/lib/supabase';
import { useDocumentTitle } from '@/lib/useDocumentTitle';
import { uploadMediaImage } from '../../media/uploadMedia';
import { MediaPickerDialog } from '../../media/MediaLibraryPage';
import {
  emptyDraft,
  saveArticle,
  saveRevision,
  deleteArticle,
  useCategoryOptions,
  useContributorOptions,
  useLoadArticle,
  type EditorDraft,
} from '../api';
import { AuthorsField, CategorySelect, CoverField, Label, Panel, SeoFields, TagsField } from './fields';
import { ActivityPanel, RevisionsPanel } from './HistoryPanels';
import { loadRevision, useActivity, useAddNote, useRevisions } from './history';
import { RichText } from './RichText';
import { useMySections } from './useMySections';
import { WorkflowPanel } from './WorkflowPanel';

type SaveState = { kind: 'idle' | 'saving' | 'saved' | 'error'; at?: Date; message?: string };

const AUTOSAVE_MS = 2500;
const snapshot = (d: EditorDraft) => JSON.stringify({ ...d, cover: d.cover?.id ?? null, coverAlt: d.cover?.alt_text ?? null });

/** /admin/articles/new and /admin/articles/:id */
export function ArticleEditorPage() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const loaded = useLoadArticle(isNew ? undefined : id);

  if (!isNew && loaded.isPending) return <Spinner label="Opening the article" className="py-16" />;
  if (!isNew && loaded.error) return <ErrorState title="We couldn’t open this article" error={loaded.error} onRetry={() => void loaded.refetch()} />;
  if (!isNew && !loaded.data) {
    return (
      <div className="flex flex-col items-start gap-3 py-12">
        <h1 className="font-serif text-headline-l">Article not found</h1>
        <p className="text-body-m text-ink-muted">It may have been deleted, or your role can’t open it.</p>
        <Link to="/admin/articles" className="text-button text-green-700 hover:underline">
          ← All articles
        </Link>
      </div>
    );
  }
  return <Editor key={id ?? 'new'} initialRow={loaded.data?.row ?? null} initialDraft={loaded.data?.draft ?? emptyDraft()} />;
}

function Editor({ initialRow, initialDraft }: { initialRow: ArticleRow | null; initialDraft: EditorDraft }) {
  const { profile, session } = useAuth();
  const userId = session?.user.id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const categories = useCategoryOptions();
  const contributors = useContributorOptions();
  const mySections = useMySections(userId);

  const [row, setRow] = useState<ArticleRow | null>(initialRow);
  const [draft, setDraft] = useState<EditorDraft>(initialDraft);
  const [save, setSave] = useState<SaveState>({ kind: 'idle' });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [body, setBody] = useState({ key: 0, initial: initialDraft.bodyJson ?? initialDraft.bodyHtml });
  const lastSaved = useRef(snapshot(initialDraft));
  const saving = useRef(false);
  useDocumentTitle(draft.title ? `Edit: ${draft.title}` : 'New article');

  const status: ArticleStatus = row?.status ?? 'draft';
  const role = profile?.role;
  const category = categories.data?.find((c) => c.id === draft.categoryId);
  const sectionId = category?.sectionId ?? row?.section_id;
  const ownContributor = contributors.data?.find((c) => c.profileId === userId);
  const isOwner = !row || row.created_by === userId || draft.authors.some((a) => a.contributorId === ownContributor?.id);
  const canEditSection = canPublish(role) || (role === 'section_editor' && Boolean(sectionId && mySections.data?.includes(sectionId)));
  const ctx = { status, isOwner, canEditSection };
  const editable = canEditContent(ctx);
  const writesLive = !['draft', 'rejected'].includes(status); // changes to live/locked articles need an explicit update
  const dirty = snapshot(draft) !== lastSaved.current;
  const transitions = row ? allowedTransitions(role, ctx) : [];
  const activity = useActivity(row?.id);
  const revisions = useRevisions(row?.id);
  const addNote = useAddNote(row?.id ?? '');

  async function restore(revisionId: number) {
    const rev = await loadRevision(revisionId);
    if (!rev) return;
    setDraft((d) => ({ ...d, title: rev.title, bodyJson: rev.bodyJson, bodyHtml: rev.bodyHtml }));
    setBody((b) => ({ key: b.key + 1, initial: rev.bodyJson ?? rev.bodyHtml }));
    setNotice('Revision restored into the editor. Save to keep it.');
  }

  const patch = useCallback((p: Partial<EditorDraft>) => setDraft((d) => ({ ...d, ...p })), []);

  const persist = useCallback(
    async (mode: 'auto' | 'manual'): Promise<ArticleRow | null> => {
      if (saving.current || !userId) return null;
      if (!draft.categoryId) {
        if (mode === 'manual') setSave({ kind: 'error', message: 'Choose a section and category first.' });
        return null;
      }
      saving.current = true;
      setSave({ kind: 'saving' });
      const current = draft;
      try {
        if (mode === 'auto' && writesLive && current.id) {
          await saveRevision(current.id, current, userId, 'autosave');
          setSave({ kind: 'saved', at: new Date(), message: 'Autosaved a revision — use “Update article” to publish changes.' });
          void queryClient.invalidateQueries({ queryKey: ['article-revisions', current.id] });
          return row;
        }
        const withExcerpt = current.excerpt.trim() ? current : { ...current, excerpt: autoExcerpt(current.bodyText) };
        if (current.cover && current.cover.alt_text !== initialDraft.cover?.alt_text) {
          unwrap(await getSupabase().from('media_assets').update({ alt_text: current.cover.alt_text }).eq('id', current.cover.id));
        }
        const saved = await saveArticle(withExcerpt, { canFeature: isEditor(role) });
        if (mode === 'manual' && current.id) await saveRevision(saved.id, current, userId, 'manual');
        lastSaved.current = snapshot(current);
        setRow(saved);
        setDraft((d) => ({ ...d, id: saved.id, slug: saved.slug, excerpt: d.excerpt || withExcerpt.excerpt }));
        lastSaved.current = snapshot({ ...current, id: saved.id, slug: saved.slug, excerpt: current.excerpt || withExcerpt.excerpt });
        setSave({ kind: 'saved', at: new Date() });
        void queryClient.invalidateQueries({ queryKey: ['cms-articles'] });
        void queryClient.invalidateQueries({ queryKey: ['recent-articles'] });
        void queryClient.invalidateQueries({ queryKey: ['article-revisions', saved.id] });
        if (!current.id) navigate(`/admin/articles/${saved.id}`, { replace: true });
        return saved;
      } catch (err) {
        setSave({ kind: 'error', message: errorText(err) ?? 'Saving failed.' });
        return null;
      } finally {
        saving.current = false;
      }
    },
    [draft, userId, writesLive, row, initialDraft.cover?.alt_text, role, queryClient, navigate],
  );

  // autosave after a pause
  useEffect(() => {
    if (!dirty || !editable || !draft.categoryId || !draft.title.trim()) return;
    const t = window.setTimeout(() => void persist('auto'), AUTOSAVE_MS);
    return () => window.clearTimeout(t);
  }, [draft, dirty, editable, persist]);

  // warn before leaving with unsaved changes
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname);
  useEffect(() => {
    if (blocker.state === 'blocked') {
      if (window.confirm('You have unsaved changes. Leave anyway?')) blocker.proceed();
      else blocker.reset();
    }
  }, [blocker]);
  useEffect(() => {
    if (!dirty) return;
    const onUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [dirty]);

  async function transition(to: ArticleStatus, note: string | null, scheduledFor: string | null) {
    if (!row) return;
    setBusy(true);
    setNotice(null);
    try {
      if (dirty && editable) {
        const saved = await persist('manual');
        if (!saved) return;
      }
      const next = unwrap(
        await getSupabase().rpc('transition_article', { p_article_id: row.id, p_to: to, p_note: note, p_scheduled_for: scheduledFor }),
      );
      setRow(next);
      setNotice(
        to === 'published' ? 'Published. It’s live on the site now.' : to === 'scheduled' ? 'Scheduled.' : to === 'submitted' ? 'Sent to the editors for review.' : null,
      );
      void queryClient.invalidateQueries({ queryKey: ['cms-articles'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      void queryClient.invalidateQueries({ queryKey: ['article-activity', row.id] });
    } catch (err) {
      setSave({ kind: 'error', message: errorText(err) ?? 'That action failed.' });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!row || !window.confirm('Delete this draft permanently?')) return;
    try {
      await deleteArticle(row.id);
      lastSaved.current = snapshot(draft);
      setDraft((d) => ({ ...d })); // clear dirty for the blocker
      void queryClient.invalidateQueries({ queryKey: ['cms-articles'] });
      navigate('/admin/articles', { replace: true });
    } catch (err) {
      setSave({ kind: 'error', message: errorText(err) ?? 'Delete failed.' });
    }
  }

  const uploadForBody = useMemo(
    () => (userId ? async (file: File) => {
      const asset = await uploadMediaImage(file, userId);
      return { bucket: asset.bucket, path: asset.path, alt: asset.alt_text };
    } : undefined),
    [userId],
  );

  const saveLabel =
    save.kind === 'saving'
      ? 'Saving…'
      : save.kind === 'error'
        ? save.message
        : dirty
          ? 'Unsaved changes'
          : save.kind === 'saved' && save.at
            ? `Saved ${formatRelative(save.at)}`
            : row
              ? 'All changes saved'
              : 'Not saved yet';

  return (
    <div className="flex flex-col gap-5">
      <h1 className="sr-only">{row ? `Edit article: ${draft.title || 'Untitled'}` : 'New article'}</h1>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/admin/articles" className="inline-flex items-center gap-1.5 text-button text-green-700 hover:underline">
          <ArrowLeft className="size-4" aria-hidden /> Articles
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <p role="status" aria-live="polite" className={save.kind === 'error' ? 'text-meta text-alert' : 'text-meta text-ink-muted'}>
            {saveLabel}
          </p>
          {row && (
            <a href={`/article/${row.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-button text-green-700 hover:underline">
              Preview <ExternalLink className="size-3.5" aria-hidden />
            </a>
          )}
          {editable && (
            <Button size="sm" variant={writesLive ? 'primary' : 'outline'} loading={save.kind === 'saving'} disabled={!dirty && Boolean(row)} onClick={() => void persist('manual')}>
              {writesLive ? 'Update article' : 'Save draft'}
            </Button>
          )}
        </div>
      </div>

      {notice && <Alert tone="success">{notice}</Alert>}
      {!editable && row && (
        <Alert>This article is {status.replace('_', ' ')}. You can read it, but only an editor can change it now.</Alert>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-4">
          <label className="sr-only" htmlFor="article-title">
            Headline
          </label>
          <textarea
            id="article-title"
            value={draft.title}
            disabled={!editable}
            onChange={(e) => patch({ title: e.target.value.replace(/\n/g, ' ') })}
            placeholder="Headline"
            rows={2}
            className="w-full resize-none bg-transparent font-serif text-[30px] font-bold leading-[1.15] tracking-[-0.5px] text-ink outline-none placeholder:text-ink-muted/60 md:text-[40px]"
          />
          <label className="sr-only" htmlFor="article-dek">
            Subtitle
          </label>
          <textarea
            id="article-dek"
            value={draft.dek}
            disabled={!editable}
            onChange={(e) => patch({ dek: e.target.value })}
            placeholder="Subtitle — one or two sentences that make readers want more"
            rows={2}
            className="w-full resize-none bg-transparent text-[18px] leading-[1.5] text-ink-muted outline-none placeholder:text-ink-muted/60"
          />
          <RichText
            key={body.key}
            initial={body.initial}
            editable={editable}
            uploadImage={uploadForBody}
            onChange={(v) => patch({ bodyJson: v.json, bodyHtml: v.html, bodyText: v.text })}
          />
        </div>

        <aside className="flex flex-col gap-4" aria-label="Article settings">
          <Panel title="Status">
            {row ? (
              <WorkflowPanel status={status} publishedAt={row.published_at} options={transitions} busy={busy} onTransition={(to, note, when) => void transition(to, note, when)} />
            ) : (
              <p className="text-meta font-normal text-ink-muted">Choose a category and write a headline — the draft saves itself.</p>
            )}
          </Panel>
          <Panel title="Placement">
            <CategorySelect value={draft.categoryId} options={categories.data ?? []} canUseReserved={isEditor(role)} disabled={!editable} onChange={(categoryId) => patch({ categoryId })} />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="article-kicker" hint="optional">
                Label
              </Label>
              <Input id="article-kicker" value={draft.kicker} disabled={!editable} placeholder="e.g. Environment" onChange={(e) => patch({ kicker: e.target.value })} />
            </div>
            {isEditor(role) && (
              <Checkbox label="Feature on the front page" checked={draft.isFeatured} disabled={!editable} onChange={(e) => patch({ isFeatured: e.target.checked })} />
            )}
          </Panel>
          <Panel title="Cover photo">
            <CoverField
              cover={draft.cover}
              caption={draft.coverCaption}
              disabled={!editable || !userId}
              onUpload={async (file) => {
                const asset = await uploadMediaImage(file, userId!);
                patch({ cover: asset, coverAssetId: asset.id });
              }}
              onChoose={() => setPicking(true)}
              onRemove={() => patch({ cover: null, coverAssetId: null })}
              onCaption={(coverCaption) => patch({ coverCaption })}
              onAlt={(alt) => setDraft((d) => (d.cover ? { ...d, cover: { ...d.cover, alt_text: alt } } : d))}
            />
          </Panel>
          <Panel title="Byline">
            <AuthorsField value={draft.authors} options={contributors.data ?? []} disabled={!editable} onChange={(authors) => patch({ authors })} />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="article-byline" hint="optional">
                Byline override
              </Label>
              <Input id="article-byline" value={draft.bylineOverride} disabled={!editable} placeholder="e.g. Sports Desk" onChange={(e) => patch({ bylineOverride: e.target.value })} />
            </div>
          </Panel>
          <Panel title="Tags & summary">
            <TagsField value={draft.tags} disabled={!editable} onChange={(tags) => patch({ tags })} />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="article-excerpt" hint={`${draft.excerpt.length}/280`}>
                Excerpt
              </Label>
              <Textarea id="article-excerpt" rows={3} className="min-h-20" maxLength={280} value={draft.excerpt} disabled={!editable} placeholder="Left empty, it’s taken from the first lines." onChange={(e) => patch({ excerpt: e.target.value })} />
            </div>
            <Checkbox label="Allow comments" checked={draft.allowComments} disabled={!editable} onChange={(e) => patch({ allowComments: e.target.checked })} />
          </Panel>
          <Panel title="Search & sharing">
            <SeoFields
              title={draft.seoTitle}
              description={draft.seoDescription}
              slug={draft.slug}
              fallbackTitle={draft.title}
              fallbackDescription={draft.excerpt || autoExcerpt(draft.bodyText, 160)}
              disabled={!editable}
              onChange={patch}
            />
          </Panel>
          {row && (
            <Panel title="Notes & activity">
              <ActivityPanel items={activity.data} loading={activity.isPending} onAddNote={(note) => addNote.mutateAsync(note)} />
            </Panel>
          )}
          {row && (
            <Panel title="Revisions">
              <RevisionsPanel items={revisions.data} loading={revisions.isPending} canRestore={editable} onRestore={(rid) => void restore(rid)} />
            </Panel>
          )}
          {row && status === 'draft' && (row.created_by === userId || isEditor(role)) && (
            <Button variant="ghost" className="self-start text-alert" onClick={() => void remove()}>
              Delete draft
            </Button>
          )}
        </aside>
      </div>
      <MediaPickerDialog open={picking} onClose={() => setPicking(false)} onPick={(asset) => patch({ cover: asset, coverAssetId: asset.id })} />
    </div>
  );
}
