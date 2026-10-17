import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Lockup } from '@/components/ui/Logo';
import { roleLabels } from '@/features/auth/permissions';
import { useAuth } from '@/features/auth/AuthProvider';
import { useDocumentTitle } from '@/lib/useDocumentTitle';

/** Temporary landing for signed-in staff; replaced by the CMS dashboard (feature/cms-shell-dashboard). */
export function AdminHome() {
  useDocumentTitle('Newsroom');
  const { profile, signOut } = useAuth();
  return (
    <main id="main" className="container-page flex flex-col gap-6 py-12">
      <Lockup className="text-[26px]" subtitle="Newsroom" />
      <h1 className="font-serif text-headline-l">Welcome, {profile?.display_name}</h1>
      <p className="text-body-m text-ink-muted">
        Signed in as {profile?.email} · {profile ? roleLabels[profile.role] : ''}
      </p>
      <div className="flex gap-3">
        <Link to="/" className="text-button text-green-700 hover:underline">
          View the site
        </Link>
        <Button variant="outline" size="sm" onClick={() => void signOut()}>
          Sign out
        </Button>
      </div>
    </main>
  );
}
