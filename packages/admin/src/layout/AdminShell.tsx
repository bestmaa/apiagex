import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { BookOpen, Database, FileText, Home, Menu, Network, Settings, Users, X } from "lucide-react";
import { activeNavRoute, isRouteActive, isSettingsRoute, settingsSubnavItems } from "../app-route";
import type { AdminNavItem, AdminRoute } from "../app-route.type";
import type { OwnerSession } from "../session.type";
import { ThemeToggle } from "../components/ThemeToggle";
import type { AdminTheme } from "../theme.type";
import { AdminSubnavContext } from "./admin-subnav-context";
import type { AdminSubnavSlot } from "./admin-subnav-context.type";
import "./admin-shell.css";

const navIcons = {
  apis: Network,
  dashboard: Home,
  docs: BookOpen,
  entries: FileText,
  schemas: Database,
  settings: Settings,
  "settings/admin-roles": Settings,
  "settings/content-roles": Settings,
  "settings/webhooks": Settings,
  users: Users,
  "docs/webhooks": BookOpen,
} satisfies Record<AdminRoute, typeof Home>;

const pageDescriptions = {
  apis: "Inspect generated content APIs and examples.",
  dashboard: "Review workspace health and next actions.",
  docs: "Read the owner workflow and API notes.",
  entries: "Create, edit, and connect content entries.",
  schemas: "Design fields, relations, and generated APIs.",
  settings: "Manage admin roles and content API role separation.",
  "settings/admin-roles": "Manage Admin UI roles and control-plane permissions.",
  "settings/content-roles": "Manage generated content API roles and permissions.",
  "settings/webhooks": "Manage signed hooks for content API changes.",
  users: "Invite users and assign exactly one API role.",
  "docs/webhooks": "Verify signed webhook requests in receiver apps.",
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
  const current = navItems.find((item) => item.route === activeNavRoute(route));
  const mainRef = useRef<HTMLElement>(null);
  const previousRouteRef = useRef(route);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [customSubnav, setCustomSubnav] = useState<AdminSubnavSlot>(null);
  const MenuIcon = mobileNavOpen ? X : Menu;
  const subnav = isSettingsRoute(route) ? settingsSubnav(route) : customSubnav;
  const hasSubnav = Boolean(subnav);

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
    <AdminSubnavContext.Provider value={setCustomSubnav}>
      <div className={hasSubnav ? "admin-shell has-subnav" : "admin-shell"}>
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
              const active = isRouteActive(route, item);
              return (
                <a
                  aria-current={active ? "page" : undefined}
                  className={active ? "active" : undefined}
                  href={`#${item.route}`}
                  key={item.route}
                  onClick={() => setMobileNavOpen(false)}
                  title={item.label}
                >
                  <Icon aria-hidden="true" size={16} />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>
        </aside>
        {subnav ? <aside className="admin-subnav" aria-label={subnav.ariaLabel}>{subnav.content}</aside> : null}
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
    </AdminSubnavContext.Provider>
  );
}

function settingsSubnav(route: AdminRoute): AdminSubnavSlot {
  return {
    ariaLabel: "Settings navigation",
    content: (
      <>
        <p className="eyebrow">Settings</p>
        <h2>Access</h2>
        <nav>
          {settingsSubnavItems.map((item) => (
            <a
              aria-current={route === item.route ? "page" : undefined}
              className={route === item.route ? "active" : undefined}
              href={`#${item.route}`}
              key={item.route}
            >
              <strong>{item.label}</strong>
              <span>{item.description}</span>
            </a>
          ))}
        </nav>
      </>
    ),
  };
}
