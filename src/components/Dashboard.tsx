import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  FilePlus2,
  FileText,
  Gauge,
  ImagePlus,
  LayoutDashboard,
  Loader2,
  LogOut,
  PencilLine,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  UploadCloud,
  UserRoundPlus,
} from "lucide-react";
import { toast } from "sonner";
import { AuthorCreateDialog } from "./admin/AuthorCreateDialog";
import { RichTextEditor } from "./admin/RichTextEditor";
import {
  articleToEditorState,
  articleWordCount,
  categoryDisplayName,
  createEmptyEditorState,
  createSlug,
  fromDateTimeLocal,
  getCategorySection,
  getContributorFromLink,
  getPrimaryAuthorLink,
  htmlToPlainText,
  pickSingleRelation,
  statusBadgeVariant,
  statusLabel,
} from "../lib/cms";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import type {
  CmsArticleEditorState,
  CmsArticleRecord,
  CmsArticleStatus,
  CmsCategory,
  CmsContributor,
  DashboardUser,
} from "../types/database";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";
import { Skeleton } from "./ui/skeleton";
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";

interface DashboardProps {
  user: DashboardUser;
  onLogout: () => void;
}

type DashboardNavId =
  | "overview"
  | "create"
  | "edit"
  | "delete"
  | "analytics"
  | "performance"
  | "settings";

const statusOptions: CmsArticleStatus[] = [
  "draft",
  "submitted",
  "in_review",
  "scheduled",
  "published",
  "archived",
  "rejected",
];

function ArticleMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <Card className="admin-kpi">
      <CardContent className="admin-kpi-content">
        <div className="admin-kpi-orb" />
        <p className="admin-kpi-label">{label}</p>
        <div className="admin-kpi-row">
          <p className="admin-kpi-value">{value}</p>
          <p className="admin-kpi-detail">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function PageIntro({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <Card className="admin-page-intro">
      <CardContent className="admin-page-intro-content">
        <div className="admin-page-intro-layout">
          <div className="admin-page-intro-copy">
            <p className="admin-page-intro-eyebrow">{eyebrow}</p>
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight text-emerald-950">{title}</h2>
              <p className="max-w-3xl text-sm leading-6 text-emerald-900/68 sm:text-base">
                {description}
              </p>
            </div>
          </div>
          {actions ? <div className="admin-page-intro-actions">{actions}</div> : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function Dashboard({ user, onLogout }: DashboardProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [articles, setArticles] = useState<CmsArticleRecord[]>([]);
  const [categories, setCategories] = useState<CmsCategory[]>([]);
  const [contributors, setContributors] = useState<CmsContributor[]>([]);
  const [editorState, setEditorState] = useState<CmsArticleEditorState>(
    createEmptyEditorState(),
  );
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [articleToDelete, setArticleToDelete] = useState<CmsArticleRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CmsArticleStatus | "all">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAuthorDialogOpen, setIsAuthorDialogOpen] = useState(false);
  const [slugWasEdited, setSlugWasEdited] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string>("");
  const [loadError, setLoadError] = useState("");
  const [activeNav, setActiveNav] = useState<DashboardNavId>("overview");

  const filteredArticles = articles.filter((article) => {
    const matchesStatus = statusFilter === "all" || article.status === statusFilter;
    if (!matchesStatus) return false;

    if (!searchQuery.trim()) return true;

    const query = searchQuery.trim().toLowerCase();
    const category = pickSingleRelation<CmsCategory>(article.categories);
    const primaryAuthor = getContributorFromLink(getPrimaryAuthorLink(article));
    const haystack = [
      article.title,
      article.slug,
      article.excerpt,
      category?.title,
      primaryAuthor?.display_name,
      article.author_name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });

  const selectedCategory =
    categories.find((category) => category.id === editorState.categoryId) ?? null;
  const selectedAuthor =
    contributors.find((contributor) => contributor.id === editorState.authorId) ?? null;
  const coverImageSrc = coverPreview || editorState.imageUrl;
  const wordCount = articleWordCount(editorState.bodyHtml);

  const publishedCount = articles.filter((article) => article.status === "published").length;
  const draftCount = articles.filter((article) => article.status === "draft").length;
  const scheduledCount = articles.filter((article) => article.status === "scheduled").length;
  const articlesWithCoverCount = articles.filter(
    (article) => Boolean(article.cover_asset_id || article.image_url),
  ).length;
  const averageWordCount = articles.length
    ? Math.round(
        articles.reduce(
          (sum, article) => sum + articleWordCount(article.body_html ?? article.body_text),
          0,
        ) / articles.length,
      )
    : 0;
  const averageContentHealth = articles.length
    ? Math.round(
        articles.reduce((sum, article) => {
          let score = 0;
          if (article.title?.trim()) score += 20;
          if (article.excerpt?.trim()) score += 15;
          if (article.body_text?.trim()) score += 30;
          if (article.category_id) score += 10;
          if (article.author_name?.trim()) score += 10;
          if (article.cover_asset_id || article.image_url) score += 15;
          return sum + score;
        }, 0) / articles.length,
      )
    : 0;
  const categoryDistribution = categories
    .map((category) => ({
      id: category.id,
      title: category.title,
      count: articles.filter((article) => article.category_id === category.id).length,
    }))
    .filter((category) => category.count > 0)
    .sort((left, right) => right.count - left.count)
    .slice(0, 5);
  const authorDistribution = contributors
    .map((contributor) => ({
      id: contributor.id,
      name: contributor.display_name,
      count: articles.filter((article) => {
        const primaryAuthor = getContributorFromLink(getPrimaryAuthorLink(article));
        return primaryAuthor?.id === contributor.id;
      }).length,
    }))
    .filter((author) => author.count > 0)
    .sort((left, right) => right.count - left.count)
    .slice(0, 5);
  const recentArticles = articles.slice(0, 5);

  useEffect(() => {
    void loadDashboard();
  }, []);

  useEffect(() => {
    if (!editorState.selectedImageFile) {
      setCoverPreview("");
      return;
    }

    const nextPreview = URL.createObjectURL(editorState.selectedImageFile);
    setCoverPreview(nextPreview);

    return () => {
      URL.revokeObjectURL(nextPreview);
    };
  }, [editorState.selectedImageFile]);

  function navigateToPage(nav: DashboardNavId) {
    setActiveNav(nav);
    if (typeof window !== "undefined") {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  }

  async function loadDashboard(preferredArticleId?: string | null) {
    const isInitialLoad = isLoading && !isRefreshing;
    if (!isInitialLoad) {
      setIsRefreshing(true);
    }
    setLoadError("");

    const [categoriesResult, contributorsResult, articlesResult] = await Promise.all([
      supabase
        .from("categories")
        .select("id, title, slug, description, sort_order, section_id, sections(id, key, name)")
        .order("sort_order", { ascending: true }),
      supabase
        .from("contributors")
        .select("id, display_name, slug, email, contributor_type, is_active")
        .eq("is_active", true)
        .order("display_name", { ascending: true }),
      supabase
        .from("articles")
        .select(
          "id, title, slug, subtitle, excerpt, body_html, body_text, author_name, image_url, featured_image_alt, status, published_at, scheduled_for, updated_at, created_at, category_id, cover_asset_id, editorial_priority, allow_comments, categories(id, title, slug, description, sort_order, section_id, sections(id, key, name)), article_authors(contributor_id, display_order, is_primary, contributors(id, display_name, slug, email, contributor_type, is_active))",
        )
        .order("updated_at", { ascending: false }),
    ]);

    const categoriesError = categoriesResult.error;
    const contributorsError = contributorsResult.error;
    const articlesError = articlesResult.error;

    if (categoriesError || contributorsError || articlesError) {
      const message =
        categoriesError?.message || contributorsError?.message || articlesError?.message;
      setLoadError(message ?? "Unable to load dashboard data.");
    }

    const nextCategories = ((categoriesResult.data as CmsCategory[] | null) ?? []).sort(
      (left, right) => left.sort_order - right.sort_order,
    );
    const nextContributors = ((contributorsResult.data as CmsContributor[] | null) ?? []).sort(
      (left, right) => left.display_name.localeCompare(right.display_name),
    );
    const nextArticles = (articlesResult.data as CmsArticleRecord[] | null) ?? [];

    setCategories(nextCategories);
    setContributors(nextContributors);
    setArticles(nextArticles);

    const preferredId =
      preferredArticleId === undefined ? selectedArticleId : preferredArticleId;
    const matchedArticle = preferredId
      ? nextArticles.find((article) => article.id === preferredId) ?? null
      : nextArticles[0] ?? null;

    if (matchedArticle) {
      setSelectedArticleId(matchedArticle.id);
      setEditorState(articleToEditorState(matchedArticle, nextCategories, nextContributors));
      setSlugWasEdited(true);
    } else {
      setSelectedArticleId(null);
      setEditorState(createEmptyEditorState(nextCategories, nextContributors));
      setSlugWasEdited(false);
    }

    setIsLoading(false);
    setIsRefreshing(false);
  }

  function beginCreateArticle() {
    setSelectedArticleId(null);
    setEditorState(createEmptyEditorState(categories, contributors));
    setSlugWasEdited(false);
  }

  function openCreatePage() {
    beginCreateArticle();
    navigateToPage("create");
  }

  function handleSelectArticle(article: CmsArticleRecord) {
    setSelectedArticleId(article.id);
    setEditorState(articleToEditorState(article, categories, contributors));
    setSlugWasEdited(true);
    setActiveNav("edit");
  }

  function updateField<Key extends keyof CmsArticleEditorState>(
    key: Key,
    value: CmsArticleEditorState[Key],
  ) {
    setEditorState((current) => ({ ...current, [key]: value }));
  }

  function handleTitleChange(value: string) {
    setEditorState((current) => ({
      ...current,
      title: value,
      slug: slugWasEdited ? current.slug : createSlug(value),
    }));
  }

  function handleImageSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;

    updateField("selectedImageFile", file);
    if (!editorState.imageAlt.trim()) {
      updateField("imageAlt", editorState.title || file.name.replace(/\.[^.]+$/, ""));
    }
  }

  async function uploadCoverImage(slug: string) {
    if (!editorState.selectedImageFile) {
      return {
        coverAssetId: editorState.coverAssetId,
        imageUrl: editorState.imageUrl,
      };
    }

    const file = editorState.selectedImageFile;
    const extension = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
    const storagePath = `articles/${slug}-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("public-media")
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicData } = supabase.storage.from("public-media").getPublicUrl(storagePath);

    const { data: assetData, error: assetError } = await supabase
      .from("media_assets")
      .insert({
        uploaded_by: user.id,
        bucket_name: "public-media",
        storage_path: storagePath,
        public_url: publicData.publicUrl,
        alt_text: editorState.imageAlt.trim() || null,
        kind: "image",
        mime_type: file.type || null,
        file_size_bytes: file.size,
        metadata: {
          original_name: file.name,
          source: "dashboard-article-cover",
        },
        is_public: true,
      })
      .select("id, public_url")
      .single();

    if (assetError || !assetData) {
      throw assetError ?? new Error("Unable to create media asset.");
    }

    return {
      coverAssetId: assetData.id as string,
      imageUrl: (assetData.public_url as string | null) ?? publicData.publicUrl,
    };
  }

  async function saveArticle(statusOverride?: CmsArticleStatus) {
    const nextStatus = statusOverride ?? editorState.status;
    const trimmedTitle = editorState.title.trim();
    const slug = createSlug(editorState.slug || trimmedTitle);
    const selectedCategoryRecord =
      categories.find((category) => category.id === editorState.categoryId) ?? null;
    const selectedContributor =
      contributors.find((contributor) => contributor.id === editorState.authorId) ?? null;
    const bodyHtml = editorState.bodyHtml.trim();
    const bodyText = htmlToPlainText(bodyHtml);
    const excerpt = editorState.excerpt.trim() || bodyText.slice(0, 180);

    if (!trimmedTitle) {
      toast.error("Article title is required.");
      return;
    }

    if (!slug) {
      toast.error("Please provide a valid slug.");
      return;
    }

    if (!selectedCategoryRecord) {
      toast.error("Please select a category.");
      return;
    }

    if (!selectedContributor) {
      toast.error("Please select an author.");
      return;
    }

    if (!excerpt) {
      toast.error("Add a short excerpt before saving.");
      return;
    }

    if (!bodyText) {
      toast.error("Article content cannot be empty.");
      return;
    }

    const publishedAt =
      nextStatus === "published"
        ? fromDateTimeLocal(editorState.publishedAt) ?? new Date().toISOString()
        : fromDateTimeLocal(editorState.publishedAt);
    const scheduledFor =
      nextStatus === "scheduled" ? fromDateTimeLocal(editorState.scheduledFor) : null;

    if (nextStatus === "scheduled" && !scheduledFor) {
      toast.error("Scheduled articles need a publish date and time.");
      return;
    }

    setIsSaving(true);

    try {
      const uploadedCover = await uploadCoverImage(slug);
      const payload = {
        title: trimmedTitle,
        slug,
        subtitle: editorState.subtitle.trim() || null,
        excerpt,
        body_html: bodyHtml,
        body_text: bodyText,
        category_id: selectedCategoryRecord.id,
        category: selectedCategoryRecord.title,
        author_name: selectedContributor.display_name,
        image_url: uploadedCover.imageUrl || null,
        featured_image_alt: editorState.imageAlt.trim() || null,
        status: nextStatus,
        editorial_priority: editorState.editorialPriority,
        allow_comments: editorState.allowComments,
        scheduled_for: scheduledFor,
        published_at: publishedAt,
        cover_asset_id: uploadedCover.coverAssetId,
        updated_by: user.id,
      };

      let savedArticleId = editorState.id;

      if (editorState.id) {
        const { error } = await supabase.from("articles").update(payload).eq("id", editorState.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("articles")
          .insert({
            ...payload,
            created_by: user.id,
          })
          .select("id")
          .single();

        if (error || !data) throw error ?? new Error("Unable to create article.");
        savedArticleId = data.id as string;
      }

      if (!savedArticleId) {
        throw new Error("Article save did not return an id.");
      }

      const { error: deleteAuthorError } = await supabase
        .from("article_authors")
        .delete()
        .eq("article_id", savedArticleId);

      if (deleteAuthorError) throw deleteAuthorError;

      const { error: authorLinkError } = await supabase.from("article_authors").insert({
        article_id: savedArticleId,
        contributor_id: selectedContributor.id,
        credit_label: "Author",
        display_order: 1,
        is_primary: true,
      });

      if (authorLinkError) throw authorLinkError;

      if (uploadedCover.coverAssetId) {
        await supabase
          .from("media_assets")
          .update({
            alt_text: editorState.imageAlt.trim() || null,
          })
          .eq("id", uploadedCover.coverAssetId);
      }

      toast.success(editorState.id ? "Article updated." : "Article created.");
      await loadDashboard(savedArticleId);
    } catch (error: any) {
      toast.error(error?.message ?? "Unable to save the article.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteArticle() {
    if (!articleToDelete) return;

    setIsDeleting(true);

    try {
      const { error } = await supabase.from("articles").delete().eq("id", articleToDelete.id);
      if (error) throw error;

      toast.success("Article deleted.");
      setArticleToDelete(null);
      await loadDashboard(null);
    } catch (error: any) {
      toast.error(error?.message ?? "Unable to delete the article.");
    } finally {
      setIsDeleting(false);
    }
  }

  const articleTitle = editorState.title.trim() || "Untitled article";
  const sidebarItems = [
    {
      id: "overview" as const,
      label: "Overview",
      icon: LayoutDashboard,
      onClick: () => navigateToPage("overview"),
    },
    {
      id: "create" as const,
      label: "Create Article",
      icon: FilePlus2,
      onClick: openCreatePage,
    },
    {
      id: "edit" as const,
      label: "Edit Article",
      icon: PencilLine,
      onClick: () => navigateToPage("edit"),
    },
    {
      id: "delete" as const,
      label: "Delete Article",
      icon: Trash2,
      onClick: () => navigateToPage("delete"),
    },
    {
      id: "analytics" as const,
      label: "Website Analytics",
      icon: BarChart3,
      onClick: () => navigateToPage("analytics"),
    },
    {
      id: "performance" as const,
      label: "Performance",
      icon: Gauge,
      onClick: () => navigateToPage("performance"),
    },
    {
      id: "settings" as const,
      label: "Settings",
      icon: Settings2,
      onClick: () => navigateToPage("settings"),
    },
  ];

  if (isLoading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-dashboard-frame admin-loading-shell">
          <Skeleton className="h-28 rounded-3xl" />
          <div className="admin-metrics-grid">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-24 rounded-2xl" />
            ))}
          </div>
          <div className="admin-edit-grid">
            <Skeleton className="h-[42rem] rounded-3xl" />
            <Skeleton className="h-[42rem] rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard text-emerald-950">
      <div className="admin-dashboard-glow pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-[-10rem] h-[24rem] w-[24rem] rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="absolute right-[-5rem] top-32 h-[20rem] w-[20rem] rounded-full bg-amber-100/50 blur-3xl" />
        <div className="absolute bottom-[-10rem] left-1/3 h-[18rem] w-[18rem] rounded-full bg-emerald-300/20 blur-3xl" />
      </div>

      <div className="admin-dashboard-frame">
        <div className="admin-shell-layout">
          <aside className="admin-sidebar xl:sticky xl:top-6 xl:self-start">
            <Card className="admin-sidebar-card overflow-hidden border-0 text-white">
              <CardContent className="px-5 py-6">
                <div className="admin-sidebar-brand">
                  <p className="font-trajan text-xs uppercase tracking-[0.34em] text-emerald-100/70">
                    Amaranth
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold text-white">Admin Menu</h2>
                  <p className="mt-2 text-sm leading-6 text-emerald-50/68">
                    Jump between editorial tools, analytics, and workspace controls.
                  </p>
                </div>

                <div className="mt-5 space-y-2">
                  {sidebarItems.map(({ id, label, icon: Icon, onClick }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={onClick}
                      data-active={activeNav === id}
                      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                        activeNav === id
                          ? "bg-white text-emerald-950 shadow-[0_18px_50px_-36px_rgba(8,31,22,0.9)]"
                          : "bg-white/6 text-emerald-50/85 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Icon className="size-4" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>

                <div className="admin-sidebar-workspace">
                  <p className="text-xs uppercase tracking-[0.28em] text-emerald-100/55">
                    Workspace
                  </p>
                  <p className="mt-3 text-sm font-medium text-white">{user.name}</p>
                  <p className="mt-1 text-sm text-emerald-50/65">{user.email ?? "No email on profile"}</p>

                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4 w-full border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
                    onClick={onLogout}
                  >
                    <LogOut className="size-4" />
                    Logout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </aside>

          <div className="admin-main-content">
            {activeNav === "overview" ? (
            <section id="overview-section" className="admin-section">
        <Card className="admin-hero overflow-hidden border-none text-white">
          <CardContent className="admin-hero-content">
            <div className="admin-hero-layout">
              <div className="admin-hero-copy">
                <Badge className="border border-white/15 bg-white/12 text-white hover:bg-white/12">
                  <Sparkles className="size-3.5" />
                  Editorial Workspace
                </Badge>
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                    Amaranth Admin Dashboard
                  </h1>
                  <p className="max-w-3xl text-sm leading-6 text-emerald-50/85 sm:text-base">
                    Create, revise, schedule, and publish stories with a consistent newsroom
                    workflow. Authors, categories, cover images, and article status all live in
                    one place.
                  </p>
                </div>
              </div>
              <div className="admin-hero-actions">
                <Button
                  variant="outline"
                  className="border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white"
                  onClick={() => void loadDashboard(selectedArticleId)}
                  disabled={isRefreshing || isSaving}
                >
                  {isRefreshing ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="size-4" />
                  )}
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  onClick={onLogout}
                >
                  <LogOut className="size-4" />
                  Logout
                </Button>
              </div>
            </div>

            <div className="admin-hero-meta">
              <Badge className="border border-white/15 bg-white/10 text-white hover:bg-white/10">
                {user.role ?? "admin"}
              </Badge>
              <span>{user.name}</span>
              <span className="text-white/40">/</span>
              <span>{user.email ?? "No email on profile"}</span>
            </div>
          </CardContent>
        </Card>

        <div className="admin-metrics-grid">
          <ArticleMetric
            label="Total Articles"
            value={articles.length}
            detail="Every article available in your editorial workspace."
          />
          <ArticleMetric
            label="Published"
            value={publishedCount}
            detail="Stories currently visible on the public site."
          />
          <ArticleMetric
            label="Drafts"
            value={draftCount}
            detail="Pieces still being shaped before review or release."
          />
          <ArticleMetric
            label="Scheduled"
            value={scheduledCount}
            detail="Stories lined up for timed publication."
          />
        </div>

        {loadError ? (
          <Card className="admin-alert-card border-amber-200 bg-amber-50/90">
            <CardContent className="flex items-start gap-3 px-5 py-4 text-amber-900">
              <AlertTriangle className="mt-0.5 size-5 shrink-0" />
              <div>
                <p className="font-medium">Dashboard data could not fully load</p>
                <p className="mt-1 text-sm text-amber-800">{loadError}</p>
              </div>
            </CardContent>
          </Card>
        ) : null}
        <div className="admin-two-column-grid">
          <Card className="admin-subcard border-emerald-100 bg-white shadow-none">
            <CardHeader className="border-b border-emerald-100/80">
              <CardTitle className="text-lg font-semibold text-emerald-950">
                Quick Actions
              </CardTitle>
              <CardDescription>Jump into the next thing your team needs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 py-5">
              <Button
                type="button"
                className="w-full justify-start rounded-full bg-emerald-700 text-white hover:bg-emerald-800"
                onClick={openCreatePage}
              >
                <FilePlus2 className="size-4" />
                Create new article
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start rounded-full border-emerald-200"
                onClick={() => navigateToPage("edit")}
              >
                <PencilLine className="size-4" />
                Open edit queue
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start rounded-full border-emerald-200"
                onClick={() => navigateToPage("analytics")}
              >
                <BarChart3 className="size-4" />
                View analytics
              </Button>
            </CardContent>
          </Card>

          <Card className="admin-subcard border-emerald-100 bg-white shadow-none">
            <CardHeader className="border-b border-emerald-100/80">
              <CardTitle className="text-lg font-semibold text-emerald-950">
                Recent Articles
              </CardTitle>
              <CardDescription>Recently updated stories in your editorial queue.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 py-5">
              {recentArticles.length ? (
                recentArticles.map((article) => (
                  <button
                    key={`recent-${article.id}`}
                    type="button"
                    className="admin-list-row"
                    onClick={() => handleSelectArticle(article)}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-emerald-950">
                        {article.title}
                      </p>
                      <p className="mt-1 text-xs text-emerald-900/60">
                        {article.author_name || "No author"} / {article.slug}
                      </p>
                    </div>
                    <Badge variant={statusBadgeVariant(article.status)}>
                      {statusLabel(article.status)}
                    </Badge>
                  </button>
                ))
              ) : (
                <p className="text-sm text-emerald-900/65">
                  Your latest articles will appear here once content starts flowing in.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
            </section>
            ) : null}

            {activeNav === "edit" || activeNav === "create" ? (
            <section id="edit-article-section" className="admin-section">
        <PageIntro
          eyebrow={activeNav === "create" ? "New Draft" : "Editorial Queue"}
          title={activeNav === "create" ? "Create Article" : "Edit Articles"}
          description={
            activeNav === "create"
              ? "Write a fresh story with a tighter layout, clean metadata, and polished publishing controls."
              : "Browse existing stories, open a draft, and update content without digging through one long page."
          }
          actions={
            activeNav === "create" ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-full border-emerald-200"
                onClick={() => navigateToPage("edit")}
              >
                <PencilLine className="size-4" />
                Open edit queue
              </Button>
            ) : (
              <Button
                type="button"
                className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800"
                onClick={openCreatePage}
              >
                <FilePlus2 className="size-4" />
                New article
              </Button>
            )
          }
        />
        <div className={activeNav === "edit" ? "admin-edit-grid" : "admin-create-layout"}>
          {activeNav === "edit" ? (
          <Card className="admin-library border-0 text-white xl:sticky xl:top-6 xl:self-start">
            <CardHeader className="gap-4 border-b border-white/10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-semibold text-white">
                    Article Library
                  </CardTitle>
                  <CardDescription className="text-emerald-50/70">
                    Browse the newsroom queue and jump into any draft.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  className="rounded-full bg-white text-emerald-950 hover:bg-emerald-50"
                  onClick={openCreatePage}
                >
                  <FilePlus2 className="size-4" />
                  New
                </Button>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/45" />
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search titles, categories, authors"
                    className="h-11 rounded-[18px] border-white/10 bg-white/10 pl-9 text-white placeholder:text-white/45"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as CmsArticleStatus | "all")}
                >
                  <SelectTrigger className="h-11 rounded-[18px] border-white/10 bg-white/10 text-white data-[placeholder]:text-white/45">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {statusLabel(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent className="px-0 pb-0">
              <div className="border-b border-white/8 px-6 py-4 text-sm text-emerald-50/70">
                {filteredArticles.length} article{filteredArticles.length === 1 ? "" : "s"} visible
              </div>
              <ScrollArea className="admin-library-scroll h-[calc(100vh-21rem)] min-h-[28rem]">
                <div className="space-y-2 p-3">
                  {filteredArticles.length ? (
                    filteredArticles.map((article) => {
                      const category = pickSingleRelation<CmsCategory>(article.categories);
                      const primaryAuthor = getContributorFromLink(getPrimaryAuthorLink(article));
                      const isActive = article.id === selectedArticleId;

                      return (
                        <button
                          key={article.id}
                          type="button"
                          onClick={() => handleSelectArticle(article)}
                          data-active={isActive}
                          className={`article-library-item w-full rounded-[24px] border px-4 py-4 text-left transition duration-200 ${
                            isActive
                              ? "border-emerald-300 bg-white text-emerald-950 shadow-[0_20px_50px_-34px_rgba(8,31,22,0.95)]"
                              : "border-white/10 bg-white/6 text-white hover:border-white/20 hover:bg-white/10"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant={statusBadgeVariant(article.status)}>
                                  {statusLabel(article.status)}
                                </Badge>
                                {category ? (
                                  <span className={`text-[11px] font-semibold uppercase tracking-[0.26em] ${
                                    isActive ? "text-emerald-700/75" : "text-emerald-100/60"
                                  }`}>
                                    {category.title}
                                  </span>
                                ) : null}
                              </div>
                              <p className="line-clamp-2 text-sm font-semibold leading-6">
                                {article.title}
                              </p>
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className={`size-8 shrink-0 ${
                                isActive
                                  ? "text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                                  : "text-white/70 hover:bg-white/10 hover:text-white"
                              }`}
                              onClick={(event) => {
                                event.stopPropagation();
                                setArticleToDelete(article);
                              }}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>

                          <p className={`mt-2 line-clamp-2 text-sm ${
                            isActive ? "text-emerald-900/70" : "text-emerald-50/70"
                          }`}>
                            {article.excerpt}
                          </p>

                          <div className={`mt-3 flex flex-wrap items-center gap-2 text-xs ${
                            isActive ? "text-emerald-900/55" : "text-emerald-50/55"
                          }`}>
                            <span>{primaryAuthor?.display_name ?? article.author_name}</span>
                            <span>/</span>
                            <span>{article.slug}</span>
                            <span>/</span>
                            <span>
                              {new Date(article.updated_at).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="admin-library-empty rounded-[26px] border border-dashed border-white/15 bg-white/6 px-5 py-10 text-center">
                      <FileText className="mx-auto size-10 text-emerald-100/60" />
                      <p className="mt-4 text-base font-semibold text-white">Nothing matches yet</p>
                      <p className="mt-2 text-sm text-emerald-50/65">
                        Adjust filters or start a fresh article from the library.
                      </p>
                      <Button
                        type="button"
                        className="mt-5 rounded-full bg-white text-emerald-950 hover:bg-emerald-50"
                        onClick={openCreatePage}
                      >
                        <Plus className="size-4" />
                        Start New Draft
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
          ) : null}

          <div className="space-y-6">
            <Card
              id="create-article-section"
              className="admin-editor admin-editor-card"
            >
              <CardHeader className="border-b border-emerald-100/80 bg-white/55">
                <div className="admin-editor-header">
                  <div className="space-y-2">
                    <div className="admin-editor-status">
                      <Badge variant={statusBadgeVariant(editorState.status)}>
                        {statusLabel(editorState.status)}
                      </Badge>
                      {selectedCategory ? (
                        <span className="text-xs font-medium uppercase tracking-[0.22em] text-emerald-700/70">
                          {categoryDisplayName(selectedCategory)}
                        </span>
                      ) : null}
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-semibold text-emerald-950">
                        {articleTitle}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {selectedArticleId
                          ? "Editing an existing article in the CMS."
                          : "Build a new story with category, author, and cover image."}
                      </CardDescription>
                    </div>
                  </div>

                  <div className="admin-editor-metrics">
                    <div className="admin-editor-stat">
                      <p className="text-xs uppercase tracking-[0.2em] text-emerald-700/70">
                        Word Count
                      </p>
                      <p className="mt-1 font-semibold text-emerald-950">{wordCount}</p>
                    </div>
                    <div className="admin-editor-stat">
                      <p className="text-xs uppercase tracking-[0.2em] text-emerald-700/70">
                        Selected Author
                      </p>
                      <p className="mt-1 truncate font-semibold text-emerald-950">
                        {selectedAuthor?.display_name ?? "Not set"}
                      </p>
                    </div>
                    <div className="admin-editor-stat">
                      <p className="text-xs uppercase tracking-[0.2em] text-emerald-700/70">
                        Visibility
                      </p>
                      <p className="mt-1 font-semibold text-emerald-950">
                        {editorState.allowComments ? "Comments Open" : "Comments Off"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 py-6 lg:py-8">
                <section className="admin-editor-section admin-form-grid">
                  <div className="space-y-2 admin-span-full">
                    <Label htmlFor="article-title">Headline</Label>
                    <Input
                      id="article-title"
                      value={editorState.title}
                      onChange={(event) => handleTitleChange(event.target.value)}
                      placeholder="Enter a compelling headline"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="article-slug">Slug</Label>
                    <Input
                      id="article-slug"
                      value={editorState.slug}
                      onChange={(event) => {
                        setSlugWasEdited(true);
                        updateField("slug", createSlug(event.target.value));
                      }}
                      placeholder="article-slug"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="article-subtitle">Subtitle</Label>
                    <Input
                      id="article-subtitle"
                      value={editorState.subtitle}
                      onChange={(event) => updateField("subtitle", event.target.value)}
                      placeholder="Optional supporting line"
                    />
                  </div>

                  <div className="space-y-2 admin-span-full">
                    <Label htmlFor="article-excerpt">Excerpt</Label>
                    <Textarea
                      id="article-excerpt"
                      rows={4}
                      value={editorState.excerpt}
                      onChange={(event) => updateField("excerpt", event.target.value)}
                      placeholder="Short teaser for cards, search, and social previews"
                    />
                  </div>
                </section>

                <Separator className="opacity-60" />

                <section className="admin-editor-section admin-body-stack">
                  <div>
                    <h2 className="text-lg font-semibold text-emerald-950">Story Body</h2>
                    <p className="text-sm text-emerald-900/65">
                      Draft the article content using the editor below.
                    </p>
                  </div>
                  <RichTextEditor
                    value={editorState.bodyHtml}
                    onChange={(value) => updateField("bodyHtml", value)}
                    placeholder="Write the full article here..."
                  />
                </section>

                <Separator className="opacity-60" />

                <section className="admin-media-settings-grid">
                  <Card className="admin-inline-card admin-subcard admin-cover-card border-emerald-100 bg-stone-50/70 shadow-none">
                    <CardHeader className="border-b border-emerald-100/80">
                      <CardTitle className="text-lg font-semibold text-emerald-950">
                        Cover Image
                      </CardTitle>
                      <CardDescription>
                        Upload the image that will appear on cards and article headers.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 py-6">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageSelected}
                      />

                      <div className="admin-cover-dropzone overflow-hidden rounded-3xl border border-dashed border-emerald-200 bg-white">
                        {coverImageSrc ? (
                          <img
                            src={coverImageSrc}
                            alt={editorState.imageAlt || articleTitle}
                            className="h-64 w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-64 flex-col items-center justify-center px-6 text-center text-emerald-800/70">
                            <ImagePlus className="size-10 text-emerald-700/60" />
                            <p className="mt-4 font-medium">No cover selected yet</p>
                            <p className="mt-1 max-w-sm text-sm">
                              Add a strong visual so articles feel polished across the website.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <UploadCloud className="size-4" />
                          {editorState.selectedImageFile || editorState.imageUrl
                            ? "Replace Image"
                            : "Upload Image"}
                        </Button>
                        {(editorState.selectedImageFile || editorState.imageUrl) && (
                          <Button
                            type="button"
                            variant="ghost"
                            className="text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                            onClick={() => {
                              updateField("selectedImageFile", null);
                              updateField("imageUrl", "");
                              updateField("coverAssetId", null);
                              if (fileInputRef.current) {
                                fileInputRef.current.value = "";
                              }
                            }}
                          >
                            <Trash2 className="size-4" />
                            Remove Image
                          </Button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="image-alt">Image Alt Text</Label>
                        <Input
                          id="image-alt"
                          value={editorState.imageAlt}
                          onChange={(event) => updateField("imageAlt", event.target.value)}
                          placeholder="Describe the image for accessibility"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="admin-inline-card admin-subcard admin-publish-card border-emerald-100 bg-stone-50/70 shadow-none">
                    <CardHeader className="border-b border-emerald-100/80">
                      <CardTitle className="text-lg font-semibold text-emerald-950">
                        Publish Settings
                      </CardTitle>
                      <CardDescription>
                        Set ownership, section placement, and release timing.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 py-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <Label htmlFor="article-category">Category</Label>
                          {selectedCategory ? (
                            <span className="text-xs text-emerald-800/60">
                              {getCategorySection(selectedCategory)?.name ?? "Section"}
                            </span>
                          ) : null}
                        </div>
                        <Select
                          value={editorState.categoryId}
                          onValueChange={(value) => updateField("categoryId", value)}
                        >
                          <SelectTrigger id="article-category">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {categoryDisplayName(category)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <Label htmlFor="article-author">Author</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                            onClick={() => setIsAuthorDialogOpen(true)}
                          >
                            <UserRoundPlus className="size-4" />
                            New author
                          </Button>
                        </div>
                        <Select
                          value={editorState.authorId}
                          onValueChange={(value) => updateField("authorId", value)}
                        >
                          <SelectTrigger id="article-author">
                            <SelectValue placeholder="Select an author" />
                          </SelectTrigger>
                          <SelectContent>
                            {contributors.map((contributor) => (
                              <SelectItem key={contributor.id} value={contributor.id}>
                                {contributor.display_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="article-status">Status</Label>
                          <Select
                            value={editorState.status}
                            onValueChange={(value) =>
                              updateField("status", value as CmsArticleStatus)
                            }
                          >
                            <SelectTrigger id="article-status">
                              <SelectValue placeholder="Select a status" />
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {statusLabel(status)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="editor-priority">Editorial Priority</Label>
                          <Input
                            id="editor-priority"
                            type="number"
                            min={0}
                            max={100}
                            value={editorState.editorialPriority}
                            onChange={(event) =>
                              updateField(
                                "editorialPriority",
                                Math.max(0, Math.min(100, Number(event.target.value) || 0)),
                              )
                            }
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="article-published-at">Published At</Label>
                          <div className="relative">
                            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-emerald-800/50" />
                            <Input
                              id="article-published-at"
                              type="datetime-local"
                              className="pl-9"
                              value={editorState.publishedAt}
                              onChange={(event) =>
                                updateField("publishedAt", event.target.value)
                              }
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="article-scheduled-for">Scheduled For</Label>
                          <div className="relative">
                            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-emerald-800/50" />
                            <Input
                              id="article-scheduled-for"
                              type="datetime-local"
                              className="pl-9"
                              value={editorState.scheduledFor}
                              onChange={(event) =>
                                updateField("scheduledFor", event.target.value)
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <div className="admin-comments-toggle flex items-center justify-between rounded-2xl border border-emerald-100 bg-white px-4 py-3">
                        <div>
                          <p className="font-medium text-emerald-950">Allow comments</p>
                          <p className="text-sm text-emerald-900/60">
                            Turn on reader discussion for this story.
                          </p>
                        </div>
                        <Switch
                          checked={editorState.allowComments}
                          onCheckedChange={(checked) => updateField("allowComments", checked)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </section>
              </CardContent>

              <CardFooter className="admin-editor-footer flex flex-col gap-3 border-t border-emerald-100/80 bg-stone-50/70 py-5 sm:flex-row sm:justify-between">
                <div className="text-sm text-emerald-900/60">
                  {selectedArticleId
                    ? "Changes save directly to the selected article."
                    : "A new article will be created when you save."}
                </div>
                <div className="admin-editor-actions">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void saveArticle("draft")}
                    disabled={isSaving}
                  >
                    {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                    Save Draft
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void saveArticle()}
                    disabled={isSaving}
                    className="border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                  >
                    {isSaving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <PencilLine className="size-4" />
                    )}
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    className="bg-emerald-700 text-white hover:bg-emerald-800"
                    onClick={() => void saveArticle("published")}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Plus className="size-4" />
                    )}
                    Publish Article
                  </Button>
                </div>
              </CardFooter>
            </Card>

            <Card className="admin-summary">
              <CardContent className="admin-summary-grid">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700/70">
                    Slug Preview
                  </p>
                  <p className="mt-2 break-all text-sm text-emerald-950">{editorState.slug || "article-slug"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700/70">
                    Category Placement
                  </p>
                  <p className="mt-2 text-sm text-emerald-950">
                    {selectedCategory ? categoryDisplayName(selectedCategory) : "No category yet"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700/70">
                    Writer Credit
                  </p>
                  <p className="mt-2 text-sm text-emerald-950">
                    {selectedAuthor?.display_name ?? "No author selected"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
            </section>
            ) : null}

            {activeNav === "delete" ? (
            <section id="delete-article-section" className="admin-section">
              <PageIntro
                eyebrow="Content Cleanup"
                title="Delete Articles"
                description="Remove outdated, incorrect, or test content from the CMS with a calmer review flow."
              />
              <Card className="admin-summary">
                <CardHeader className="border-b border-emerald-100/80">
                  <CardTitle className="text-2xl font-semibold text-emerald-950">
                    Delete Article
                  </CardTitle>
                  <CardDescription>
                    Review articles and remove outdated or incorrect content from the CMS.
                  </CardDescription>
                </CardHeader>
                <CardContent className="admin-delete-grid">
                  {articles.length ? (
                    articles.map((article) => (
                      <div
                        key={`delete-${article.id}`}
                        className="admin-delete-card"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2">
                            <Badge variant={statusBadgeVariant(article.status)}>
                              {statusLabel(article.status)}
                            </Badge>
                            <h3 className="text-lg font-semibold text-emerald-950">
                              {article.title}
                            </h3>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            className="rounded-full text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                            onClick={() => setArticleToDelete(article)}
                          >
                            <Trash2 className="size-4" />
                            Delete
                          </Button>
                        </div>

                        <p className="mt-3 line-clamp-2 text-sm text-emerald-900/70">
                          {article.excerpt}
                        </p>
                        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-emerald-900/55">
                          <span>{article.author_name}</span>
                          <span>/</span>
                          <span>{article.slug}</span>
                          <span>/</span>
                          <span>
                            {new Date(article.updated_at).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="admin-empty-state">
                      <Trash2 className="mx-auto size-10 text-emerald-700/55" />
                      <p className="mt-4 text-base font-semibold text-emerald-950">
                        No articles available to delete
                      </p>
                      <p className="mt-2 text-sm text-emerald-900/65">
                        Create articles first, then manage removal from this section.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
            ) : null}

            {activeNav === "analytics" ? (
            <section id="analytics-section" className="admin-section">
              <PageIntro
                eyebrow="Insights"
                title="Website Analytics"
                description="See the current editorial distribution of your articles, authors, and categories in a cleaner dashboard view."
              />
              <Card className="admin-summary">
                <CardHeader className="border-b border-emerald-100/80">
                  <CardTitle className="text-2xl font-semibold text-emerald-950">
                    Website Analytics
                  </CardTitle>
                  <CardDescription>
                    Editorial signals based on your current article inventory and publishing flow.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 px-6 py-6">
                  <div className="admin-metrics-grid">
                    <ArticleMetric
                      label="Published"
                      value={publishedCount}
                      detail="Stories now visible on the public site."
                    />
                    <ArticleMetric
                      label="With Cover"
                      value={articlesWithCoverCount}
                      detail="Articles carrying a featured image."
                    />
                    <ArticleMetric
                      label="Contributors"
                      value={contributors.length}
                      detail="Active bylines available in the CMS."
                    />
                    <ArticleMetric
                      label="Categories"
                      value={categories.length}
                      detail="Current sections and assignable beats."
                    />
                  </div>

                  <div className="admin-two-column-grid">
                    <Card className="admin-subcard border-emerald-100 bg-white shadow-none">
                      <CardHeader className="border-b border-emerald-100/80">
                        <CardTitle className="text-lg font-semibold text-emerald-950">
                          Top Categories
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 py-5">
                        {categoryDistribution.length ? (
                          categoryDistribution.map((category) => (
                            <div
                              key={category.id}
                              className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3"
                            >
                              <span className="font-medium text-emerald-950">{category.title}</span>
                              <Badge>{category.count}</Badge>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-emerald-900/65">
                            Category analytics will appear once articles are organized.
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="admin-subcard border-emerald-100 bg-white shadow-none">
                      <CardHeader className="border-b border-emerald-100/80">
                        <CardTitle className="text-lg font-semibold text-emerald-950">
                          Top Authors
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 py-5">
                        {authorDistribution.length ? (
                          authorDistribution.map((author) => (
                            <div
                              key={author.id}
                              className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3"
                            >
                              <span className="font-medium text-emerald-950">{author.name}</span>
                              <Badge>{author.count}</Badge>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-emerald-900/65">
                            Author analytics will appear once contributor-linked stories exist.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </section>
            ) : null}

            {activeNav === "performance" ? (
            <section id="performance-section" className="admin-section">
              <PageIntro
                eyebrow="Readiness"
                title="Performance"
                description="Track workflow health, article completeness, and publishing readiness without the clutter of the other admin tools."
              />
              <Card className="admin-summary">
                <CardHeader className="border-b border-emerald-100/80">
                  <CardTitle className="text-2xl font-semibold text-emerald-950">
                    Performance
                  </CardTitle>
                  <CardDescription>
                    Editorial health and readiness indicators for your newsroom workflow.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 px-6 py-6">
                  <div className="admin-metrics-grid">
                    <ArticleMetric
                      label="Content Health"
                      value={averageContentHealth}
                      detail="Average completion score across all articles."
                    />
                    <ArticleMetric
                      label="Avg Words"
                      value={averageWordCount}
                      detail="Average article body length in the CMS."
                    />
                    <ArticleMetric
                      label="Draft Ratio"
                      value={articles.length ? Math.round((draftCount / articles.length) * 100) : 0}
                      detail="Percent of all articles still in draft state."
                    />
                    <ArticleMetric
                      label="Cover Ratio"
                      value={
                        articles.length
                          ? Math.round((articlesWithCoverCount / articles.length) * 100)
                          : 0
                      }
                      detail="Percent of stories with a cover image set."
                    />
                  </div>

                  <Card className="admin-subcard border-emerald-100 bg-white shadow-none">
                    <CardHeader className="border-b border-emerald-100/80">
                      <CardTitle className="text-lg font-semibold text-emerald-950">
                        Workflow Watchlist
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 py-5">
                      {articles.filter((article) => article.status !== "published").length ? (
                        articles
                          .filter((article) => article.status !== "published")
                          .slice(0, 5)
                          .map((article) => (
                            <div
                              key={`watch-${article.id}`}
                              className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="font-medium text-emerald-950">{article.title}</p>
                                <Badge variant={statusBadgeVariant(article.status)}>
                                  {statusLabel(article.status)}
                                </Badge>
                              </div>
                              <p className="mt-2 text-sm text-emerald-900/65">
                                Updated {new Date(article.updated_at).toLocaleDateString()}
                              </p>
                            </div>
                          ))
                      ) : (
                        <p className="text-sm text-emerald-900/65">
                          Your workflow is clean right now. No unpublished stories need attention.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </section>
            ) : null}

            {activeNav === "settings" ? (
            <section id="settings-section" className="admin-section">
              <PageIntro
                eyebrow="Workspace"
                title="Settings"
                description="Review account details, confirm CMS connectivity, and jump into the admin actions that matter most."
              />
              <Card className="admin-summary">
                <CardHeader className="border-b border-emerald-100/80">
                  <CardTitle className="text-2xl font-semibold text-emerald-950">
                    Settings
                  </CardTitle>
                  <CardDescription>
                    Workspace information, connection status, and editorial controls.
                  </CardDescription>
                </CardHeader>
                <CardContent className="admin-settings-grid">
                  <Card className="admin-subcard border-emerald-100 bg-white shadow-none">
                    <CardHeader className="border-b border-emerald-100/80">
                      <CardTitle className="text-lg font-semibold text-emerald-950">
                        Account
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 py-5 text-sm text-emerald-900/70">
                      <p><strong>Name:</strong> {user.name}</p>
                      <p><strong>Email:</strong> {user.email ?? "No email on profile"}</p>
                      <p><strong>Role:</strong> {user.role ?? "admin"}</p>
                    </CardContent>
                  </Card>

                  <Card className="admin-subcard border-emerald-100 bg-white shadow-none">
                    <CardHeader className="border-b border-emerald-100/80">
                      <CardTitle className="text-lg font-semibold text-emerald-950">
                        Workspace State
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 py-5 text-sm text-emerald-900/70">
                      <p><strong>Supabase:</strong> {isSupabaseConfigured ? "Connected" : "Not configured"}</p>
                      <p><strong>Articles:</strong> {articles.length}</p>
                      <p><strong>Contributors:</strong> {contributors.length}</p>
                      <p><strong>Categories:</strong> {categories.length}</p>
                    </CardContent>
                  </Card>

                  <Card className="admin-subcard border-emerald-100 bg-white shadow-none">
                    <CardHeader className="border-b border-emerald-100/80">
                      <CardTitle className="text-lg font-semibold text-emerald-950">
                        Quick Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 py-5">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start rounded-full border-emerald-200"
                        onClick={() => void loadDashboard(selectedArticleId)}
                      >
                        <RefreshCw className="size-4" />
                        Refresh data
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start rounded-full border-emerald-200"
                        onClick={openCreatePage}
                      >
                        <FilePlus2 className="size-4" />
                        Start new article
                      </Button>
                      <Button
                        type="button"
                        className="w-full justify-start rounded-full bg-emerald-700 text-white hover:bg-emerald-800"
                        onClick={onLogout}
                      >
                        <LogOut className="size-4" />
                        Logout
                      </Button>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </section>
            ) : null}
          </div>
        </div>

        <AuthorCreateDialog
          isOpen={isAuthorDialogOpen}
          onClose={() => setIsAuthorDialogOpen(false)}
          onCreated={(author) => {
            setContributors((current) =>
              [...current, author].sort((left, right) =>
                left.display_name.localeCompare(right.display_name),
              ),
            );
            setEditorState((current) => ({ ...current, authorId: author.id }));
            setIsAuthorDialogOpen(false);
          }}
        />

        <AlertDialog
          open={Boolean(articleToDelete)}
          onOpenChange={(open) => {
            if (!open) setArticleToDelete(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete article?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove{" "}
                <span className="font-medium text-foreground">
                  {articleToDelete?.title ?? "this article"}
                </span>{" "}
                from the dashboard.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(event) => {
                  event.preventDefault();
                  void handleDeleteArticle();
                }}
                disabled={isDeleting}
                className="bg-rose-700 text-white hover:bg-rose-800"
              >
                {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
