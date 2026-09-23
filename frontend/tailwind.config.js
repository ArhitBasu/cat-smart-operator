/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        catYellow: "#FFB000",
        dark: {
          900: "#111827", // Background
          800: "#1F2937", // Card background
          700: "#374151", // Borders, secondary background
        },
        risk: {
          low: "#10B981",    // Emerald 500
          medium: "#F59E0B", // Amber 500
          high: "#F97316",   // Orange 500
          critical: "#EF4444",// Red 500
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
