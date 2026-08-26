import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const year = 60 * 60 * 24 * 365
const month = 60 * 60 * 24 * 30

export default defineConfig({
  appType: 'spa',
  server: {
    port: 5178,
    strictPort: true,
    host: true,
  },
  preview: {
    port: 4178,
    host: true,
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['favicon.svg'],
      includeManifestIcons: true,
      minify: true,
      manifest: {
        id: '/',
        name: 'شارژ ساختمان',
        short_name: 'شارژ',
        description: 'محاسبه و مدیریت شارژ آپارتمان بر اساس قانون تملک آپارتمان‌ها',
        lang: 'fa',
        dir: 'rtl',
        theme_color: '#1F6F5B',
        background_color: '#F3EEE6',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui', 'browser'],
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        categories: ['finance', 'utilities', 'productivity'],
        prefer_related_applications: false,
        handle_links: 'preferred',
        launch_handler: { client_mode: ['navigate-existing', 'auto'] },
        shortcuts: [
          {
            name: 'هزینه جدید',
            short_name: 'هزینه',
            url: '/expenses/new',
            description: 'ثبت هزینه جدید',
          },
          {
            name: 'پرداخت‌ها',
            short_name: 'پرداخت',
            url: '/payments',
            description: 'دریافت شارژها',
          },
          {
            name: 'گزارش',
            url: '/report',
            description: 'گزارش ماه',
          },
        ],
      },
      pwaAssets: {
        disabled: false,
        config: true,
        htmlPreset: '2023',
        overrideManifestIcons: true,
        includeHtmlHeadLinks: true,
        injectThemeColor: true,
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2,ttf,eot,json,webmanifest}'],
        globIgnores: ['**/node_modules/**/*'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigationPreload: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: { maxEntries: 80, maxAgeSeconds: month },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\.(?:woff2?|ttf|eot|otf)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'font-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: year },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ request }) =>
              request.destination === 'script' ||
              request.destination === 'style' ||
              request.destination === 'worker',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
              expiration: { maxEntries: 40, maxAgeSeconds: month },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages-cache',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 32, maxAgeSeconds: month },
              cacheableResponse: { statuses: [0, 200] },
              precacheFallback: { fallbackURL: '/index.html' },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        navigateFallback: 'index.html',
        suppressWarnings: true,
        type: 'module',
      },
    }),
  ],
})
