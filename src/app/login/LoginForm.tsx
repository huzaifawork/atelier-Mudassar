"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/** Only ever follow an internal path, so ?next= can't become an open redirect. */
function safeNext(value: string | null): string {
  if (!value) return "/admin/gallery";
  if (!value.startsWith("/") || value.startsWith("//")) return "/admin/gallery";
  return value;
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const field =
    "w-full bg-espresso border border-gold/20 px-3.5 py-3 text-sm text-porcelain " +
    "placeholder:text-cream-dim/35 hover:border-gold/40 transition-colors " +
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-bright";

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.error ?? "Could not sign in.");
        setBusy(false);
        return;
      }

      // Full navigation so the server re-reads the new auth cookie.
      const target = safeNext(searchParams.get("next"));
      router.replace(target);
      router.refresh();
    } catch {
      setError("Could not reach the server.");
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="border border-gold/15 bg-espresso/40 p-6 space-y-4"
    >
      <div>
        <label
          htmlFor="email"
          className="block text-[0.65rem] tracking-[0.25em] uppercase text-copper mb-2"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          required
          className={field}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-[0.65rem] tracking-[0.25em] uppercase text-copper mb-2"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          className={field}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="border border-copper/50 bg-copper/10 px-4 py-3 text-sm text-copper"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full px-6 py-3 text-xs tracking-[0.2em] uppercase bg-gold text-ink hover:bg-gold-bright transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
