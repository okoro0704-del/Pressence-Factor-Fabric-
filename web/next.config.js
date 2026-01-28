/** @type {import('next').NextConfig} */
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  cacheStartUrl: true,
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: /\/api\/manifesto\/?$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'pff-manifesto-api',
          expiration: { maxEntries: 1, maxAgeSeconds: 60 * 60 * 24 * 7 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: /\/api\/voting\/?$/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'pff-voting-api',
          networkTimeoutSeconds: 10,
          expiration: { maxEntries: 1, maxAgeSeconds: 60 * 5 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: /\/api\/sync-presence\/?$/,
        method: 'POST',
        handler: 'NetworkOnly',
        options: {
          backgroundSync: {
            name: 'sync-presence',
            options: { maxRetentionTime: 24 * 60 },
          },
        },
      },
    ],
  },
});

const nextConfig = {
  reactStrictMode: true,
};

module.exports = withPWA(nextConfig);
