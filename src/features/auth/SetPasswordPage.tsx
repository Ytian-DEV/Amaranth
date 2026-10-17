import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { Alert, Spinner } from '@/components/ui/Feedback';
import { getSupabase } from '@/lib/supabase';
import { useDocumentTitle } from '@/lib/useDocumentTitle';
import { AuthLayout } from './AuthLayout';
import { useAuth } from './AuthProvider';
import { friendlyAuthError, MIN_PASSWORD, passwordProblem } from './authHelpers';

/** Choose a password after an invite or recovery link (both arrive with a session). */
export function SetPasswordPage() {
  useDocumentTitle('Choose a password');
  const { status, session } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const problem = passwordProblem(password, confirm);

  if (status === 'loading') {
    return (
      <AuthLayout title="Choose a password">
        <Spinner label="Checking your link" />
      </AuthLayout>
    );
  }

  if (!session) {
    return (
      <AuthLayout title="This link has expired" intro="Password links work once and expire after an hour.">
        <Link to="/admin/forgot-password" className="text-button text-green-700 hover:underline">
          Send a new link →
        </Link>
      </AuthLayout>
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (problem) return;
    setError(null);
    setBusy(true);
    try {
      const { error: updateError } = await getSupabase().auth.updateUser({ password });
      if (updateError) throw updateError;
      // drop the recovery hash so the provider doesn't redirect back here
      window.history.replaceState(null, '', '/admin');
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Choose a password" intro={<>Signed in as <strong>{session.user.email}</strong>.</>}>
      <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        {error && <Alert tone="error">{error}</Alert>}
        <Field label="New password" required hint={`At least ${MIN_PASSWORD} characters.`}>
          {({ id, describedBy }) => (
            <Input
              id={id}
              type="password"
              autoComplete="new-password"
              aria-describedby={describedBy}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
        </Field>
        <Field label="Confirm password" required error={touched && problem ? problem : undefined}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              type="password"
              autoComplete="new-password"
              aria-describedby={describedBy}
              aria-invalid={invalid}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          )}
        </Field>
        <Button type="submit" size="lg" loading={busy}>
          Save password
        </Button>
      </form>
    </AuthLayout>
  );
}
