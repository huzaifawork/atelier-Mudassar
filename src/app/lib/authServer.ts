import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Request-scoped Supabase client backed by the auth cookies.
 *
 * Uses the anon key on purpose — this client acts *as the signed-in user*, so
 * RLS still applies. It is only used to establish identity; privileged writes
 * happen through the service client after the identity check passes.
 */
export async function createServerSupabase() {
  if (!url || !anonKey) return null;
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    // The default from @supabase/ssr is httpOnly: false — fine for SPAs that
    // read the session client-side, wrong here: this app never runs a
    // browser-side Supabase client, so there is no legitimate reason for the
    // access/refresh token pair to be reachable from document.cookie. Keeping
    // it JS-readable would turn any future XSS into a stealable long-lived
    // admin session. Must match the options used in proxy.ts exactly, or the
    // two will write cookies the other can't read.
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components can't set cookies. Token refresh still happens
          // in the proxy, which can, so this is safe to swallow.
        }
      },
    },
  });
}

/**
 * The signed-in user, or null.
 *
 * Deliberately `getUser()` and not `getSession()`: getSession trusts whatever
 * is in the cookie, while getUser revalidates the JWT against Supabase. Only
 * the latter is safe to make authorization decisions on.
 */
export async function getSessionUser(): Promise<User | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}

/**
 * Allowlist check. Having a Supabase account is NOT the same as being an
 * admin — without this, anyone who managed to sign up would reach the admin.
 * Fails closed: an unset/empty ADMIN_EMAILS admits nobody.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  if (allowed.length === 0) return false;
  if (!email) return false;
  return allowed.includes(email.toLowerCase());
}

/** The signed-in user if they are also an allowlisted admin, else null. */
export async function getAdminUser(): Promise<User | null> {
  const user = await getSessionUser();
  if (!user || !isAdminEmail(user.email)) return null;
  return user;
}
