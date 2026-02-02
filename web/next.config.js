/**
 * Next.js Configuration for PFF Architect's Command Center
 * Minimal configuration for reliable static export
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export
  output: 'export',

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