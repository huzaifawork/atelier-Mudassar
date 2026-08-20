import "server-only";
import { NextResponse } from "next/server";
import { getAdminUser } from "./authServer";
import { clientIp, rateLimit, tooManyRequests } from "./rateLimit";

/**
 * Gate for every privileged gallery route.
 *
 * This is the actual security boundary — not the proxy. Proxy runs before
 * rendering and can be deployed to a CDN, and Next has historically had
 * middleware-bypass issues, so each route re-checks identity itself rather
 * than trusting that something upstream already did.
 *
 * Returns a Response to send back on failure, or null to continue.
 */
export async function guardAdmin(
  request: Request,
  options: { limit?: number; windowMs?: number } = {},
): Promise<Response | null> {
  const { limit = 60, windowMs = 60_000 } = options;

  // Loose, IP-keyed pre-auth guard: just enough to stop an unauthenticated
  // flood from hammering Supabase's auth endpoint on every request. Kept
  // deliberately generous — X-Forwarded-For is client-suppliable on most
  // deployments, so a tight limit here would let an attacker who spoofs the
  // real admin's IP lock them out before identity is even checked.
  const ipLimited = rateLimit(`admin-ip:${clientIp(request)}`, 300, windowMs);
  if (!ipLimited.ok) return tooManyRequests(ipLimited.retryAfterSeconds);

  const user = await getAdminUser();
  if (!user) {
    // Same response whether the session is missing, expired, or belongs to a
    // non-admin — nothing here hints at which accounts exist.
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }

  // The meaningful limit: per authenticated identity, so it can't be spent by
  // spoofing an IP address.
  const limited = rateLimit(`admin:${user.id}`, limit, windowMs);
  if (!limited.ok) return tooManyRequests(limited.retryAfterSeconds);

  return null;
}
