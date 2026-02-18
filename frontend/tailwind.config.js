/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tennis: {
          green: '#2E7D32',
          'green-light': '#4CAF50',
          'green-dark': '#1B5E20',
          clay: '#D2691E',
          grass: '#228B22',
          ball: '#CCFF00',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
