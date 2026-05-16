import { FormEvent, useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { createControlUser, createUser, listControlUsers, listUsers } from "./api";
import { StateMessage } from "./components/StateMessage";
import { StatusToast } from "./components/StatusToast";
import type { RoleRecord } from "./role.type";
import type { UserRecord } from "./user.type";

type UserMode = "admin" | "content";

export function UserManager() {
  const [mode, setMode] = useState<UserMode>("content");
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [status, setStatus] = useState("User manager loading");

  useEffect(() => {
    void loadData();
  }, [mode]);

  async function loadData() {
    const userResult = mode === "content" ? await listUsers() : await listControlUsers();
    if (!userResult.ok) {
      setStatus(userResult.error ?? "Users failed");
      return;
    }
    setRoles((userResult.roles ?? []) as RoleRecord[]);
    setUsers(userResult.users ?? []);
    setCreateOpen(false);
    setStatus((userResult.roles ?? []).length ? `${modeLabel(mode)} users ready` : `Create a ${mode === "content" ? "content API" : "control admin"} role first`);
  }

  async function submitUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const result = mode === "content" ? await createUser({
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
      roleId: String(data.get("roleId") ?? ""),
    }) : await createControlUser({
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
      roleId: String(data.get("roleId") ?? ""),
    });
    if (!result.ok) {
      setStatus(result.error ?? "User create failed");
      return;
    }
    form.reset();
    await loadData();
    setCreateOpen(false);
    setStatus(`Created ${modeLabel(mode).toLowerCase()} user: ${result.user?.email ?? "user"}`);
  }

  return (
    <section aria-labelledby="user-manager-title">
      <h2 id="user-manager-title">Users</h2>
      <p>Create content API users or control admin users and assign exactly one role.</p>
      <div className="segmented-control" aria-label="User type">
        <button className={mode === "content" ? "is-active" : ""} type="button" onClick={() => setMode("content")}>
          Content users
        </button>
        <button className={mode === "admin" ? "is-active" : ""} type="button" onClick={() => setMode("admin")}>
          Control admin users
        </button>
      </div>
      <div className="user-create-bar">
        <button disabled={roles.length === 0} type="button" onClick={() => setCreateOpen(true)}>
          <Plus aria-hidden="true" size={16} />
          Create {modeLabel(mode)} user
        </button>
        {roles.length === 0 ? <span className="helper-text">Create a {mode === "content" ? "content API" : "control admin"} role before adding users.</span> : null}
      </div>
      {createOpen ? (
        <form className="user-form" aria-describedby="user-form-help" onSubmit={submitUser}>
          <div>
            <label htmlFor="user-email">User email</label>
            <input autoComplete="email" id="user-email" name="email" placeholder="editor@example.com" required type="email" />
          </div>
          <div>
            <label htmlFor="user-password">Temporary password</label>
            <input
              autoComplete="new-password"
              id="user-password"
              minLength={8}
              name="password"
              placeholder="Minimum 8 characters"
              required
              type="password"
            />
          </div>
          <div>
            <label htmlFor="user-role">{mode === "content" ? "API role" : "Admin role"}</label>
            <select disabled={roles.length === 0} id="user-role" name="roleId" required>
              <option value="">Select {mode === "content" ? "API" : "admin"} role</option>
              {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
            </select>
          </div>
          <p className="helper-text" id="user-form-help">
            Passwords are submitted once and never displayed in the user list.
          </p>
          <div className="user-form-actions">
            <button disabled={roles.length === 0} type="submit">
              <Plus aria-hidden="true" size={16} />
              Create {modeLabel(mode)} user
            </button>
            <button type="button" onClick={() => setCreateOpen(false)}>
              <X aria-hidden="true" size={16} />
              Cancel
            </button>
          </div>
        </form>
      ) : null}
      <UserList mode={mode} users={users} />
      <StatusToast title="User status">{status}</StatusToast>
    </section>
  );
}

function UserList({ mode, users }: { mode: UserMode; users: UserRecord[] }) {
  return (
    <section className="user-list" aria-labelledby="user-list-title">
      <h3 id="user-list-title">{modeLabel(mode)} user list</h3>
      {users.length === 0 ? (
        <StateMessage title="No users yet" variant="empty">
          Create a {modeLabel(mode).toLowerCase()} user after at least one role is available.
        </StateMessage>
      ) : users.map((user) => (
        <article className="user-row" key={user.id}>
          <div>
            <strong>{user.email}</strong>
            <span>{mode === "content" ? "API" : "Admin"} role: {user.roleName}</span>
          </div>
          {mode === "content" ? <code>x-apiagex-role-id: {user.roleId}</code> : <code>control role: {user.roleName}</code>}
          <p>{mode === "content" ? "Use this user for generated content API login flows." : "Use this user for future Admin UI control-plane login flows."}</p>
        </article>
      ))}
    </section>
  );
}

function modeLabel(mode: UserMode): string {
  return mode === "content" ? "Content" : "Control admin";
}
