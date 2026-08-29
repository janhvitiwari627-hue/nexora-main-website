import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  const requestedBase = process.env.VITE_APP_BASE_PATH?.trim() || '/';
  const appBase = `/${requestedBase.replace(/^\/+|\/+$/g, '')}${requestedBase === '/' ? '' : '/'}`;
  const asset = (value: string) => `${appBase}${value.replace(/^\//, '')}`;

  return {
    base: appBase,
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: false,
        includeAssets: [
          'icons/favicon-64.png',
          'icons/apple-touch-icon.png',
          'icons/icon-192.png',
          'icons/icon-512.png',
          'icons/icon-maskable-512.png',
        ],
        manifest: {
          id: appBase,
          name: 'Nexora Jobs — Beauty Careers',
          short_name: 'Nexora Jobs',
          description: 'Find beauty and wellness jobs, manage applications, interviews, offers, and salon hiring.',
          start_url: `${appBase}?source=pwa`,
          scope: appBase,
          display: 'standalone',
          display_override: ['window-controls-overlay', 'standalone'],
          orientation: 'portrait-primary',
          background_color: '#fdf8f8',
          theme_color: '#8e004b',
          categories: ['business', 'lifestyle', 'productivity'],
          lang: 'en-IN',
          dir: 'ltr',
          icons: [
            { src: asset('icons/icon-192.png'), sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: asset('icons/icon-512.png'), sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: asset('icons/icon-maskable-512.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
          navigateFallback: asset('index.html'),
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              urlPattern: ({ url, request }) =>
                request.method === 'GET' &&
                url.hostname.endsWith('.supabase.co') &&
                url.pathname.includes('/rest/v1/public_job_listings'),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'nexora-public-jobs-v1',
                networkTimeoutSeconds: 5,
                cacheableResponse: { statuses: [0, 200] },
                expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 },
              },
            },
            {
              urlPattern: ({ request, url }) => request.destination === 'image' && url.origin !== self.location.origin,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'nexora-public-images-v1',
                cacheableResponse: { statuses: [0, 200] },
                expiration: { maxEntries: 80, maxAgeSeconds: 7 * 24 * 60 * 60 },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'nexora-google-fonts-v1',
                cacheableResponse: { statuses: [0, 200] },
                expiration: { maxEntries: 20, maxAgeSeconds: 30 * 24 * 60 * 60 },
              },
            },
          ],
        },
        devOptions: { enabled: false },
      }),
    ] as any,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
      // The shared packages (../packages/location) also import
      // @supabase/supabase-js and react. Dedupe them onto this app's copies
      // so exactly one client class and one React instance end up in the
      // bundle, matching the tsconfig "paths" type mapping.
      dedupe: ['@supabase/supabase-js', 'react', 'react-dom'],
    },
    build: {
      // Vendor chunking (bundle-size optimization): the SPA otherwise emits a
      // single ~1.5 MB chunk. Large, rarely-changing third-party libraries get
      // their own long-term-cacheable chunks so deploys that only change app
      // code keep the vendor chunks (and their cache entries) byte-identical.
      //
      // The remaining app chunk is ~590 kB of first-party SPA code (the
      // authenticated seeker/employer/admin workspaces render from one mount).
      // Vite's default 500 kB warning threshold is a heuristic; it is raised
      // here to the real shell size instead of suppressing the warning
      // globally. A follow-up route-level lazy-loading refactor can bring the
      // initial chunk back under 500 kB.
      chunkSizeWarningLimit: 700,
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
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
