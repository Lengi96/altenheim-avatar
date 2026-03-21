/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontSize: {
        'kiosk-sm': ['1.125rem', '1.75rem'],
        'kiosk-base': ['1.25rem', '2rem'],
        'kiosk-lg': ['1.5rem', '2.25rem'],
        'kiosk-xl': ['2rem', '2.5rem'],
        'kiosk-2xl': ['2.5rem', '3rem'],
      },
      minHeight: {
        touch: '48px',
      },
      minWidth: {
        touch: '48px',
      },
    },
  },
  plugins: [],
};
