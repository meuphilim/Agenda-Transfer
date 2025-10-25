/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'eco-primary': {
          200: '#d9f99d',
          500: '#84cc16',
          700: '#65a30d',
        },
        'eco-secondary': '#2A3312',
        'eco-text': {
          900: '#111827',
          700: '#374151',
          500: '#6b7280',
          300: '#d1d5db',
        },
        'eco-bg': {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
        },
        'eco-feedback': {
          success: '#22c55e',
          warning: '#f59e0b',
          danger: '#ef4444',
        },
      },
    },
  },
  plugins: [],
};