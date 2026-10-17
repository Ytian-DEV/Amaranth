import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Feedback';
import { getSupabase } from '@/lib/supabase';
import { useDocumentTitle } from '@/lib/useDocumentTitle';
import { AuthLayout } from './AuthLayout';
import { useAuth } from './AuthProvider';
import { friendlyAuthError } from './authHelpers';

export function LoginPage() {
  useDocumentTitle('Staff sign in');
  const { status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/admin';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (status === 'signed-in') return <Navigate to={from} replace />;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { error: signInError } = await getSupabase().auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) throw signInError;
      navigate(from, { replace: true });
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Staff sign in" intro="For Amaranth editors and writers. Readers don’t need an account.">
      <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        {error && <Alert tone="error">{error}</Alert>}
        <Field label="Email" required>
          {({ id }) => (
            <Input
              id={id}
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}
        </Field>
        <Field label="Password" required>
          {({ id }) => (
            <Input
              id={id}
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
        </Field>
        <Button type="submit" size="lg" loading={busy} disabled={!email || !password}>
          Sign in
        </Button>
        <Link to="/admin/forgot-password" className="self-start text-button text-green-700 hover:underline">
          Forgot your password?
        </Link>
      </form>
    </AuthLayout>
  );
}
