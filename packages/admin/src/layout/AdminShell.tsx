import type { ReactNode } from "react";
import { BookOpen, Database, FileText, Home, KeyRound, Network, Users } from "lucide-react";
import type { AdminNavItem, AdminRoute } from "../app-route.type";
import type { OwnerSession } from "../session.type";
import { ThemeToggle } from "../components/ThemeToggle";
import type { AdminTheme } from "../theme.type";
import "./admin-shell.css";

const navIcons = {
  apis: Network,
  dashboard: Home,
  docs: BookOpen,
  entries: FileText,
  roles: KeyRound,
  schemas: Database,
  users: Users,
} satisfies Record<AdminRoute, typeof Home>;

export function AdminShell({
  children,
  navItems,
  onLogout,
  onToggleTheme,
  route,
  session,
  theme,
}: {
  children: ReactNode;
  navItems: AdminNavItem[];
  onLogout: () => void;
  onToggleTheme: () => void;
  route: AdminRoute;
  session: OwnerSession | null;
  theme: AdminTheme;
}) {
  const current = navItems.find((item) => item.route === route);
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar" aria-label="Admin sidebar">
        <div className="admin-brand">
          <p className="eyebrow">Control plane</p>
          <h1>Apiagex</h1>
        </div>
        <nav className="admin-nav" aria-label="Admin navigation">
          {navItems.map((item) => {
            const Icon = navIcons[item.route];
            return (
              <a
                aria-current={route === item.route ? "page" : undefined}
                className={route === item.route ? "active" : undefined}
                href={`#${item.route}`}
                key={item.route}
              >
                <Icon aria-hidden="true" size={16} />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>
      </aside>
      <div className="admin-workspace">
        <header className="admin-topbar">
          <div>
            <p className="eyebrow">Headless CMS admin</p>
            <h2>{current?.label ?? "Dashboard"}</h2>
          </div>
          <div className="header-actions">
            <ThemeToggle onToggle={onToggleTheme} theme={theme} />
            {session ? <button onClick={onLogout}>Logout</button> : null}
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
