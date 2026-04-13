import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Loader, MessageCircle, Send, Share2 } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { LoadingScreen } from "../LoadingScreen";
import { supabase } from "../../lib/supabase";
import { formatCoverCredits, joinDisplayNames, normalizeCoverCredits, textToHtml } from "../../lib/cms";
import type { Article, ArticleComment, CmsArticleAuthorLink, CmsArticleMediaRecord, CmsContributor } from "../../types/database";

type ArticleCategory = {
  title: string;
  slug: string;
  description: string | null;
};

type ArticlePageRecord = Article & {
  categories?: ArticleCategory | ArticleCategory[] | null;
};

type ArticleAuthorRecord = CmsArticleAuthorLink & {
  contributors?: CmsContributor | CmsContributor[] | null;
};

export function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<ArticlePageRecord | null>(null);
  const [authorLinks, setAuthorLinks] = useState<ArticleAuthorRecord[]>([]);
  const [articleMedia, setArticleMedia] = useState<CmsArticleMediaRecord[]>([]);
  const [comments, setComments] = useState<ArticleComment[]>([]);
  const [commentName, setCommentName] = useState("");
  const [commentEmail, setCommentEmail] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      void fetchArticle(id);
    }
  }, [id]);

  async function fetchArticle(articleId: string) {
    try {
      setLoading(true);
      setError(null);

      const { data, error: articleError } = await supabase
        .from("articles")
        .select(
          `
            *,
            categories (title, slug, description)
          `,
        )
        .eq("id", articleId)
        .single();

      if (articleError || !data) {
        setError(articleError?.message ?? "Article not found.");
        return;
      }

      setArticle(data as ArticlePageRecord);

      const [authorResult, mediaResult, commentResult] = await Promise.all([
        supabase
          .from("article_authors")
          .select(
            `
              contributor_id,
              display_order,
              is_primary,
              credit_label,
              contributors (
                id,
                display_name,
                slug,
                email,
                contributor_type,
                is_active
              )
            `,
          )
          .eq("article_id", articleId)
          .order("display_order", { ascending: true }),
        supabase
          .from("article_media")
          .select("asset_id, usage, sort_order, caption, credit")
          .eq("article_id", articleId)
          .eq("usage", "cover")
          .order("sort_order", { ascending: true }),
        supabase
          .from("article_comments")
          .select("id, article_id, author_name, author_email, body, status, created_at")
          .eq("article_id", articleId)
          .eq("status", "approved")
          .order("created_at", { ascending: false }),
      ]);

      setAuthorLinks((authorResult.data as ArticleAuthorRecord[] | null) ?? []);
      setArticleMedia((mediaResult.data as CmsArticleMediaRecord[] | null) ?? []);
      setComments((commentResult.data as ArticleComment[] | null) ?? []);
    } catch {
      setError("Failed to load article.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!article) return;

    const trimmedName = commentName.trim();
    const trimmedBody = commentBody.trim();

    if (!trimmedName || !trimmedBody) {
      setError("Please provide your name and comment before submitting.");
      return;
    }

    try {
      setSubmittingComment(true);
      setError(null);

      const { data, error: insertError } = await supabase
        .from("article_comments")
        .insert({
          article_id: article.id,
          author_name: trimmedName,
          author_email: commentEmail.trim() || null,
          body: trimmedBody,
          status: "approved",
        })
        .select("id, article_id, author_name, author_email, body, status, created_at")
        .single();

      if (insertError) throw insertError;

      if (data) {
        setComments((current) => [data as ArticleComment, ...current]);
      }

      setCommentName("");
      setCommentEmail("");
      setCommentBody("");
    } catch (submissionError: any) {
      setError(submissionError?.message ?? "Unable to submit comment right now.");
    } finally {
      setSubmittingComment(false);
    }
  }

  const category = useMemo(() => {
    if (!article?.categories) return null;
    return Array.isArray(article.categories) ? article.categories[0] ?? null : article.categories;
  }, [article]);

  const articleAuthors = useMemo(() => {
    if (!authorLinks.length) return [];

    return authorLinks
      .map((link) => {
        const contributor = Array.isArray(link.contributors)
          ? link.contributors[0] ?? null
          : link.contributors ?? null;

        return contributor?.display_name ?? "";
      })
      .filter(Boolean);
  }, [authorLinks]);

  const byline = articleAuthors.length
    ? joinDisplayNames(articleAuthors)
    : article?.author_name ?? "Amaranth Staff";

  const richBody = article?.body_html?.trim()
    ? article.body_html
    : textToHtml(article?.body_text ?? article?.contents ?? "");

  const coverCredits = article ? normalizeCoverCredits(article.meta) : [];
  const coverCreditText =
    formatCoverCredits(coverCredits) || articleMedia.find((item) => item.credit)?.credit || "";

  const formattedDate = article?.published_date
    ? new Date(article.published_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  if (loading) {
    return <LoadingScreen title="AMARANTH" subtitle="Loading article..." minHeightClassName="min-h-[28rem]" />;
  }

  if (error && !article) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="mb-4 text-2xl font-bold">Article Not Found</h1>
            <p className="mb-4 text-red-600">{error}</p>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!article) return null;

  return (
    <div className="bg-[#f6faf5] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 -ml-2 text-emerald-900 hover:bg-emerald-50"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to articles
        </Button>

        <article className="article-reader-shell overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-[0_28px_70px_-44px_rgba(17,61,40,0.45)]">
          <div className="border-b border-emerald-100 bg-gradient-to-br from-white via-emerald-50/60 to-lime-50/50 px-6 py-8 sm:px-10 sm:py-10">
            {category ? (
              <Badge variant="secondary" className="mb-4 bg-emerald-100 text-emerald-900">
                {category.title}
              </Badge>
            ) : null}

            <div className="space-y-4">
              <h1 className="text-[2rem] font-bold leading-tight text-[#00853f] sm:text-[2.5rem]">
                {article.title}
              </h1>
              {article.subtitle ? (
                <p className="max-w-3xl text-lg leading-8 text-emerald-900/75">{article.subtitle}</p>
              ) : null}
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-emerald-100/80 pt-5 text-sm text-emerald-900/70 sm:flex-row sm:items-center sm:justify-between">
              <div className="article-byline flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
                <span className="font-semibold text-emerald-950">By {byline}</span>
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                {formattedDate ? (
                  <span className="inline-flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formattedDate}
                  </span>
                ) : null}
                <Button className="w-fit border-0 !bg-[#00853f] !text-white hover:!bg-[#006c33]">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
          </div>

          {(article.image_url || coverCreditText) && (
            <div className="border-b border-emerald-100 bg-white px-6 py-6 sm:px-10">
              {article.image_url ? (
                <figure className="space-y-3">
                  <img
                    src={article.image_url}
                    alt={article.featured_image_alt || article.title}
                    className="w-full rounded-[1.75rem] border border-emerald-100 object-cover shadow-[0_24px_48px_-36px_rgba(17,61,40,0.45)]"
                  />
                  {coverCreditText ? (
                    <figcaption className="article-photo-credit">
                      <span className="font-medium text-emerald-950">{coverCreditText}</span>
                    </figcaption>
                  ) : null}
                </figure>
              ) : null}
            </div>
          )}

          <div className="px-6 py-8 sm:px-10 sm:py-10">
            <div
              className="article-rich-content ql-editor"
              dangerouslySetInnerHTML={{ __html: richBody }}
            />
          </div>

          <section className="border-t border-emerald-100 bg-gradient-to-br from-white via-emerald-50/45 to-white px-6 py-8 sm:px-10">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-emerald-950">Reader comments</h2>
                  <p className="text-sm text-emerald-900/65">
                    Join the conversation and share your thoughts about this story.
                  </p>
                </div>
              </div>

              <Card className="border-emerald-100 shadow-none">
                <CardContent className="p-5 sm:p-6">
                  <form className="space-y-4" onSubmit={handleSubmitComment}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-emerald-950" htmlFor="comment-name">
                          Name
                        </label>
                        <Input
                          id="comment-name"
                          value={commentName}
                          onChange={(event) => setCommentName(event.target.value)}
                          placeholder="Your name"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-emerald-950" htmlFor="comment-email">
                          Email
                        </label>
                        <Input
                          id="comment-email"
                          type="email"
                          value={commentEmail}
                          onChange={(event) => setCommentEmail(event.target.value)}
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-emerald-950" htmlFor="comment-body">
                        Comment
                      </label>
                      <Textarea
                        id="comment-body"
                        rows={5}
                        value={commentBody}
                        onChange={(event) => setCommentBody(event.target.value)}
                        placeholder="Write your comment here..."
                      />
                    </div>

                    {error ? <p className="text-sm text-rose-700">{error}</p> : null}

                    <Button
                      type="submit"
                      disabled={submittingComment}
                      className="bg-emerald-700 text-white hover:bg-emerald-800"
                    >
                      {submittingComment ? (
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Post comment
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="mt-6 space-y-4">
                {comments.length ? (
                  comments.map((comment) => (
                    <Card key={comment.id} className="border-emerald-100 shadow-none">
                      <CardContent className="p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-emerald-950">{comment.author_name}</p>
                            <p className="text-xs text-emerald-900/60">
                              {new Date(comment.created_at).toLocaleString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                        <p className="mt-4 whitespace-pre-line text-sm leading-7 text-emerald-950/90">
                          {comment.body}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="border-emerald-100 border-dashed bg-white/80 shadow-none">
                    <CardContent className="p-5 text-sm text-emerald-900/65">
                      No comments yet. Be the first reader to respond.
                    </CardContent>
                  </Card>
                )}
              </div>
            </section>
        </article>
      </div>
    </div>
  );
}
