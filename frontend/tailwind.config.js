/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        xylo: {
          50: "#eef5f2",
          100: "#d7e7e0",
          200: "#b2d0c4",
          300: "#6db89e",
          400: "#4a9d7f",
          500: "#3d8a6e",
          600: "#2f6f58",
          700: "#245544",
          800: "#1a3d31",
          900: "#112820",
        },
        base: {
          bg: "#f5f5f7",
          card: "#ffffff",
          border: "#d2d2d7",
          text: "#1d1d1f",
          muted: "#6e6e73",
          subtle: "#e8e8ed",
        },
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "SF Pro Display", "SF Pro Text", "Helvetica Neue", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 12px rgba(0,0,0,0.08)",
        card: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
        elevated: "0 8px 32px rgba(0,0,0,0.12)",
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
        "3xl": "20px",
      },
    },
  },
  plugins: [],
};