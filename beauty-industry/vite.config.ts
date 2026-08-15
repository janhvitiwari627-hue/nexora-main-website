import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    // Canonical mount for the integrated static build. Every generated asset
    // (JS/CSS/fonts/images) must resolve under /distributors-beauty-industry/
    // and never from the root /assets/ path.
    base: '/distributors-beauty-industry/',
    plugins: [react(), tailwindcss()],
    css: {
      // Tailwind v4 is handled by @tailwindcss/vite above. This inline config
      // stops Vite from walking up to the root project's postcss.config.mjs,
      // which references @tailwindcss/postcss (a root-only dependency that is
      // deliberately not installed inside this isolated app).
      postcss: {
        plugins: [],
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      // Integrated output lands inside the Next.js public/ directory so the
      // root project serves it at /distributors-beauty-industry/.
      outDir: '../public/distributors-beauty-industry',
      emptyOutDir: true,
    },
    server: {
      host: '0.0.0.0',
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
