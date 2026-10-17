import { EmptyState } from '@/components/ui/Feedback';
import { useDocumentTitle } from '@/lib/useDocumentTitle';
import { CmsPageHeader } from './ui';

/** Placeholder for CMS screens that land in later feature branches. */
export function ComingSoon({ title, feature }: { title: string; feature: string }) {
  useDocumentTitle(title);
  return (
    <div className="flex flex-col gap-6">
      <CmsPageHeader title={title} />
      <EmptyState title="This screen is on its way">It is being rebuilt in {feature}.</EmptyState>
    </div>
  );
}
