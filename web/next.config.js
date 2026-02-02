/**
 * Next.js Configuration for PFF Architect's Command Center
 * Configured for Static Export (Netlify/Vercel compatible)
 *
 * NOTE: PWA plugin removed for static export compatibility
 * Static export does not support service workers via next-pwa
 */

/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // Static export for Netlify/Vercel deployment
  output: 'export',

  // Required for static export (no image optimization)
  images: {
    unoptimized: true,
  },

  // Add trailing slashes to URLs (optional, helps with routing)
  trailingSlash: true,

  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Webpack configuration for module resolution
  webpack: (config) => {
    config.resolve.modules = config.resolve.modules || [];
    config.resolve.modules.push(path.join(__dirname, 'node_modules'));
    return config;
  },
};

module.exports = nextConfig;