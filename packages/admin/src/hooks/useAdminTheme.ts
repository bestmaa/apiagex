import { useEffect, useState } from "react";
import { adminThemeStorageKey, type AdminTheme } from "../theme.type";

function readTheme(): AdminTheme {
  return localStorage.getItem(adminThemeStorageKey) === "light" ? "light" : "dark";
}

function applyTheme(theme: AdminTheme) {
  document.documentElement.dataset.theme = theme;
}

export function useAdminTheme() {
  const [theme, setTheme] = useState<AdminTheme>(readTheme);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(adminThemeStorageKey, theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => current === "dark" ? "light" : "dark");
  }

  return { theme, toggleTheme };
}
