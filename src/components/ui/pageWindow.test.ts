import { pageWindow, parsePage } from './pageWindow';

describe('pageWindow', () => {
  it('shows everything for short lists', () => {
    expect(pageWindow(2, 3)).toEqual([1, 2, 3]);
  });

  it('collapses long ranges with gaps', () => {
    expect(pageWindow(6, 20)).toEqual([1, 'gap', 5, 6, 7, 'gap', 20]);
  });

  it('fills a single missing page instead of a gap', () => {
    expect(pageWindow(4, 10)).toEqual([1, 2, 3, 4, 5, 'gap', 10]);
  });
});

describe('parsePage', () => {
  it('defaults to 1 for junk', () => {
    expect(parsePage(null)).toBe(1);
    expect(parsePage('-3')).toBe(1);
    expect(parsePage('2.5')).toBe(1);
    expect(parsePage('4')).toBe(4);
  });
});
