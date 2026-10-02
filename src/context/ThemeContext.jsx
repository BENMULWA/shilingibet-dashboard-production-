import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);
const STORAGE_KEY = "shilingibet-dashboard-theme";

const getSystemPrefersDark = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches;

const resolveIsDark = (mode) =>
  mode === "dark" || (mode === "system" && getSystemPrefersDark());

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || "dark";
    } catch {
      return "dark";
    }
  });
  const [isDark, setIsDark] = useState(() => resolveIsDark(mode));

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* ignore write failures (private browsing, etc.) */
    }
    setIsDark(resolveIsDark(mode));

    if (mode !== "system") return undefined;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => setIsDark(e.matches);
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [mode]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const value = useMemo(() => ({ mode, setMode, isDark }), [mode, isDark]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
