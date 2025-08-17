/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'gloria-hallelujah': ['Gloria Hallelujah', 'cursive'],
        'roboto': ['Roboto', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      fontSize: {
        '10': ['10px', { lineHeight: '1rem' }],
        '16': ['16px', { lineHeight: '1.5rem' }],
        '20': ['20px', { lineHeight: '1.75rem' }],
        '30': ['30px', { lineHeight: '2.25rem' }],
        '40': ['40px', { lineHeight: '3rem' }],
        '60': ['60px', { lineHeight: '1' }],
        '10xl': ['10rem', { lineHeight: '1' }],
      },
    },
  },
  plugins: [],
}