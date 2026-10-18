import { act, renderHook } from '@testing-library/react';
import { useTweenedNumbers } from './useTween';

describe('useTweenedNumbers', () => {
  let now = 0;
  beforeEach(() => {
    vi.useFakeTimers();
    now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(() => { now += 16; cb(now); }, 16) as unknown as number);
    vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id));
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: false, media: q }));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('counts up from 0 to the data, then moves to new values', () => {
    const { result, rerender } = renderHook(({ v }) => useTweenedNumbers(v, 300), { initialProps: { v: [22, 15] } });
    expect(result.current).toEqual([0, 0]);
    act(() => void vi.advanceTimersByTime(100));
    expect(result.current[0]).toBeGreaterThan(0);
    expect(result.current[0]).toBeLessThan(22);
    act(() => void vi.advanceTimersByTime(400));
    expect(result.current).toEqual([22, 15]);
    rerender({ v: [25, 15] });
    act(() => void vi.advanceTimersByTime(50));
    expect(result.current[0]).toBeGreaterThan(22); // from the old value, not from 0
    act(() => void vi.advanceTimersByTime(400));
    expect(result.current).toEqual([25, 15]);
  });

  it('shows the data at once when the reader prefers reduced motion', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: true, media: q }));
    const { result } = renderHook(() => useTweenedNumbers([7, 3]));
    expect(result.current).toEqual([7, 3]);
  });
});
