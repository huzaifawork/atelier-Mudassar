import { NextResponse } from "next/server";
import { createServerSupabase, isAdminEmail } from "../../../lib/authServer";
import { clientIp, rateLimit, tooManyRequests } from "../../../lib/rateLimit";

export const dynamic = "force-dynamic";

// Deliberately tight: password guessing is the highest-value attack here.
const PER_IP = { limit: 10, windowMs: 15 * 60_000 };
const PER_ACCOUNT = { limit: 5, windowMs: 15 * 60_000 };

/** One message for every failure mode, so nothing reveals which emails exist. */
const GENERIC_FAILURE = "Incorrect email or password.";

export async function POST(request: Request) {
  const ip = clientIp(request);

  const ipLimit = rateLimit(`login:ip:${ip}`, PER_IP.limit, PER_IP.windowMs);
  if (!ipLimit.ok) return tooManyRequests(ipLimit.retryAfterSeconds);

  let email: string;
  let password: string;
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    email = (body.email ?? "").trim();
    password = body.password ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: GENERIC_FAILURE }, { status: 401 });
  }

  const accountLimit = rateLimit(
    `login:account:${email.toLowerCase()}`,
    PER_ACCOUNT.limit,
    PER_ACCOUNT.windowMs,
  );
  if (!accountLimit.ok) return tooManyRequests(accountLimit.retryAfterSeconds);

  const supabase = await createServerSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Authentication is not configured" },
      { status: 503 },
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return NextResponse.json({ error: GENERIC_FAILURE }, { status: 401 });
  }

  // Valid credentials are not enough — the account must also be allowlisted.
  // Sign the session straight back out so a non-admin never holds one.
  if (!isAdminEmail(data.user.email)) {
    await supabase.auth.signOut();
    return NextResponse.json({ error: GENERIC_FAILURE }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
