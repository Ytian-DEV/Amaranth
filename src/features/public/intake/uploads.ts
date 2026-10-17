import type { Json } from '@/lib/database.types';
import { compressImage, safeFileName } from '@/lib/images';
import { getSupabase } from '@/lib/supabase';

export const MAX_FILES = 5;
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
export const ACCEPT_ATTR = '.jpg,.jpeg,.png,.webp,.pdf,.txt,.doc,.docx';

export function fileProblem(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return `${file.name}: use JPG, PNG, WebP, PDF, Word or text files.`;
  if (file.size > MAX_FILE_BYTES) return `${file.name} is larger than 20 MB.`;
  return null;
}

/**
 * Uploads files to the private "intake" bucket under `<folder>/<random>/` and returns the
 * JSON the intake RPCs expect. Images are compressed first.
 */
export async function uploadIntakeFiles(folder: 'submissions' | 'events', files: File[]): Promise<Json> {
  if (files.length === 0) return [];
  const storage = getSupabase().storage.from('intake');
  const batch = crypto.randomUUID();
  const out: { path: string; name: string; mime: string; size: number }[] = [];
  for (const original of files) {
    const { file } = await compressImage(original, { maxDimension: 2400, type: 'image/jpeg', quality: 0.85 });
    const path = `${folder}/${batch}/${out.length + 1}-${safeFileName(file.name)}`;
    const { error } = await storage.upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw new Error(`Couldn’t upload ${original.name}: ${error.message}`);
    out.push({ path, name: original.name, mime: file.type, size: file.size });
  }
  return out;
}
