import { fitWithin, formatBytes, safeFileName } from './images';

describe('images', () => {
  it('fits within a max dimension keeping the ratio', () => {
    expect(fitWithin(4000, 3000, 2400)).toEqual({ width: 2400, height: 1800 });
    expect(fitWithin(800, 600, 2400)).toEqual({ width: 800, height: 600 });
  });

  it('makes storage-safe file names', () => {
    expect(safeFileName('Org Fair 2026 (final).JPG')).toBe('org-fair-2026-final.jpg');
    expect(safeFileName('Pagsulat sa Baybay.docx')).toBe('pagsulat-sa-baybay.docx');
    expect(safeFileName('...')).toBe('file');
  });

  it('formats sizes', () => {
    expect(formatBytes(2_500_000)).toBe('2.4 MB');
    expect(formatBytes(3000)).toBe('3 KB');
  });
});
