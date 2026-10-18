// POST /api/submit — the only way into the public forms (comments, story and event
// submissions, contact). Each request needs a Cloudflare Turnstile token, so bots can't post
// by calling Supabase directly (the form RPCs and intake uploads are closed to anon in
// supabase/v2/schema.sql). With attachments it takes two calls:
//   1. { kind, token, args, files } → CAPTCHA checked → signed upload links + a 30-minute ticket
//   2. the browser uploads the files → { kind, ticket, args, files } → the submission is saved
// The ticket is signed with the service key and tied to the same fields and files.
import { FORMS, TEST_SECRET, filePaths, isKind, makeTicket, pickArgs, pickFiles, readTicket, verifyTurnstile, type FileMeta } from './_lib/forms.js';
import { readEnv } from './_lib/supabaseRest.js';

const MAX_BODY = 200_000;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

const clientIp = (request: Request) => request.headers.get('x-real-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;

async function signedUpload(supabaseUrl: string, serviceKey: string, path: string) {
  const res = await fetch(`${supabaseUrl}/storage/v1/object/upload/sign/intake/${path.split('/').map(encodeURIComponent).join('/')}`, {
    method: 'POST',
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'content-type': 'application/json' },
    body: '{}',
  });
  if (!res.ok) throw new Error(`sign ${res.status}`);
  const { url } = (await res.json()) as { url?: string };
  const token = url ? new URL(url, 'http://x').searchParams.get('token') : null;
  if (!token) throw new Error('no upload token');
  return { path, token };
}

async function save(supabaseUrl: string, serviceKey: string, rpc: string, args: Record<string, unknown>) {
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/${rpc}`, {
    method: 'POST',
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'content-type': 'application/json' },
    body: JSON.stringify(args),
  });
  const text = await res.text();
  if (res.ok) return json(200, { id: text ? JSON.parse(text) : null });
  // database messages (bad email, too many requests, comments closed…) are written for readers
  let message = 'Couldn’t send. Please try again.';
  try {
    message = (JSON.parse(text) as { message?: string }).message ?? message;
  } catch {
    /* keep the generic message */
  }
  return json(res.status >= 500 ? 502 : 400, { message });
}

export async function POST(request: Request) {
  const env = readEnv(request.url);
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const secret = process.env.TURNSTILE_SECRET_KEY ?? (process.env.NODE_ENV === 'development' ? TEST_SECRET : undefined);
  if (!env || !serviceKey || !secret) return json(501, { message: 'Forms aren’t set up yet. Please email us instead.' });

  const text = await request.text();
  if (!text || text.length > MAX_BODY) return json(413, { message: 'That’s too much text to send.' });
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return json(400, { message: 'Bad request.' });
  }

  const kind = body.kind;
  if (!isKind(kind)) return json(400, { message: 'Unknown form.' });
  const form = FORMS[kind];
  const args = pickArgs(kind, body.args);
  if (typeof args === 'string') return json(400, { message: args });
  const files = form.folder ? pickFiles(body.files) : [];
  if (typeof files === 'string') return json(400, { message: files });
  const withFiles = (paths: string[], list: FileMeta[]) => list.map((f, i) => ({ path: paths[i], name: f.name, mime: f.mime, size: f.size }));

  // step 2: files are uploaded, save with the ticket from step 1
  if (body.ticket !== undefined) {
    const paths = readTicket(body.ticket, kind, args, files, serviceKey);
    if (!paths) return json(403, { message: 'This form expired. Please send it again.' });
    return save(env.supabaseUrl, serviceKey, form.rpc, { ...args, p_files: withFiles(paths, files) });
  }

  // step 1: the CAPTCHA
  if (!(await verifyTurnstile(body.token, secret, clientIp(request)))) {
    return json(403, { message: 'Please complete the security check and try again.' });
  }
  if (!files.length || !form.folder) {
    return save(env.supabaseUrl, serviceKey, form.rpc, form.folder ? { ...args, p_files: [] } : args);
  }
  const paths = filePaths(form.folder, files);
  try {
    const uploads = await Promise.all(paths.map((p) => signedUpload(env.supabaseUrl, serviceKey, p)));
    return json(200, { uploads, ticket: makeTicket(kind, args, files, paths, serviceKey) });
  } catch {
    return json(502, { message: 'Couldn’t prepare the file upload. Please try again.' });
  }
}

export function GET() {
  return json(405, { message: 'Use POST.' });
}
