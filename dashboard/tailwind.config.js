/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef7fa',
          100: '#cfe7f2',
          200: '#b3dffe',
          300: '#89c2d9',
          400: '#61a5c2',
          500: '#468faf',
          600: '#2c7da0',
          700: '#2a6f97',
          800: '#014f86',
          900: '#01497c',
          950: '#012a4a',
        },
        ocean: {
          50: '#eef7fa',
          100: '#d9e9f0',
          200: '#cfe7f2',
          300: '#a9d6e5',
          400: '#89c2d9',
          500: '#61a5c2',
          600: '#468faf',
          700: '#2c7da0',
          800: '#2a6f97',
          900: '#014f86',
          950: '#012a4a',
        },
        deep: {
          space: '#012a4a',
          navy: '#013a63',
          yale: '#01497c',
          blue: '#014f86',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeSlideIn 0.3s ease-out',
        'slide-up': 'fadeSlideIn 0.4s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeSlideIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'glass': '0 4px 24px rgba(1, 42, 74, 0.08)',
        'glass-lg': '0 8px 40px rgba(1, 42, 74, 0.12)',
        'glow': '0 4px 20px rgba(42, 111, 151, 0.35)',
        'card': '0 1px 3px rgba(1, 42, 74, 0.06), 0 1px 2px rgba(1, 42, 74, 0.04)',
        'card-hover': '0 10px 40px rgba(1, 42, 74, 0.1), 0 4px 12px rgba(1, 42, 74, 0.05)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
