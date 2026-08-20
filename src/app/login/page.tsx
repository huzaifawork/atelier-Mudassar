import type { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in — Atelier Mudassar",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-ink flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <span className="text-copper text-[0.65rem] tracking-[0.4em] uppercase">
            Atelier Mudassar
          </span>
          <h1 className="font-display text-3xl text-porcelain mt-3">
            Gallery Admin
          </h1>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
