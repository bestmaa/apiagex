import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { BookOpen, Database, FileText, Home, KeyRound, Menu, Network, Users, X } from "lucide-react";
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

const pageDescriptions = {
  apis: "Inspect generated content APIs and examples.",
  dashboard: "Review workspace health and next actions.",
  docs: "Read the owner workflow and API notes.",
  entries: "Create, edit, and connect content entries.",
  roles: "Configure role permissions for each API.",
  schemas: "Design fields, relations, and generated APIs.",
  users: "Invite users and assign exactly one role.",
} satisfies Record<AdminRoute, string>;

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
  const mainRef = useRef<HTMLElement>(null);
  const previousRouteRef = useRef(route);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const MenuIcon = mobileNavOpen ? X : Menu;

  useEffect(() => {
    if (previousRouteRef.current !== route) {
      mainRef.current?.focus({ preventScroll: true });
      previousRouteRef.current = route;
    }
  }, [route]);

  function closeMobileNavOnEscape(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") setMobileNavOpen(false);
  }

  return (
    <div className="admin-shell">
      <a className="skip-link" href="#admin-main">Skip to content</a>
      <aside className="admin-sidebar" aria-label="Admin sidebar" onKeyDown={closeMobileNavOnEscape}>
        <div className="admin-brand">
          <span className="admin-brand-mark" aria-hidden="true">A</span>
          <div>
            <p className="eyebrow">Control plane</p>
            <h1>Apiagex</h1>
          </div>
          <button
            aria-controls="admin-mobile-nav"
            aria-expanded={mobileNavOpen}
            className="mobile-nav-toggle"
            onClick={() => setMobileNavOpen((open) => !open)}
            type="button"
          >
            <MenuIcon aria-hidden="true" size={18} />
            <span>{mobileNavOpen ? "Close menu" : "Open menu"}</span>
          </button>
        </div>
        <nav
          className={mobileNavOpen ? "admin-nav is-open" : "admin-nav"}
          id="admin-mobile-nav"
          aria-label="Admin navigation"
        >
          {navItems.map((item) => {
            const Icon = navIcons[item.route];
            return (
              <a
                aria-current={route === item.route ? "page" : undefined}
                className={route === item.route ? "active" : undefined}
                href={`#${item.route}`}
                key={item.route}
                onClick={() => setMobileNavOpen(false)}
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
          <div className="page-heading">
            <nav aria-label="Breadcrumb" className="admin-breadcrumb">
              <a href="#dashboard">Admin</a>
              <span aria-hidden="true">/</span>
              <span>{current?.label ?? "Dashboard"}</span>
            </nav>
            <h2>{current?.label ?? "Dashboard"}</h2>
            <p>{pageDescriptions[route]}</p>
          </div>
          <div className="header-actions">
            <ThemeToggle onToggle={onToggleTheme} theme={theme} />
            {session ? <button onClick={onLogout}>Logout</button> : null}
          </div>
        </header>
        <main id="admin-main" ref={mainRef} tabIndex={-1}>{children}</main>
      </div>
    </div>
  );
}
