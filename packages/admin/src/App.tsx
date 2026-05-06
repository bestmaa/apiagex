import { FormEvent, useEffect, useState } from "react";
import { authenticateOwner } from "./api";
import { ApiList } from "./ApiList";
import { DashboardPage } from "./DashboardPage";
import { EntryManager } from "./EntryManager";
import { RoleManager } from "./RoleManager";
import { SchemaBuilder } from "./SchemaBuilder";
import { UserManager } from "./UserManager";
import type { OwnerSession } from "./session.type";
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

const relationSchemaExamples = [
  {
    title: "Author to Articles",
    payload: {
      name: "Author",
      slug: "author",
      fields: [
        { name: "Name", slug: "name", type: "text", required: true },
        {
          name: "Articles",
          slug: "articles",
          type: "relation",
          relationSchemaId: "ARTICLE_SCHEMA_ID",
          relationType: "oneToMany",
        },
      ],
    },
  },
  {
    title: "Article to Category",
    payload: {
      name: "Article",
      slug: "article",
      fields: [
        { name: "Title", slug: "title", type: "text", required: true },
        {
          name: "Category",
          slug: "category",
          type: "relation",
          relationSchemaId: "CATEGORY_SCHEMA_ID",
          relationType: "manyToOne",
          required: true,
        },
      ],
    },
  },
  {
    title: "Article to Tags",
    payload: {
      name: "Article",
      slug: "article",
      fields: [
        { name: "Title", slug: "title", type: "text", required: true },
        {
          name: "Tags",
          slug: "tags",
          type: "relation",
          relationSchemaId: "TAG_SCHEMA_ID",
          relationType: "manyToMany",
        },
      ],
    },
  },
  {
    title: "User Profile to User",
    payload: {
      name: "User Profile",
      slug: "user-profile",
      fields: [
        { name: "Bio", slug: "bio", type: "longText" },
        {
          name: "User",
          slug: "user",
          type: "relation",
          relationSchemaId: "USER_SCHEMA_ID",
          relationType: "oneToOne",
          required: true,
        },
      ],
    },
  },
];

export function App() {
  const [session, setSession] = useState<OwnerSession | null>(null);
  const [route, setRoute] = useState<AdminRoute>(readRoute());
  const [status, setStatus] = useState("No owner session");

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
        {session ? <button onClick={logout}>Logout</button> : null}
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

function DocsPage() {
  const [copied, setCopied] = useState("");

  async function copyExample(title: string, payload: unknown) {
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(title);
  }

  return (
    <section>
      <h2>Docs</h2>
      <p>English: Product docs and readable project summary are served by the same API server.</p>
      <p>Hinglish: Product docs aur readable project summary same API server se serve hote hain.</p>
      <div className="action-row">
        <a href="/doc">Open Docs</a>
        <a href="/readme">Open Readme</a>
      </div>
      <h3>Relation Schema Examples</h3>
      {relationSchemaExamples.map((example) => (
        <article className="api-row" key={example.title}>
          <strong>{example.title}</strong>
          <pre><code>{JSON.stringify(example.payload, null, 2)}</code></pre>
          <button type="button" onClick={() => void copyExample(example.title, example.payload)}>
            Copy JSON
          </button>
        </article>
      ))}
      {copied ? <p className="status-line">Copied: {copied}</p> : null}
    </section>
  );
}

function SessionPanel({
  onReset,
  session,
  status,
  onSubmit,
}: {
  onReset: () => void;
  session: OwnerSession | null;
  status: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section aria-labelledby="owner-login-title">
      <h2 id="owner-login-title">Owner Setup / Login</h2>
      <p>English: First submit creates the owner when none exists; later submits log in.</p>
      <p>Hinglish: Pehla submit owner banata hai jab owner nahi hai; baad me login karta hai.</p>
      {!session ? <OwnerLoginForm onSubmit={onSubmit} /> : (
        <div className="api-row">
          <strong>{session.email}</strong>
          <span>Local owner session is active.</span>
          <button type="button" onClick={onReset}>Reset session</button>
        </div>
      )}
      <p className="status-line" id="owner-session-status">{status}</p>
    </section>
  );
}

function OwnerLoginForm({ onSubmit }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <form onSubmit={onSubmit}>
      <label>Email <input name="email" type="email" required /></label>
      <label>Password <input name="password" type="password" required minLength={8} /></label>
      <button type="submit">Setup or login owner</button>
    </form>
  );
}
