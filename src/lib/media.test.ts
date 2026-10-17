import { publicUrl, srcSet } from './media';

describe('media', () => {
  it('builds public storage URLs', () => {
    expect(publicUrl('media', 'a b/c.jpg')).toMatch(/\/storage\/v1\/object\/public\/media\/a%20b\/c\.jpg$/);
    expect(publicUrl('media', '/images/x.jpg')).toBe('/images/x.jpg');
    expect(publicUrl(null, 'x.jpg')).toBeUndefined();
  });

  it('builds srcset from variants plus the original', () => {
    const set = srcSet({
      bucket: 'media',
      path: 'p/full.jpg',
      width: 1600,
      variants: [{ width: 640, path: 'p/640.webp' }, { width: 320, path: 'p/320.webp' }],
    });
    expect(set?.split(', ').map((s) => s.split(' ').pop())).toEqual(['320w', '640w', '1600w']);
  });
});
