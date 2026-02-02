/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export
  output: 'export',

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

  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;

