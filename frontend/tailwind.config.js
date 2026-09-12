/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // ── DORA Donuts & Pastry palette ──────────────────────────
        ink: "#FF0090",       // primary text / buttons / accents — pink
        charcoal: "#000000",  // secondary text / footer text — black
        stone: "#45cbdd",     // darker cyan accent
        beige: "#45cbdd",     // darker cyan accent
        cream: "#45cbdd",     // darker cyan accent
        paper: "#FFFFFF",     // page background — white
      },
      fontFamily: {
        display: ["'Fraunces'", "Georgia", "serif"],
        body: ["'Inter'", "Helvetica", "Arial", "sans-serif"],
      },
      letterSpacing: {
        widest2: "0.18em",
      },
    },
  },
  plugins: [],
};