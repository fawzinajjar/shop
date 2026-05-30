"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { registerAction, type FormState } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary" type="submit" disabled={pending}>
      {pending ? "Creating account…" : "Create account"}
    </button>
  );
}

export default function RegisterPage() {
  const [state, action] = useFormState<FormState, FormData>(
    registerAction,
    undefined
  );
  const [role, setRole] = useState<"BUYER" | "SELLER">("BUYER");

  return (
    <main className="container" style={{ maxWidth: 460 }}>
      <h1 style={{ fontFamily: "var(--display-font)", color: "var(--brand)" }}>
        Create your account
      </h1>
      <form action={action} className="auth-form">
        <div className="role-toggle">
          <label className={role === "BUYER" ? "active" : ""}>
            <input
              type="radio"
              name="role"
              value="BUYER"
              checked={role === "BUYER"}
              onChange={() => setRole("BUYER")}
            />
            Buyer — shop products
          </label>
          <label className={role === "SELLER" ? "active" : ""}>
            <input
              type="radio"
              name="role"
              value="SELLER"
              checked={role === "SELLER"}
              onChange={() => setRole("SELLER")}
            />
            Seller — list products
          </label>
        </div>

        <label>
          Name
          <input type="text" name="name" required autoComplete="name" />
        </label>
        {role === "SELLER" && (
          <label>
            Store name
            <input type="text" name="storeName" placeholder="e.g. Green Goods Co." />
          </label>
        )}
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
            minLength={6}
            autoComplete="new-password"
          />
        </label>
        {state?.error && <p className="form-error">{state.error}</p>}
        <SubmitButton />
      </form>
      <p className="muted" style={{ marginTop: 16 }}>
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </main>
  );
}
