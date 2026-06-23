import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Inject service worker registration di index.html secara otomatis
      injectRegister: 'auto',
      // Aset yang di-precache saat install SW
      includeAssets: ['favicon-32.png', 'favicon-64.png', 'apple-touch-icon.png', 'logo-192.png', 'logo-512.png', 'qris.png'],
      manifest: {
        name: 'Habbit Tracker',
        short_name: 'HabbitTracker',
        description: 'Aplikasi pelacak kebiasaan dan jadwal harian',
        lang: 'id',
        theme_color: '#1B6CA8',
        background_color: '#0A2540',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/logo-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/logo-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/logo-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Strategi cache untuk navigasi (HTML): NetworkFirst supaya konten terbaru
        // tetap bisa diakses, tapi fallback ke cache saat offline
        navigateFallback: '/index.html',
        // Precache semua aset yang dihasilkan Vite (JS, CSS)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          // Google Fonts stylesheet: StaleWhileRevalidate (cepat, update di background)
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          // Google Fonts woff2: CacheFirst (file statis, jarang berubah)
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Gambar dari origin sendiri: CacheFirst
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
});
