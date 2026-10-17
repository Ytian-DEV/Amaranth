import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Feedback';
import { getSupabase } from '@/lib/supabase';
import { useDocumentTitle } from '@/lib/useDocumentTitle';
import { AuthLayout } from './AuthLayout';
import { friendlyAuthError } from './authHelpers';

export function ForgotPasswordPage() {
  useDocumentTitle('Reset your password');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { error: resetError } = await getSupabase().auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/admin/set-password`,
      });
      if (resetError) throw resetError;
      setSent(true);
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Reset your password"
      intro="Enter your staff email and we’ll send you a link to choose a new password."
    >
      {sent ? (
        <div className="flex flex-col gap-5">
          <Alert tone="success">
            If <strong>{email}</strong> belongs to a staff account, a reset link is on its way. The link expires in one hour.
          </Alert>
          <Link to="/admin/login" className="text-button text-green-700 hover:underline">
            ← Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
          {error && <Alert tone="error">{error}</Alert>}
          <Field label="Email" required>
            {({ id }) => (
              <Input
                id={id}
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            )}
          </Field>
          <Button type="submit" size="lg" loading={busy} disabled={!email}>
            Send reset link
          </Button>
          <Link to="/admin/login" className="self-start text-button text-green-700 hover:underline">
            ← Back to sign in
          </Link>
        </form>
      )}
    </AuthLayout>
  );
}
