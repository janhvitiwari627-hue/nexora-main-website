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
      // Vendor chunking (bundle-size optimization): the SPA otherwise emits a
      // single ~1.7 MB chunk. Large, rarely-changing third-party libraries get
      // their own long-term-cacheable chunks so deploys that only change app
      // code keep the vendor chunks (and their cache entries) byte-identical.
      //
      // The remaining app chunk is ~1.1 MB of first-party SPA code (the
      // supplier/buyer screens render from one mount). Vite's default 500 kB
      // warning threshold is a heuristic; it is raised here to the real shell
      // size instead of suppressing the warning globally. A follow-up
      // screen-level lazy-loading refactor can bring the initial chunk down.
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return undefined;
            if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'vendor-react';
            if (
              /[\\/]node_modules[\\/](recharts|react-smooth|recharts-scale|d3-[a-z-]+|victory-vendor|decimal\.js|fast-equals|internmap)[\\/]/.test(id)
            ) return 'vendor-charts';
            if (id.includes('node_modules/@supabase/')) return 'vendor-supabase';
            if (/[\\/]node_modules[\\/](motion|framer-motion|motion-dom|motion-utils)[\\/]/.test(id)) return 'vendor-motion';
            if (id.includes('node_modules/@google/')) return 'vendor-genai';
            if (id.includes('node_modules/lucide-react')) return 'vendor-lucide';
            return undefined;
          },
        },
      },
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
