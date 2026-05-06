import { Moon, Sun } from "lucide-react";
import type { AdminTheme } from "../theme.type";
import "./theme-toggle.css";

export function ThemeToggle({
  onToggle,
  theme,
}: {
  onToggle: () => void;
  theme: AdminTheme;
}) {
  const nextTheme = theme === "dark" ? "light" : "dark";
  const Icon = theme === "dark" ? Moon : Sun;
  return (
    <button
      aria-label={`Switch to ${nextTheme} mode`}
      className="theme-toggle"
      onClick={onToggle}
      type="button"
    >
      <Icon aria-hidden="true" size={16} />
      <span>{theme === "dark" ? "Dark" : "Light"}</span>
    </button>
  );
}
