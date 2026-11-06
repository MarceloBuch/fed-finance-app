/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#0B101E',
        sidebarBg: '#111727',
        cardBg: '#181F32',
        accentCyan: '#00E5FF',
        positiveGreen: '#00FF88',
      }
    },
  },
  plugins: [],
}
