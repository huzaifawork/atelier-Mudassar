"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      onClick={signOut}
      disabled={busy}
      className="px-3 py-1.5 text-[0.62rem] tracking-[0.18em] uppercase border border-gold/25 text-cream-dim hover:border-copper hover:text-copper transition-colors disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-bright"
    >
      {busy ? "…" : "Sign out"}
    </button>
  );
}
