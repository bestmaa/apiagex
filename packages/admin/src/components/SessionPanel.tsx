import type { FormEvent } from "react";
import type { OwnerSession } from "../session.type";
import { StatusToast } from "./StatusToast";

export function SessionPanel({
  mode,
  onReset,
  session,
  status,
  onSubmit,
}: {
  mode: "checking" | "login" | "setup";
  onReset: () => void;
  session: OwnerSession | null;
  status: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const title = session ? "Owner Session" : mode === "setup" ? "Owner Setup" : mode === "login" ? "Owner Login" : "Owner Access";
  return (
    <section aria-labelledby="owner-login-title">
      <h2 id="owner-login-title">{title}</h2>
      {!session ? <p>{mode === "setup" ? "No owner exists yet. Create the first owner account." : mode === "login" ? "Owner already exists. Login with the owner account." : "Checking owner setup status."}</p> : null}
      {!session ? <OwnerLoginForm mode={mode} onSubmit={onSubmit} /> : (
        <div className="api-row">
          <strong>{session.email}</strong>
          <span>Local owner session is active.</span>
          <button type="button" onClick={onReset}>Reset session</button>
        </div>
      )}
      <StatusToast title="Owner session status">{status}</StatusToast>
    </section>
  );
}

function OwnerLoginForm({
  mode,
  onSubmit,
}: {
  mode: "checking" | "login" | "setup";
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit}>
      <label>Email <input name="email" type="email" required /></label>
      <label>Password <input name="password" type="password" required minLength={8} /></label>
      <button disabled={mode === "checking"} type="submit">{mode === "setup" ? "Create owner" : "Login owner"}</button>
    </form>
  );
}
