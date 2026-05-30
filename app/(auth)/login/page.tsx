"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { loginAction, type FormState } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary" type="submit" disabled={pending}>
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export default function LoginPage() {
  const [state, action] = useFormState<FormState, FormData>(loginAction, undefined);
  return (
    <main className="container" style={{ maxWidth: 420 }}>
      <h1 style={{ fontFamily: "var(--display-font)", color: "var(--brand)" }}>
        Sign in
      </h1>
      <form action={action} className="auth-form">
        <label>
          Email
          <input type="email" name="email" required autoComplete="email" />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
          />
        </label>
        {state?.error && <p className="form-error">{state.error}</p>}
        <SubmitButton />
      </form>
      <p className="muted" style={{ marginTop: 16 }}>
        No account? <Link href="/register">Create one</Link>
      </p>
    </main>
  );
}
