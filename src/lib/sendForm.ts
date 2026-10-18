import { getSupabase } from './supabase';
import { getTurnstileToken } from './turnstile';

export type FormKind = 'comment' | 'article' | 'event' | 'contact';
type Reply = { id?: unknown; uploads?: { path: string; token: string }[]; ticket?: string; message?: string };

async function post(body: Record<string, unknown>): Promise<Reply> {
  let res: Response;
  try {
    res = await fetch('/api/submit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  } catch {
    throw new Error('You seem to be offline. Please try again.');
  }
  const data = (await res.json().catch(() => ({}))) as Reply;
  if (!res.ok) throw new Error(data.message ?? 'Couldn’t send. Please try again.');
  return data;
}

/**
 * Sends a public form through /api/submit (api/submit.ts): CAPTCHA first, then the files go
 * straight to storage with one-time upload links, then the submission is saved.
 */
export async function sendForm(kind: FormKind, args: Record<string, string | null>, files: File[] = []): Promise<unknown> {
  const meta = files.map((f) => ({ name: f.name, mime: f.type, size: f.size }));
  const token = await getTurnstileToken();
  const first = await post({ kind, token, args, files: meta });
  if (!first.ticket || !first.uploads) return first.id;

  const storage = getSupabase().storage.from('intake');
  for (const [i, u] of first.uploads.entries()) {
    const { error } = await storage.uploadToSignedUrl(u.path, u.token, files[i], { contentType: files[i].type });
    if (error) throw new Error(`Couldn’t upload ${files[i].name}: ${error.message}`);
  }
  return (await post({ kind, ticket: first.ticket, args, files: meta })).id;
}
