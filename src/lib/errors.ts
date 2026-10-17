import { env } from './env';

/** Message safe to show readers: the real error only in dev builds. */
export function publicErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.') {
  if (!env.isDev) return fallback;
  return errorText(error) ?? fallback;
}

/** Message for staff screens and form validation (RPCs raise friendly messages). */
export function errorText(error: unknown): string | undefined {
  if (!error) return undefined;
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return undefined;
}
