/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        obsidian: { bg: '#0d0d0f', surface: '#16161a' },
        gold: { DEFAULT: '#c9a227', bright: '#e8c547' },
        sovereign: { gold: '#D4AF37' },
        vitalie: { blue: '#007FFF' },
        companion: { amber: '#F59E0B' },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'hologram-spin': 'hologram-spin 8s linear infinite',
        'hologram-spin-reverse': 'hologram-spin-reverse 12s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        'hologram-spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'hologram-spin-reverse': {
          '0%': { transform: 'rotate(360deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
      },
    },
  },
  plugins: [],
};
