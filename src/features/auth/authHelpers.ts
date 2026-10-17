import { errorText } from '@/lib/errors';

export function friendlyAuthError(error: unknown) {
  const message = errorText(error) ?? '';
  if (/invalid login credentials/i.test(message)) return 'That email and password don’t match an account.';
  if (/email not confirmed/i.test(message)) return 'Please confirm your email first (check your inbox for the invite).';
  if (/rate limit|too many/i.test(message)) return 'Too many attempts. Wait a minute and try again.';
  return message || 'Sign-in failed. Please try again.';
}

export const MIN_PASSWORD = 8;

export function passwordProblem(password: string, confirm: string) {
  if (password.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters.`;
  if (password !== confirm) return 'The passwords don’t match.';
  return null;
}
