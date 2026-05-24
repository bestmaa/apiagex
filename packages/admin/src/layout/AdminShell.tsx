import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import {
  Bell,
  Box,
  ChevronDown,
  Code2,
  FileText,
  Home,
  Image,
  KeyRound,
  LayoutTemplate,
  Menu,
  Network,
  Plug,
  Search,
  Settings,
  Shield,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { activeNavRoute, isSettingsRoute, settingsSubnavItems } from "../app-route";
import type { AdminNavItem, AdminRoute } from "../app-route.type";
import type { OwnerSession } from "../session.type";
import { ThemeToggle } from "../components/ThemeToggle";
import type { AdminTheme } from "../theme.type";
import { AdminSubnavContext } from "./admin-subnav-context";
import type { AdminSubnavSlot } from "./admin-subnav-context.type";
import "./admin-shell.css";

type ShellNavItem = {
  icon: LucideIcon;
  label: string;
  route: AdminRoute;
};

type ShellNavGroup = {
  items: ShellNavItem[];
  label?: string;
};

const apiSubnavItems: ShellNavItem[] = [
  { icon: Code2, label: "APIs", route: "apis" },
  { icon: Network, label: "Endpoints", route: "apis/endpoints" },
  { icon: KeyRound, label: "API Keys", route: "settings/api-tokens" },
  { icon: Plug, label: "Webhooks", route: "settings/webhooks" },
  { icon: FileText, label: "Logs", route: "apis/logs" },
  { icon: Settings, label: "Settings", route: "settings/api-docs" },
];

const navGroups: ShellNavGroup[] = [
  {
    items: [
      { icon: Home, label: "Dashboard", route: "dashboard" },
      { icon: FileText, label: "Content", route: "entries" },
      { icon: Box, label: "Schema Builder", route: "schemas" },
      { icon: LayoutTemplate, label: "Templates", route: "settings/project-template" },
      { icon: Image, label: "Media", route: "entries" },
      { icon: Users, label: "Users", route: "users" },
    ],
  },
  {
    label: "API Management",
    items: apiSubnavItems,
  },
  {
    items: [
      { icon: Shield, label: "System", route: "platform" },
      { icon: Settings, label: "Settings", route: "settings" },
    ],
  },
];

const pageDescriptions = {
  apis: "Inspect generated content APIs and examples.",
  "apis/endpoints": "Review generated content endpoints by schema.",
  "apis/logs": "Read runtime API request logs from rotating JSONL files.",
  dashboard: "Review workspace health and next actions.",
  docs: "Read the owner workflow and API notes.",
  entries: "Create, edit, and connect content entries.",
  schemas: "Design fields, relations, and generated APIs.",
  settings: "Manage admin roles and content API role separation.",
  "settings/admin-roles": "Manage Admin UI roles and control-plane permissions.",
  "settings/content-roles": "Manage generated content API roles and permissions.",
  "settings/api-permissions": "Allow, block, or open generated content APIs.",
  "settings/custom-api-permissions": "Allow, block, or open custom business APIs.",
  "settings/api-tokens": "Create and revoke content API tokens.",
  "settings/automation-tokens": "Create UI-assisted automation tokens for Codex and AI workflows.",
  "settings/project-template": "Export and import reusable schema, role, and API templates.",
  "settings/api-docs": "Control Swagger/OpenAPI visibility.",
  "settings/webhooks": "Manage signed hooks for content API changes.",
  "settings/realtime": "Enable WebSocket events for generated content APIs.",
  "settings/workflows": "Build no-code custom APIs with safe workflow steps.",
  users: "Invite users and assign exactly one API role.",
  platform: "Provision tenants, database targets, and project-level runtime settings.",
  "docs/webhooks": "Verify signed webhook requests in receiver apps.",
  "docs/realtime": "Build live clients with realtime WebSocket events.",
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
  const routeTitle = titleForRoute(route, current?.label ?? "Dashboard");
  const routeDescription = pageDescriptions[route];

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
      <div className="admin-shell">
        <a className="skip-link" href="#admin-main">Skip to content</a>
        <aside className="admin-sidebar" aria-label="Admin sidebar" onKeyDown={closeMobileNavOnEscape}>
          <div className="admin-brand">
            <span className="admin-brand-mark" aria-hidden="true"><Home size={16} /></span>
            <div>
              <h1>Apiagex <span>CMS</span></h1>
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
            {navGroups.map((group, groupIndex) => (
              <div className="admin-nav-group" key={group.label ?? groupIndex}>
                {group.label ? (
                  <p className={isApiManagementActive(route) ? "admin-nav-parent is-open" : "admin-nav-parent"}>
                    <Shield aria-hidden="true" size={16} />
                    <span>{group.label}</span>
                    <ChevronDown aria-hidden="true" size={15} />
                  </p>
                ) : null}
                <div className={group.label ? "admin-nav-subitems" : "admin-nav-items"}>
                  {group.items.map((item) => (
                    <SidebarLink
                      active={isShellRouteActive(route, item.route)}
                      item={item}
                      key={`${group.label ?? "nav"}-${item.label}`}
                      onClick={() => setMobileNavOpen(false)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>
        <div className="admin-workspace">
          <header className="admin-topbar">
            <div className="admin-search" role="search">
              <Search aria-hidden="true" size={18} />
              <input aria-label="Search admin" placeholder="Search anything..." type="search" />
              <kbd>Ctrl K</kbd>
            </div>
            <div className="header-actions">
              <ThemeToggle onToggle={onToggleTheme} theme={theme} />
              <button className="icon-button" aria-label="Notifications" type="button">
                <Bell aria-hidden="true" size={18} />
                <span className="notification-dot" aria-hidden="true" />
              </button>
              <div className="admin-user-menu">
                <span className="admin-avatar" aria-hidden="true">{initials(session?.email)}</span>
                <span>
                  <strong>{session?.email ? displayName(session.email) : "John Doe"}</strong>
                  <small>{session ? "Admin" : "Guest"}</small>
                </span>
                <ChevronDown aria-hidden="true" size={15} />
              </div>
              {session ? <button className="ghost-button" onClick={onLogout}>Logout</button> : null}
            </div>
          </header>
          <main id="admin-main" ref={mainRef} tabIndex={-1}>
            <div className="page-heading">
              <nav aria-label="Breadcrumb" className="admin-breadcrumb">
                <a href="#dashboard">{routeTitle}</a>
                <span aria-hidden="true">/</span>
                <span>{routeTitle === "API Management" ? "APIs" : routeTitle}</span>
              </nav>
              <h2>{routeTitle}</h2>
              <p>{routeDescription}</p>
            </div>
            {subnav && route !== "apis" ? <div className="admin-inline-subnav" aria-label={subnav.ariaLabel}>{subnav.content}</div> : null}
            {children}
          </main>
        </div>
      </div>
    </AdminSubnavContext.Provider>
  );
}

function SidebarLink({
  active,
  item,
  onClick,
}: {
  active: boolean;
  item: ShellNavItem;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <a
      aria-current={active ? "page" : undefined}
      className={active ? "active" : undefined}
      href={`#${item.route}`}
      onClick={onClick}
      title={item.label}
    >
      <Icon aria-hidden="true" size={16} />
      <span>{item.label}</span>
    </a>
  );
}

function isApiManagementActive(route: AdminRoute): boolean {
  return route === "apis" || route === "apis/endpoints" || route === "apis/logs" || route === "settings/api-tokens" || route === "settings/webhooks" || route === "settings/custom-api-permissions" || route === "settings/api-docs";
}

function isShellRouteActive(currentRoute: AdminRoute, itemRoute: AdminRoute): boolean {
  if (itemRoute === "apis") return currentRoute === "apis";
  if (itemRoute === "settings") return currentRoute === "settings" || currentRoute === "settings/admin-roles" || currentRoute === "settings/content-roles" || currentRoute === "settings/api-permissions" || currentRoute === "settings/automation-tokens" || currentRoute === "settings/realtime" || currentRoute === "settings/workflows";
  return currentRoute === itemRoute || activeNavRoute(currentRoute) === itemRoute;
}

function titleForRoute(route: AdminRoute, fallback: string): string {
  if (isApiManagementActive(route)) return "API Management";
  if (route === "schemas") return "Schema Builder";
  return fallback;
}

function initials(email: string | undefined): string {
  if (!email) return "JD";
  return email.slice(0, 2).toUpperCase();
}

function displayName(email: string): string {
  return email.split("@")[0]?.replace(/[._-]+/g, " ") || "Admin";
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
