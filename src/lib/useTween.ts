import { useEffect, useRef, useState } from 'react';

/** True when the reader asked for less motion, or the browser can't animate (tests, old browsers). */
export function skipMotion() {
  if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function' || typeof window.matchMedia !== 'function') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/**
 * Animates a list of numbers: from 0 on first render, then from the previous values whenever the
 * data changes (a live score update moves from the old number to the new one).
 */
export function useTweenedNumbers(targets: number[], duration = 900): number[] {
  const still = skipMotion();
  const [values, setValues] = useState<number[]>(() => (still ? targets : targets.map(() => 0)));
  const current = useRef(values);
  const key = targets.join(',');

  useEffect(() => {
    if (still) {
      current.current = targets;
      setValues(targets);
      return;
    }
    const from = current.current;
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const e = easeOutCubic(t);
      const next = targets.map((v, i) => (from[i] ?? 0) + (v - (from[i] ?? 0)) * e);
      current.current = next;
      setValues(next);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` stands for `targets`
  }, [key, duration, still]);

  return values;
}

/** A number that counts up from 0 (and to each new value). */
export function useTweenedNumber(target: number, duration = 900) {
  return useTweenedNumbers([target], duration)[0];
}
