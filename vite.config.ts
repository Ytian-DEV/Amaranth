/// <reference types="vitest/config" />
import path from 'node:path';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv, type Plugin } from 'vite';

// Preload only the latin variable fonts the first screen uses.
function preloadFonts(patterns: RegExp[]): Plugin {
  return {
    name: 'amaranth:preload-fonts',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const files = Object.keys(ctx.bundle ?? {}).filter((f) => patterns.some((p) => p.test(f)));
        return files.map((file) => ({
          tag: 'link',
          attrs: { rel: 'preload', href: `/${file}`, as: 'font', type: 'font/woff2', crossorigin: '' },
          injectTo: 'head',
        }));
      },
    },
  };
}

// `npm run dev` runs api/submit.ts too (Vercel runs it in production), so the public forms work
// locally. Server env comes from .env / .env.local; the CAPTCHA uses Cloudflare's test keys.
function devApi(names: string[]): Plugin {
  return {
    name: 'amaranth:dev-api',
    apply: 'serve',
    configureServer(server) {
      Object.assign(process.env, { ...loadEnv(server.config.mode, process.cwd(), ''), ...process.env });
      server.middlewares.use(async (req, res, next) => {
        const name = /^\/api\/([a-z]+)(?:\?|$)/.exec(req.url ?? '')?.[1];
        if (!name || !names.includes(name)) return next();
        try {
          const mod = (await server.ssrLoadModule(`/api/${name}.ts`)) as Record<string, (r: Request) => Response | Promise<Response>>;
          const handler = mod[req.method ?? 'GET'];
          if (!handler) {
            res.statusCode = 405;
            return res.end();
          }
          const chunks: Buffer[] = [];
          for await (const c of req) chunks.push(c as Buffer);
          const headers = new Headers();
          for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v);
          const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : Buffer.concat(chunks);
          const reply = await handler(new Request(`http://${req.headers.host}${req.url}`, { method: req.method, headers, body }));
          res.statusCode = reply.status;
          reply.headers.forEach((v, k) => res.setHeader(k, v));
          res.end(Buffer.from(await reply.arrayBuffer()));
        } catch (err) {
          server.config.logger.error(String(err));
          res.statusCode = 500;
          res.end('{"message":"Dev API error"}');
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [
    devApi(['submit']),
    react(),
    tailwindcss(),
    preloadFonts([/montserrat-latin-wght-normal-[\w-]+\.woff2$/, /cinzel-latin-700-normal-[\w-]+\.woff2$/]),
  ],
  resolve: {
    alias: [{ find: '@', replacement: path.resolve(__dirname, './src') }],
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/.test(id)) return 'react';
          if (id.includes('@supabase')) return 'supabase';
          if (id.includes('@tanstack')) return 'query';
          if (/[\\/]node_modules[\\/](@tiptap|prosemirror-|orderedmap|rope-sequence|w3c-keyname|linkifyjs)/.test(id)) return 'editor';
          return undefined;
        },
      },
    },
  },
  server: {
    port: 3000,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'api/**/*.test.ts'],
    css: false,
  },
});
