"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle({ variant = "row" }: { variant?: "row" | "icon" }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("pmd-theme", next ? "dark" : "light");
    } catch {
      /* private browsing / storage blocked */
    }
  }

  if (variant === "icon") {
    return (
      <button
        onClick={toggle}
        aria-label="Toggle dark mode"
        className="w-9 h-9 rounded-full flex items-center justify-center border border-base-700 hover:border-accent-500 transition-colors shrink-0"
      >
        {isDark ? <SunIcon /> : <MoonIcon />}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-base-800 transition-colors text-sm text-base-500"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
      {isDark ? "Light Mode" : "Dark Mode"}
    </button>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}
