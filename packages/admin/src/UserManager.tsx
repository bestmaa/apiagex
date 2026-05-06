import { FormEvent, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { createUser, listRoles, listUsers } from "./api";
import type { RoleRecord } from "./role.type";
import type { UserRecord } from "./user.type";

export function UserManager() {
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
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
    setStatus((roleResult.roles ?? []).length ? "Users ready" : "Create a role first");
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
    setStatus(`Created user: ${result.user?.email ?? "user"}`);
  }

  return (
    <section aria-labelledby="user-manager-title">
      <h2 id="user-manager-title">Users</h2>
      <p>English: Create users and assign exactly one role for MVP access checks.</p>
      <p>Hinglish: Users banao aur MVP access checks ke liye exactly ek role assign karo.</p>
      <form onSubmit={submitUser}>
        <label>User email <input name="email" required type="email" /></label>
        <label>User password <input name="password" required minLength={8} type="password" /></label>
        <label>User role
          <select name="roleId" required>
            <option value="">Select role</option>
            {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
          </select>
        </label>
        <button disabled={roles.length === 0} type="submit">
          <Plus aria-hidden="true" size={16} />
          Create user
        </button>
      </form>
      <p className="status-line">{status}</p>
      <UserList users={users} />
    </section>
  );
}

function UserList({ users }: { users: UserRecord[] }) {
  return (
    <div>
      <h3>Created Users</h3>
      {users.length === 0 ? <p className="empty-state">No users yet</p> : users.map((user) => (
        <article className="api-row" key={user.id}>
          <strong>{user.email}</strong>
          <span>Role: {user.roleName}</span>
          <code>x-apiagex-role-id: {user.roleId}</code>
        </article>
      ))}
    </div>
  );
}
