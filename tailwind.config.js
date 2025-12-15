/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: '#0a3935',
        orange: '#ff6b35',
        cream: '#fdfbf7',
        sage: '#c3d3d1'
      },
      fontFamily: {
        sans: ['Cairo', 'sans-serif'], // خط مناسب للغة العربية (تأكد من استيراده في index.css)
      }
    },
  },
  plugins: [],
}