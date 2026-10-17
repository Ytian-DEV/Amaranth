/// <reference types="vitest/config" />
import path from 'node:path';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vite';

// The legacy v1 UI kit (src/legacy) imports Radix packages with pinned versions
// in the specifier (a Figma Make export habit). Map them to the installed ones
// until src/legacy is deleted in feature/v2-polish.
const legacyRadix = [
  'accordion', 'alert-dialog', 'aspect-ratio', 'avatar', 'checkbox', 'collapsible',
  'context-menu', 'dialog', 'dropdown-menu', 'hover-card', 'label', 'menubar',
  'navigation-menu', 'popover', 'progress', 'radio-group', 'scroll-area', 'select',
  'separator', 'slider', 'slot', 'switch', 'tabs', 'toggle', 'toggle-group', 'tooltip',
];
const legacyAliases = [
  ...legacyRadix.map((name) => ({
    find: new RegExp(`^@radix-ui/react-${name}@[\\d.]+$`),
    replacement: `@radix-ui/react-${name}`,
  })),
  {
    find: /^(vaul|sonner|recharts|react-resizable-panels|react-hook-form|react-day-picker|next-themes|lucide-react|input-otp|embla-carousel-react|cmdk|class-variance-authority)@[\d.]+$/,
    replacement: '$1',
  },
];

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

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    preloadFonts([/inter-latin-wght-normal-[\w-]+\.woff2$/, /fraunces-latin-wght-normal-[\w-]+\.woff2$/]),
  ],
  resolve: {
    alias: [{ find: '@', replacement: path.resolve(__dirname, './src') }, ...legacyAliases],
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
