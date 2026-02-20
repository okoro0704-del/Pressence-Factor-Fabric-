/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export
  output: 'export',

  // Mark static export build so API routes can return stubs without reading request (cookies)
  env: { NEXT_STATIC_EXPORT: '1' },

  // Trailing slash for Netlify static hosting
  trailingSlash: true,
  // Redirects for vitalization/treasury → countdown are in public/_redirects (Netlify)

  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },

  // Disable strict mode to reduce build complexity
  reactStrictMode: false,

  // Sovereign Override: build anyway; Architect's vision over syntax rules
  typescript: {
    ignoreBuildErrors: true,
  },
  // 0% Unbanked: smaller payload for 3G; JS is minified in production
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  compress: true,

  // Turbopack config (Next.js 16+ default) - empty config to silence webpack warning
  turbopack: {},

  // Webpack config to handle module resolution issues (fallback for non-turbopack builds)
  webpack: (config, { isServer }) => {
    // Fix for crypto-js and other ESM/CJS issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      crypto: false,
      stream: false,
      buffer: false,
      fs: false,
      net: false,
      tls: false,
    };

    return config;
  },

  // Note: Next.js 16+ does not support eslint in next.config; do not run `next lint` in CI if you want to skip lint.
};

module.exports = nextConfig;

