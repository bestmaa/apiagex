import { FormEvent, useEffect, useState } from "react";
import {
  authenticateOwner,
  ownerSessionStorageKey,
  readStoredOwnerSession,
  readOwnerStatus,
  setAdminAuthToken,
  validateOwnerSession,
} from "./api";
import { ApiList } from "./ApiList";
import { DashboardPage } from "./DashboardPage";
import { EntryManager } from "./EntryManager";
import { PlatformPage } from "./PlatformPage";
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
  { label: "Platform", route: "platform" },
  { label: "Settings", route: "settings" },
  { label: "Docs", route: "docs" },
];
export function App() {
  const [ownerHasOwner, setOwnerHasOwner] = useState<boolean | null>(null);
  const [session, setSession] = useState<OwnerSession | null>(null);
  const [route, setRoute] = useState<AdminRoute>(readRoute());
  const [status, setStatus] = useState("No owner session");
  const { theme, toggleTheme } = useAdminTheme();

  useEffect(() => {
    let cancelled = false;
    async function loadOwnerState() {
      const ownerStatus = await readOwnerStatus();
      if (cancelled) return;
      if (ownerStatus.ok && ownerStatus.hasOwner !== undefined) setOwnerHasOwner(ownerStatus.hasOwner);
      const saved = readStoredOwnerSession();
      if (!saved) {
        setStatus(ownerStatus.hasOwner ? "Owner login ready" : "Owner setup ready");
        return;
      }
      setStatus("Checking saved owner session");
      setAdminAuthToken(saved.token);
      const sessionResult = await validateOwnerSession(saved.token);
      if (cancelled) return;
      if (!sessionResult.ok || !sessionResult.user) {
        localStorage.removeItem(ownerSessionStorageKey);
        setAdminAuthToken(undefined);
        setSession(null);
        setStatus(ownerStatus.hasOwner ? "Owner session expired. Login again." : "Owner setup ready");
        return;
      }
      const nextSession = { email: sessionResult.user.email, token: saved.token };
      setSession(nextSession);
      setStatus(`Logged in owner: ${nextSession.email}`);
    }
    loadOwnerState().catch(() => {
      if (!cancelled) setStatus("Owner setup status could not be loaded.");
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
    setStatus(ownerHasOwner ? "Checking owner login" : "Creating owner");
    const result = await authenticateOwner(email, password, ownerHasOwner);
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
    setOwnerHasOwner(true);
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
      {renderRoute(route, session, ownerMode(ownerHasOwner), status, submitLogin, logout)}
    </AdminShell>
  );
}

function readRoute(): AdminRoute {
  return readAdminRoute(window.location.hash);
}

function renderRoute(
  route: AdminRoute,
  session: OwnerSession | null,
  mode: "checking" | "login" | "setup",
  status: string,
  submitLogin: (event: FormEvent<HTMLFormElement>) => void,
  logout: () => void,
) {
  if (route === "dashboard") {
    return (
      <DashboardPage
        sessionPanel={
          <SessionPanel
            mode={mode}
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
  if (!session) return <LoginRequiredPage mode={mode} onReset={logout} status={status} onSubmit={submitLogin} />;
  if (route === "schemas") return <SchemaBuilder />;
  if (route === "entries") return <EntryManager />;
  if (route === "apis") return <ApiList />;
  if (route === "platform") return <PlatformPage />;
  if (route === "settings" || route.startsWith("settings/")) return <SettingsPage route={route} />;
  return <UserManager />;
}

function ownerMode(hasOwner: boolean | null): "checking" | "login" | "setup" {
  if (hasOwner === null) return "checking";
  return hasOwner ? "login" : "setup";
}

function LoginRequiredPage({
  onReset,
  mode,
  status,
  onSubmit,
}: {
  mode: "checking" | "login" | "setup";
  onReset: () => void;
  status: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <>
      <p className="empty-state">Login as owner to use this Admin UI page.</p>
      <SessionPanel mode={mode} onReset={onReset} session={null} status={status} onSubmit={onSubmit} />
    </>
  );
}
