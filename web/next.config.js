/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export
  output: 'export',

  // Mark static export build so API routes can return stubs without reading request (cookies)
  env: { NEXT_STATIC_EXPORT: '1' },

  // Trailing slash for Netlify static hosting
  trailingSlash: true,

  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },

  // Disable strict mode to reduce build complexity
  reactStrictMode: false,

  // Disable TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;

