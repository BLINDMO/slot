import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

// Must match kit.paths.base in svelte.config.js so manifest URLs resolve under
// the GitHub Pages project subpath (e.g. /slot).
const base = process.env.BASE_PATH ?? '';

export default defineConfig({
  plugins: [
    sveltekit(),
    SvelteKitPWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Slot Hub',
        short_name: 'Slot Hub',
        description: 'A personal arcade of original slot machines. Virtual currency only.',
        theme_color: '#0b0e16',
        background_color: '#0b0e16',
        display: 'standalone',
        orientation: 'portrait',
        scope: `${base}/`,
        start_url: `${base}/`,
        icons: [
          { src: `${base}/icons/icon-192.png`, sizes: '192x192', type: 'image/png' },
          { src: `${base}/icons/icon-512.png`, sizes: '512x512', type: 'image/png' },
          {
            src: `${base}/icons/icon-512-maskable.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,webp,woff2,json}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
      }
    })
  ]
});
