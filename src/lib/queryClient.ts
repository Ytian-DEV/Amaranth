import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // public content: one minute
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
      retry: (count, error) => {
        const status = (error as { status?: number } | null)?.status;
        if (status && status >= 400 && status < 500) return false;
        return count < 2;
      },
    },
  },
});
