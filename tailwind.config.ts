import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        base: {
          950: "var(--c-950)",
          900: "var(--c-900)",
          850: "var(--c-850)",
          800: "var(--c-800)",
          700: "var(--c-700)",
          600: "var(--c-600)",
          500: "var(--c-500)",
        },
        ink: "var(--c-ink)",
        accent: {
          400: "var(--c-accent-400)",
          500: "var(--c-accent-500)",
          600: "var(--c-accent-600)",
        },
        success: "var(--c-success)",
        warning: "var(--c-warning)",
        danger: "var(--c-danger)",
        stat: {
          blue: "var(--c-stat-blue)",
          yellow: "var(--c-stat-yellow)",
          red: "var(--c-stat-red)",
          green: "var(--c-stat-green)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(91,107,255,0.15), 0 8px 24px -8px rgba(91,107,255,0.35)",
        card: "0 1px 2px rgba(16, 24, 40, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
