/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      letterSpacing: {
        'super-wide': '0.25em',
        'mega-wide': '0.4em',
      },
      fontFamily: {
        'luxury': ['"Montserrat"', '"Inter"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

