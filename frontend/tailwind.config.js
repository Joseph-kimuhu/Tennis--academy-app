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
          green: '#006B3F',
          'green-light': '#00A859',
          'green-dark': '#004D2E',
          clay: '#C8553D',
          grass: '#588157',
          ball: '#E8F44D',
          court: '#2B5F75',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'tennis': '0 4px 14px 0 rgba(0, 107, 63, 0.15)',
        'tennis-lg': '0 10px 40px 0 rgba(0, 107, 63, 0.2)',
      }
    },
  },
  plugins: [],
}
