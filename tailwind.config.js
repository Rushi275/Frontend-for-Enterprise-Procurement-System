/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#12172B",
          light: "#1C2340",
          border: "#2A3153",
        },
        paper: "#F6F7FB",
        card: "#FFFFFF",
        slate: {
          DEFAULT: "#5B6478",
          light: "#9298A8",
        },
        signal: {
          DEFAULT: "#3454D1",
          dark: "#2A44AD",
          light: "#EAEEFC",
        },
        amber: {
          DEFAULT: "#E0A526",
          light: "#FBF1DC",
        },
        good: {
          DEFAULT: "#1E9E6B",
          light: "#E1F5EC",
        },
        coral: {
          DEFAULT: "#E15554",
          light: "#FBE7E7",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      borderRadius: {
        card: "10px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(18,23,43,0.04), 0 1px 12px rgba(18,23,43,0.04)",
      },
    },
  },
  plugins: [],
}
