/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{njk,md,html}",
    "./src/**/*.ts",
    "./tmp/write-mobile-blog-template-2023-11-27-04-59-51-utc/write/**/*.html"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#34EDC4",
          dark: "#111111",
          light: "#ffffff"
        },
        neutral: {
          50: "#fafafa",
          100: "#f4f4f4",
          200: "#eeeeee",
          300: "#dddddd"
        }
      },
      fontFamily: {
        display: ["'Montserrat'", "'Noto Sans JP'", "sans-serif"],
        body: ["'Noto Sans JP'", "'Hiragino Kaku Gothic ProN'", "sans-serif"]
      },
      boxShadow: {
        card: "0 20px 40px rgba(0, 0, 0, 0.08)"
      }
    }
  },
  plugins: []
};
