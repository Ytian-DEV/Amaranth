import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Vercel runs middleware.ts and api/* as plain Node ES modules (no bundler), so relative
// imports need the file extension: './seo.js', not './seo'. Without it production fails
// with ERR_MODULE_NOT_FOUND on every page.
describe('server code imports', () => {
  it('uses .js extensions on every relative import', () => {
    const files = ['middleware.ts', ...readdirSync('api').map((f) => join('api', f)), ...readdirSync('api/_lib').map((f) => join('api/_lib', f))].filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'));
    const bad = files.flatMap((f) =>
      [...readFileSync(f, 'utf8').matchAll(/from\s+['"](\.{1,2}\/[^'"]+)['"]/g)].filter((m) => !m[1].endsWith('.js')).map((m) => `${f}: ${m[1]}`),
    );
    expect(bad).toEqual([]);
  });
});
