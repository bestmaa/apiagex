import { FormEvent, useEffect, useState } from "react";
import { authenticateOwner } from "./api";
import { ApiList } from "./ApiList";
import { EntryManager } from "./EntryManager";
import { RoleManager } from "./RoleManager";
import { SchemaBuilder } from "./SchemaBuilder";
import { UserManager } from "./UserManager";
import type { OwnerSession } from "./session.type";
import "./styles.css";

const navItems = ["Dashboard", "Schemas", "APIs", "Roles", "Users", "Docs"];
const sessionKey = "apiagexOwner";

export function App() {
  const [session, setSession] = useState<OwnerSession | null>(null);
  const [status, setStatus] = useState("No owner session");

  useEffect(() => {
    const saved = localStorage.getItem(sessionKey);
    if (saved) {
      const nextSession = JSON.parse(saved) as OwnerSession;
      setSession(nextSession);
      setStatus(`Logged in owner: ${nextSession.email}`);
    }
  }, []);

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
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
        {session ? <button onClick={logout}>Logout</button> : null}
      </header>
      <nav aria-label="Admin navigation">
        {navItems.map((item) => (
          <a href={item === "Docs" ? "/doc" : `#${item.toLowerCase()}`} key={item}>
            {item}
          </a>
        ))}
      </nav>
      <main>
        <section className="summary-panel">
          <h2>Dashboard</h2>
          <p>English: Owner can create schemas, entries, APIs, roles, permissions, and users.</p>
          <p>Hinglish: Owner schemas, entries, APIs, roles, permissions, aur users bana sakta hai.</p>
        </section>
        <section aria-labelledby="owner-login-title">
          <h2 id="owner-login-title">Owner Login</h2>
          {!session ? <OwnerLoginForm onSubmit={submitLogin} /> : null}
          <p className="status-line" id="owner-session-status">{status}</p>
        </section>
        {session ? (
          <>
            <SchemaBuilder />
            <EntryManager />
            <ApiList />
            <RoleManager />
            <UserManager />
          </>
        ) : <p className="empty-state">Login as owner to create schemas, entries, roles, and users.</p>}
      </main>
    </div>
  );
}

function OwnerLoginForm({ onSubmit }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <form onSubmit={onSubmit}>
      <label>Email <input name="email" type="email" required /></label>
      <label>Password <input name="password" type="password" required minLength={8} /></label>
      <button type="submit">Login as owner</button>
    </form>
  );
}
