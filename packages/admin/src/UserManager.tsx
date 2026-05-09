import { FormEvent, useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { createUser, listRoles, listUsers } from "./api";
import { StateMessage } from "./components/StateMessage";
import { StatusToast } from "./components/StatusToast";
import type { RoleRecord } from "./role.type";
import type { UserRecord } from "./user.type";

export function UserManager() {
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [status, setStatus] = useState("User manager loading");

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    const roleResult = await listRoles();
    const userResult = await listUsers();
    if (!roleResult.ok || !userResult.ok) {
      setStatus(roleResult.error ?? userResult.error ?? "Users failed");
      return;
    }
    setRoles(roleResult.roles ?? []);
    setUsers(userResult.users ?? []);
    setStatus((roleResult.roles ?? []).length ? "Users ready" : "Create an API role first");
  }

  async function submitUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const result = await createUser({
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
    setStatus(`Created user: ${result.user?.email ?? "user"}`);
  }

  return (
    <section aria-labelledby="user-manager-title">
      <h2 id="user-manager-title">Users</h2>
      <p>English: Create content API users and assign exactly one API role.</p>
      <p>Hinglish: Content API users banao aur exactly ek API role assign karo.</p>
      <div className="user-create-bar">
        <button disabled={roles.length === 0} type="button" onClick={() => setCreateOpen(true)}>
          <Plus aria-hidden="true" size={16} />
          Create user
        </button>
        {roles.length === 0 ? <span className="helper-text">Create an API role before adding users.</span> : null}
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
            <label htmlFor="user-role">API role</label>
            <select disabled={roles.length === 0} id="user-role" name="roleId" required>
              <option value="">Select API role</option>
              {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
            </select>
          </div>
          <p className="helper-text" id="user-form-help">
            Passwords are submitted once and never displayed in the user list.
          </p>
          <div className="user-form-actions">
            <button disabled={roles.length === 0} type="submit">
              <Plus aria-hidden="true" size={16} />
              Create user
            </button>
            <button type="button" onClick={() => setCreateOpen(false)}>
              <X aria-hidden="true" size={16} />
              Cancel
            </button>
          </div>
        </form>
      ) : null}
      <UserList users={users} />
      <StatusToast title="User status">{status}</StatusToast>
    </section>
  );
}

function UserList({ users }: { users: UserRecord[] }) {
  return (
    <section className="user-list" aria-labelledby="user-list-title">
      <h3 id="user-list-title">User list</h3>
      {users.length === 0 ? (
        <StateMessage title="No users yet" variant="empty">
          Create a user after at least one API role is available.
        </StateMessage>
      ) : users.map((user) => (
        <article className="user-row" key={user.id}>
          <div>
            <strong>{user.email}</strong>
            <span>API role: {user.roleName}</span>
          </div>
          <code>x-apiagex-role-id: {user.roleId}</code>
          <p>Created/updated timestamps are not exposed by the current user API.</p>
        </article>
      ))}
    </section>
  );
}
