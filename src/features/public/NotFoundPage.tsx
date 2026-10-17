import { Link } from 'react-router-dom';
import { ButtonLink } from '@/components/ui/Button';
import { useDocumentTitle } from '@/lib/useDocumentTitle';
import { sectionPath, useNavSections } from './nav';

/** 404 inside the public layout. */
export function NotFoundPage() {
  useDocumentTitle('Page not found');
  const { primary } = useNavSections();
  return (
    <div className="container-page flex flex-col items-start gap-5 py-16 md:py-24">
      <span className="text-kicker uppercase text-green-500-text">Error 404</span>
      <h1 className="font-serif text-headline-l text-ink md:text-display-l">This page has moved or no longer exists</h1>
      <p className="max-w-xl text-body-l text-ink-muted">
        The link may be old or mistyped. Try one of our sections, or search the archive.
      </p>
      <div className="flex flex-wrap gap-3">
        <ButtonLink to="/">Front page</ButtonLink>
        <ButtonLink to="/search" variant="outline">
          Search
        </ButtonLink>
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-button">
        {primary.map((s) => (
          <li key={s.slug}>
            <Link to={sectionPath(s.slug)} className="text-green-700 hover:underline">
              {s.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
