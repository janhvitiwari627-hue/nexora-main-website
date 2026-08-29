import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          /**
           * Vendor chunking. Framework/runtime vendors are grouped so the
           * app-code chunks (entry + lazy wizard steps + lazy owner tabs)
           * stay small and cache independently. Leaflet is deliberately NOT
           * grouped here: it is only reachable through the lazy LocationMap
           * chunk (components/LocationPickerModal.tsx) and must stay there.
           */
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('leaflet')) return undefined;
            if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react-vendor';
            if (id.includes('@supabase')) return 'supabase-vendor';
            if (/[\\/]node_modules[\\/](motion|motion-dom|motion-utils)[\\/]/.test(id)) return 'motion-vendor';
            if (id.includes('lucide-react')) return 'icons-vendor';
            return undefined;
          },
        },
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      cors: true,
      allowedHosts: true as unknown as string[],
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      headers: {
        'X-Frame-Options': 'ALLOWALL',
      },
    },
    preview: {
      host: '0.0.0.0',
      port: 4173,
      cors: true,
      allowedHosts: true as unknown as string[],
    },
  };
});
