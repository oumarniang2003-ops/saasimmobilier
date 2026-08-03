/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "var(--ink, #1B2130)",
        paper: "var(--paper, #F7F6F3)",
        brand: {
          DEFAULT: "var(--brand, #2563EB)",
          dark: "var(--brand-dark, #1D4ED8)",
        },
        amber: "var(--amber, #D97706)",
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
