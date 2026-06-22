/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        red: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#38a9f8',
          500: '#1a6fdc', // Lighter Royal Blue
          600: '#0653A5', // Royal Blue primary
          700: '#004799', // Darker Royal Blue
          800: '#033f7e',
          900: '#093669',
        },
        blue: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#FFD700', // Golden Yellow
          600: '#eab308',
          700: '#ca8a04',
          800: '#a16207',
          900: '#854d0e',
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

