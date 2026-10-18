import { missingWidths } from './uploadMedia';

const image = (width: number | null, variants: { width: number; path: string }[] = [], extra = {}) => ({
  path: 'articles/2026/10/abcd1234/photo.webp',
  kind: 'image' as const,
  mime_type: 'image/webp',
  width,
  variants,
  ...extra,
});

describe('missingWidths', () => {
  it('lists the standard sizes smaller than the original that are missing', () => {
    expect(missingWidths(image(2400))).toEqual([320, 640, 960, 1280]);
    expect(missingWidths(image(800))).toEqual([320, 640]);
    expect(missingWidths(image(300))).toEqual([]);
  });

  it('matches by file name, so portrait variants (smaller actual width) count as present', () => {
    const v = [
      { width: 512, path: 'articles/2026/10/abcd1234/photo-640.webp' },
      { width: 1024, path: 'articles/2026/10/abcd1234/photo-1280.webp' },
    ];
    expect(missingWidths(image(1920, v))).toEqual([320, 960]);
  });

  it('skips GIFs, documents and images with no known size', () => {
    expect(missingWidths(image(2400, [], { mime_type: 'image/gif' }))).toEqual([]);
    expect(missingWidths(image(2400, [], { kind: 'document' }))).toEqual([]);
    expect(missingWidths(image(null))).toEqual([]);
  });
});
