import { useParams } from 'react-router-dom';
import { ErrorState } from '@/components/ui/Feedback';
import { env } from '@/lib/env';
import { publicUrl } from '@/lib/media';
import { usePageMeta } from '@/lib/usePageMeta';
import { NotFoundPage } from '../NotFoundPage';
import { useSiteSettings } from '../settings';
import { ArticleSkeleton, ArticleView } from './ArticleView';
import { useArticle, useComments, useRelated, useSubmitComment } from './articleData';
import { Comments } from './Comments';
import { useRecordView } from './useRecordView';

export function ArticlePage() {
  const { slug = '' } = useParams();
  const article = useArticle(slug);
  const data = article.data ?? null;
  const related = useRelated(data);
  const settings = useSiteSettings();
  const commentsEnabled = (settings.data?.comments as { enabled?: boolean } | undefined)?.enabled !== false;
  const comments = useComments(data?.id, Boolean(data?.isLive));
  const submit = useSubmitComment(data?.id ?? '');
  useRecordView(data?.id, Boolean(data?.isLive));
  usePageMeta({
    title: data ? data.seoTitle || data.title : article.data === null ? 'Page not found' : undefined,
    description: data ? data.seoDescription || data.dek || data.excerpt : undefined,
    path: `/article/${slug}`,
    image: data?.cover ? publicUrl(data.cover.bucket, data.cover.path) : null,
    type: 'article',
  });

  if (article.isPending) return <ArticleSkeleton />;
  if (article.error) {
    return (
      <div className="container-page py-16">
        <h1 className="sr-only">Article</h1>
        <ErrorState title="We couldn’t load this article" error={article.error} onRetry={() => void article.refetch()} />
      </div>
    );
  }
  if (!data) return <NotFoundPage />;

  return (
    <ArticleView
      article={data}
      url={`${env.siteUrl}/article/${data.slug}`}
      related={related.data ?? []}
      comments={
        data.isLive ? (
          <Comments
            comments={comments.data ?? []}
            loading={comments.isPending}
            open={data.allowComments && commentsEnabled}
            onSubmit={(input) => submit.mutateAsync(input)}
          />
        ) : null
      }
    />
  );
}
