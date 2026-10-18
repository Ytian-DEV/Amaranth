// Shared rules for /api/submit: which public forms exist, what they may send, and the signed
// "ticket" that carries a CAPTCHA-checked submission across its file uploads.
import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

export type FormKind = 'comment' | 'article' | 'event' | 'contact';

export const FORMS: Record<FormKind, { rpc: string; params: string[]; folder: 'submissions' | 'events' | null }> = {
  comment: { rpc: 'submit_comment', params: ['p_article_id', 'p_name', 'p_email', 'p_body', 'p_parent_id', 'p_website'], folder: null },
  article: {
    rpc: 'submit_article',
    params: ['p_name', 'p_email', 'p_affiliation', 'p_section_slug', 'p_title', 'p_summary', 'p_body', 'p_website'],
    folder: 'submissions',
  },
  event: {
    rpc: 'submit_event_report',
    params: ['p_organization', 'p_contact_name', 'p_contact_email', 'p_event_title', 'p_event_date', 'p_venue', 'p_summary', 'p_website'],
    folder: 'events',
  },
  contact: { rpc: 'send_contact_message', params: ['p_name', 'p_email', 'p_subject', 'p_category', 'p_message', 'p_website'], folder: null },
};

// Same limits as the form and the intake bucket (supabase/v2/schema.sql)
export const MAX_FILES = 5;
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const FILE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const MAX_VALUE = 20_000;
const TICKET_TTL_MS = 30 * 60_000;

export const isKind = (v: unknown): v is FormKind => typeof v === 'string' && v in FORMS;

/** Keeps only the form's own fields, as strings or null. Returns an error message instead when a value is wrong. */
export function pickArgs(kind: FormKind, raw: unknown): Record<string, string | null> | string {
  if (!raw || typeof raw !== 'object') return 'Missing form fields.';
  const out: Record<string, string | null> = {};
  for (const key of FORMS[kind].params) {
    const v = (raw as Record<string, unknown>)[key];
    if (v === undefined || v === null || v === '') out[key] = null;
    else if (typeof v === 'string' && v.length <= MAX_VALUE) out[key] = v;
    else return 'A form field is too long.';
  }
  return out;
}

export type FileMeta = { name: string; mime: string; size: number };

export function pickFiles(raw: unknown): FileMeta[] | string {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) return 'Bad file list.';
  if (raw.length > MAX_FILES) return `Attach at most ${MAX_FILES} files.`;
  const out: FileMeta[] = [];
  for (const f of raw as Record<string, unknown>[]) {
    const name = typeof f?.name === 'string' ? f.name.slice(0, 200) : '';
    const mime = typeof f?.mime === 'string' ? f.mime : '';
    const size = typeof f?.size === 'number' && Number.isFinite(f.size) ? Math.round(f.size) : -1;
    if (!name || !FILE_TYPES.has(mime)) return `${name || 'A file'}: use JPG, PNG, WebP, PDF, Word or text files.`;
    if (size < 1 || size > MAX_FILE_BYTES) return `${name} is larger than 20 MB.`;
    out.push({ name, mime, size });
  }
  return out;
}

/** Same idea as src/lib/images.ts safeFileName: ASCII words and dashes, extension kept. */
export function safeName(name: string) {
  const dot = name.lastIndexOf('.');
  const base = (dot > 0 ? name.slice(0, dot) : name).normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^\w-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) : '';
  return `${base || 'file'}${ext ? `.${ext}` : ''}`;
}

export function filePaths(folder: string, files: FileMeta[]) {
  const batch = randomUUID();
  return files.map((f, i) => `${folder}/${batch}/${i + 1}-${safeName(f.name)}`);
}

// ---------------------------------------------------------------- ticket

const b64 = (s: string) => Buffer.from(s).toString('base64url');
const digest = (kind: FormKind, args: Record<string, string | null>, files: FileMeta[]) =>
  createHash('sha256').update(JSON.stringify([kind, args, files])).digest('base64url');
const sign = (body: string, key: string) => createHmac('sha256', key).update(body).digest('base64url');

type TicketBody = { k: FormKind; h: string; p: string[]; e: number };

/** A pass for the same submission, with these files at these paths, for the next 30 minutes. */
export function makeTicket(kind: FormKind, args: Record<string, string | null>, files: FileMeta[], paths: string[], key: string, now = Date.now()) {
  const body = b64(JSON.stringify({ k: kind, h: digest(kind, args, files), p: paths, e: now + TICKET_TTL_MS } satisfies TicketBody));
  return `${body}.${sign(body, key)}`;
}

/** The ticket's file paths, or null when it is forged, expired, or for different content. */
export function readTicket(ticket: unknown, kind: FormKind, args: Record<string, string | null>, files: FileMeta[], key: string, now = Date.now()): string[] | null {
  if (typeof ticket !== 'string' || ticket.length > 4000) return null;
  const [body, mac] = ticket.split('.');
  if (!body || !mac) return null;
  const expected = Buffer.from(sign(body, key));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const t = JSON.parse(Buffer.from(body, 'base64url').toString()) as TicketBody;
    if (t.k !== kind || t.e < now || t.h !== digest(kind, args, files) || t.p.length !== files.length) return null;
    return t.p;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- Turnstile

/** Cloudflare's always-pass test secret (local development only). */
export const TEST_SECRET = '1x0000000000000000000000000000000AA';

export async function verifyTurnstile(token: unknown, secret: string, ip: string | null): Promise<boolean> {
  if (typeof token !== 'string' || !token || token.length > 2048) return false;
  const form = new URLSearchParams({ secret, response: token });
  if (ip) form.set('remoteip', ip);
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
