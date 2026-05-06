import type { FormEvent } from "react";
import type { OwnerSession } from "../session.type";
import { StatusToast } from "./StatusToast";

export function SessionPanel({
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
      <StatusToast title="Owner session status">{status}</StatusToast>
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
