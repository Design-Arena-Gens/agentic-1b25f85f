/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Poppins'", "ui-sans-serif", "system-ui"],
        body: ["'Inter'", "ui-sans-serif", "system-ui"]
      },
      colors: {
        "board-bg": "#0f172a",
        "card-bg": "#1e293b",
        "accent": "#38bdf8",
        "accent-soft": "rgba(56, 189, 248, 0.1)"
      },
      boxShadow: {
        floating: "0 20px 45px rgba(15, 23, 42, 0.45)"
      }
    }
  },
  plugins: []
};
