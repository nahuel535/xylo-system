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
          300: "#8bb7a6",
          400: "#6ea08f",
          500: "#5F8F83",
          600: "#4d756b",
          700: "#3f5f57",
          800: "#344d47",
          900: "#2c403b",
        },
        base: {
          bg: "#0F1112",
          card: "#171A1C",
          border: "#252A2D",
          text: "#F3F5F4",
          muted: "#A7B0AC",
        },
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.18)",
      },
    },
  },
  plugins: [],
};