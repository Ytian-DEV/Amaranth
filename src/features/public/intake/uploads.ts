import { compressImage } from '@/lib/images';

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

/** Compresses images (the upload itself goes through src/lib/sendForm.ts). */
export async function prepareIntakeFiles(files: File[]): Promise<File[]> {
  const out: File[] = [];
  for (const original of files) out.push((await compressImage(original, { maxDimension: 2400, type: 'image/jpeg', quality: 0.85 })).file);
  return out;
}
