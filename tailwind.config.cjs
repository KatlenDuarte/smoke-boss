/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tabaco: {
          escuro: '#1A1410',
          medio: '#2D2420',
          laranja: '#D4845C',
        }
      }
    },
  },
  plugins: [],
}