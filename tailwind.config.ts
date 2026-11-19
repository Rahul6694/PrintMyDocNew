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
        yellow: "var(--c-yellow)",
        orange: "var(--c-orange)",
        violet: "var(--c-violet)",
        dark: "var(--c-dark)",
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
        display: ["var(--font-display)", "var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,46,99,0.18), 0 12px 30px -10px rgba(255,46,99,0.4)",
        pop: "4px 4px 0 0 var(--c-ink)",
        card: "0 1px 2px rgba(16, 24, 40, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
