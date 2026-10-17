import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes } from './router';

function go(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

describe('router', () => {
  it.each([
    ['/features', '/feature'],
    ['/blog', '/blogs'],
    ['/s&t', '/science-technology'],
    ['/home', '/'],
  ])('redirects old URL %s to %s', async (from, to) => {
    const router = go(from);
    await waitFor(() => expect(router.state.location.pathname).toBe(to));
  });

  it('sends unknown deep paths to the public 404', async () => {
    const router = go('/no/such/page');
    await waitFor(() => expect(document.title).toMatch(/Page not found/));
    expect(router.state.location.pathname).toBe('/no/such/page');
  });
});
