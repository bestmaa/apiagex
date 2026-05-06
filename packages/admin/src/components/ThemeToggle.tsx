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
  return (
    <button
      aria-label={`Switch to ${nextTheme} mode`}
      className="theme-toggle"
      onClick={onToggle}
      type="button"
    >
      <span aria-hidden="true">{theme === "dark" ? "D" : "L"}</span>
      <span>{theme === "dark" ? "Dark" : "Light"}</span>
    </button>
  );
}
