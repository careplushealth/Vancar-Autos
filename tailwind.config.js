/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2f9eb',
          100: '#e2f2d2',
          200: '#c5e5a5',
          300: '#9dd16d',
          400: '#78bc42',
          500: '#55A01F', /* Vancar Green primary */
          600: '#3d7515', /* Darker Green */
          700: '#2e5810',
          800: '#264a0e',
          900: '#1f3d0c',
        },
        gold: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#FFA500', /* Orange */
          600: '#e69100',
          700: '#cc7a00',
          800: '#a36200',
          900: '#7c4a00',
        }
      },
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

