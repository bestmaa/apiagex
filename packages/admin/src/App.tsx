import { FormEvent, useEffect, useState } from "react";
import { authenticateOwner } from "./api";
import { ApiList } from "./ApiList";
import { DashboardPage } from "./DashboardPage";
import { EntryManager } from "./EntryManager";
import { RoleManager } from "./RoleManager";
import { SchemaBuilder } from "./SchemaBuilder";
import { UserManager } from "./UserManager";
import { SessionPanel } from "./components/SessionPanel";
import { ThemeToggle } from "./components/ThemeToggle";
import { useAdminTheme } from "./hooks/useAdminTheme";
import { DocsPage } from "./pages/DocsPage";
import type { OwnerSession } from "./session.type";
import "./tokens.css";
import "./styles.css";
import "./polish.css";

type AdminRoute = "dashboard" | "schemas" | "entries" | "apis" | "roles" | "users" | "docs";

const navItems: { label: string; route: AdminRoute }[] = [
  { label: "Dashboard", route: "dashboard" },
  { label: "Schemas", route: "schemas" },
  { label: "Entries", route: "entries" },
  { label: "APIs", route: "apis" },
  { label: "Roles", route: "roles" },
  { label: "Users", route: "users" },
  { label: "Docs", route: "docs" },
];
const sessionKey = "apiagexOwner";

export function App() {
  const [session, setSession] = useState<OwnerSession | null>(null);
  const [route, setRoute] = useState<AdminRoute>(readRoute());
  const [status, setStatus] = useState("No owner session");
  const { theme, toggleTheme } = useAdminTheme();

  useEffect(() => {
    const saved = localStorage.getItem(sessionKey);
    if (saved) {
      const nextSession = JSON.parse(saved) as OwnerSession;
      setSession(nextSession);
      setStatus(`Logged in owner: ${nextSession.email}`);
    }
  }, []);

  useEffect(() => {
    function syncRoute() {
      setRoute(readRoute());
    }
    window.addEventListener("hashchange", syncRoute);
    return () => window.removeEventListener("hashchange", syncRoute);
  }, []);

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    setStatus("Checking owner setup/login");
    const result = await authenticateOwner(email, password);
    if (!result.ok || !result.user) {
      setStatus(result.error ?? "Login failed");
      return;
    }
    const nextSession = { email: result.user.email, token: result.token ?? "bootstrap-owner" };
    localStorage.setItem(sessionKey, JSON.stringify(nextSession));
    setSession(nextSession);
    setStatus(`Logged in owner: ${nextSession.email}`);
  }

  function logout() {
    localStorage.removeItem(sessionKey);
    setSession(null);
    setStatus("No owner session");
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Headless CMS control plane</p>
          <h1>Apiagex Admin UI</h1>
        </div>
        <div className="header-actions">
          <ThemeToggle onToggle={toggleTheme} theme={theme} />
          {session ? <button onClick={logout}>Logout</button> : null}
        </div>
      </header>
      <nav aria-label="Admin navigation">
        {navItems.map((item) => (
          <a
            aria-current={route === item.route ? "page" : undefined}
            className={route === item.route ? "active" : undefined}
            href={`#${item.route}`}
            key={item.route}
          >
            {item.label}
          </a>
        ))}
      </nav>
      <main>
        {renderRoute(route, session, status, submitLogin, logout)}
      </main>
    </div>
  );
}

function readRoute(): AdminRoute {
  const nextRoute = window.location.hash.replace("#", "");
  return navItems.some((item) => item.route === nextRoute) ? nextRoute as AdminRoute : "dashboard";
}

function renderRoute(
  route: AdminRoute,
  session: OwnerSession | null,
  status: string,
  submitLogin: (event: FormEvent<HTMLFormElement>) => void,
  logout: () => void,
) {
  if (route === "dashboard") {
    return (
      <DashboardPage
        sessionPanel={
          <SessionPanel
            onReset={logout}
            onSubmit={submitLogin}
            session={session}
            status={status}
          />
        }
      />
    );
  }
  if (route === "docs") return <DocsPage />;
  if (!session) return <LoginRequiredPage onReset={logout} status={status} onSubmit={submitLogin} />;
  if (route === "schemas") return <SchemaBuilder />;
  if (route === "entries") return <EntryManager />;
  if (route === "apis") return <ApiList />;
  if (route === "roles") return <RoleManager />;
  return <UserManager />;
}

function LoginRequiredPage({
  onReset,
  status,
  onSubmit,
}: {
  onReset: () => void;
  status: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <>
      <p className="empty-state">Login as owner to use this Admin UI page.</p>
      <SessionPanel onReset={onReset} session={null} status={status} onSubmit={onSubmit} />
    </>
  );
}
