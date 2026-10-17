import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';
import { buttonClasses } from '@/components/ui/buttonStyles';
import { LogoMark } from '@/components/ui/Logo';
import { publicErrorMessage } from '@/lib/errors';
import { useDocumentTitle } from '@/lib/useDocumentTitle';

/** Last-resort error screen for anything a route throws. */
export function RouteError() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  useDocumentTitle(notFound ? 'Page not found' : 'Something went wrong');

  return (
    <main id="main" className="container-page flex min-h-[70vh] flex-col items-center justify-center gap-5 py-16 text-center">
      <LogoMark className="h-14" />
      <h1 className="font-serif text-headline-l text-ink">{notFound ? 'Page not found' : 'Something went wrong'}</h1>
      <p className="max-w-md text-body-l text-ink-muted">
        {notFound
          ? 'The page you were looking for has moved or no longer exists.'
          : publicErrorMessage(error, 'An unexpected error occurred. Please reload the page.')}
      </p>
      <Link to="/" className={buttonClasses('primary')}>
        Back to the front page
      </Link>
    </main>
  );
}
