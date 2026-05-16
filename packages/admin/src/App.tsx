import { FormEvent, useEffect, useState } from "react";
import {
  authenticateOwner,
  ownerSessionStorageKey,
  readStoredOwnerSession,
  setAdminAuthToken,
  validateOwnerSession,
} from "./api";
import { ApiList } from "./ApiList";
import { DashboardPage } from "./DashboardPage";
import { EntryManager } from "./EntryManager";
import { SchemaBuilder } from "./SchemaBuilder";
import { UserManager } from "./UserManager";
import { readAdminRoute } from "./app-route";
import type { AdminNavItem, AdminRoute } from "./app-route.type";
import { SessionPanel } from "./components/SessionPanel";
import { useAdminTheme } from "./hooks/useAdminTheme";
import { AdminShell } from "./layout/AdminShell";
import { DocsPage } from "./pages/DocsPage";
import { SettingsPage } from "./pages/SettingsPage";
import type { OwnerSession } from "./session.type";
import "./tokens.css";
import "./styles.css";
import "./polish.css";

const navItems: AdminNavItem[] = [
  { label: "Dashboard", route: "dashboard" },
  { label: "Schemas", route: "schemas" },
  { label: "Entries", route: "entries" },
  { label: "APIs", route: "apis" },
  { label: "Users", route: "users" },
  { label: "Settings", route: "settings" },
  { label: "Docs", route: "docs" },
];
export function App() {
  const [session, setSession] = useState<OwnerSession | null>(null);
  const [route, setRoute] = useState<AdminRoute>(readRoute());
  const [status, setStatus] = useState("No owner session");
  const { theme, toggleTheme } = useAdminTheme();

  useEffect(() => {
    let cancelled = false;
    const saved = readStoredOwnerSession();
    if (!saved) return undefined;
    setStatus("Checking saved owner session");
    setAdminAuthToken(saved.token);
    validateOwnerSession(saved.token).then((result) => {
      if (cancelled) return;
      if (!result.ok || !result.user) {
        localStorage.removeItem(ownerSessionStorageKey);
        setAdminAuthToken(undefined);
        setSession(null);
        setStatus("Owner session expired. Login again.");
        return;
      }
      const nextSession = { email: result.user.email, token: saved.token };
      setSession(nextSession);
      setStatus(`Logged in owner: ${nextSession.email}`);
    }).catch(() => {
      if (cancelled) return;
      localStorage.removeItem(ownerSessionStorageKey);
      setAdminAuthToken(undefined);
      setSession(null);
      setStatus("Owner session could not be verified. Login again.");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function clearInvalidSession() {
      setSession(null);
      setStatus("Owner session expired. Login again.");
    }
    window.addEventListener("apiagex-owner-session-invalid", clearInvalidSession);
    return () => window.removeEventListener("apiagex-owner-session-invalid", clearInvalidSession);
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
    if (!result.token) {
      setStatus("Owner token missing. Login failed.");
      return;
    }
    const nextSession = { email: result.user.email, token: result.token };
    setAdminAuthToken(nextSession.token);
    localStorage.setItem(ownerSessionStorageKey, JSON.stringify(nextSession));
    setSession(nextSession);
    setStatus(`Logged in owner: ${nextSession.email}`);
  }

  function logout() {
    localStorage.removeItem(ownerSessionStorageKey);
    setAdminAuthToken(undefined);
    setSession(null);
    setStatus("No owner session");
  }

  return (
    <AdminShell
      navItems={navItems}
      onLogout={logout}
      onToggleTheme={toggleTheme}
      route={route}
      session={session}
      theme={theme}
    >
      {renderRoute(route, session, status, submitLogin, logout)}
    </AdminShell>
  );
}

function readRoute(): AdminRoute {
  return readAdminRoute(window.location.hash);
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
        session={session}
      />
    );
  }
  if (route === "docs" || route.startsWith("docs/")) return <DocsPage focus={route === "docs/webhooks" ? "webhooks" : route === "docs/realtime" ? "realtime" : undefined} />;
  if (!session) return <LoginRequiredPage onReset={logout} status={status} onSubmit={submitLogin} />;
  if (route === "schemas") return <SchemaBuilder />;
  if (route === "entries") return <EntryManager />;
  if (route === "apis") return <ApiList />;
  if (route === "settings" || route.startsWith("settings/")) return <SettingsPage route={route} />;
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
