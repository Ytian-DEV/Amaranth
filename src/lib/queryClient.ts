import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // public content: one minute
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
      retry: (count, error) => {
        const e = error as { status?: number; code?: string } | null;
        // PostgREST / Postgres errors (missing table, RLS, bad input) won't fix themselves
        if (typeof e?.code === 'string' && e.code !== '') return false;
        if (e?.status && e.status >= 400 && e.status < 500) return false;
        return count < 2;
      },
    },
  },
});
