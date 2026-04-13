import { useEffect, useMemo, useRef, useState } from "react";

interface LoadingScreenProps {
  isLoading?: boolean;
  title?: string;
  subtitle?: string;
  fullScreen?: boolean;
  minHeightClassName?: string;
  delayMs?: number;
  minVisibleMs?: number;
}

export function LoadingScreen({
  isLoading = true,
  title = "AMARANTH",
  subtitle = "Preparing your story experience...",
  fullScreen = false,
  minHeightClassName = "min-h-[18rem]",
  delayMs = 140,
  minVisibleMs = 420,
}: LoadingScreenProps) {
  const [isVisible, setIsVisible] = useState(false);
  const shownAtRef = useRef<number | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    if (isLoading) {
      timer = setTimeout(() => {
        shownAtRef.current = Date.now();
        setIsVisible(true);
      }, delayMs);
    } else if (isVisible) {
      const elapsed = shownAtRef.current ? Date.now() - shownAtRef.current : 0;
      const remaining = Math.max(minVisibleMs - elapsed, 0);
      timer = setTimeout(() => {
        shownAtRef.current = null;
        setIsVisible(false);
      }, remaining);
    } else {
      setIsVisible(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [delayMs, isLoading, isVisible, minVisibleMs]);

  const letters = useMemo(() => title.split(""), [title]);

  if (!isVisible && isLoading) {
    return <div className={fullScreen ? "min-h-screen" : minHeightClassName} aria-hidden="true" />;
  }

  if (!isVisible) return null;

  return (
    <div
      className={
        fullScreen
          ? "loading-screen loading-screen-full"
          : `loading-screen ${minHeightClassName}`
      }
      role="status"
      aria-live="polite"
    >
      <div className="loading-screen-inner">
        <img
          src="/amaranth-logo.svg"
          alt="Amaranth logo"
          className="loading-screen-logo"
        />
        <div className="loading-screen-wordmark font-trajan" aria-label={title}>
          {letters.map((letter, index) => (
            <span
              key={`${letter}-${index}`}
              className="loading-screen-letter"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              {letter}
            </span>
          ))}
        </div>
        <p className="loading-screen-subtitle">{subtitle}</p>
      </div>
    </div>
  );
}
