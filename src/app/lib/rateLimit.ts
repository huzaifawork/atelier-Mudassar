import "server-only";

/**
 * Fixed-window rate limiter held in process memory.
 *
 * Caveat worth knowing: on serverless (Vercel) each instance keeps its own
 * counters, so the effective limit is per-instance rather than global. That
 * makes this a speed bump for scripted abuse, not a hard guarantee. The
 * critical path — password guessing — is additionally rate limited by Supabase
 * Auth itself, server-side and globally. Swap in Upstash Redis here if a
 * strict global limit is ever needed.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

// Keep the map from growing without bound on a long-lived instance.
const MAX_TRACKED_KEYS = 10_000;

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    if (buckets.size >= MAX_TRACKED_KEYS) {
      for (const [entryKey, entry] of buckets) {
        if (now >= entry.resetAt) buckets.delete(entryKey);
      }
      if (buckets.size >= MAX_TRACKED_KEYS) buckets.clear();
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return {
    ok: true,
    remaining: limit - existing.count,
    retryAfterSeconds: 0,
  };
}

/** Best-effort client address; falls back to a constant behind unknown proxies. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function tooManyRequests(retryAfterSeconds: number): Response {
  return new Response(
    JSON.stringify({ error: "Too many requests. Try again shortly." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSeconds),
      },
    },
  );
}
