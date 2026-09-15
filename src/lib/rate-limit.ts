// Simple in-memory sliding-window rate limiter.
//
// Scope: this guards against password brute-forcing on a single app instance.
// State lives in process memory, so it resets on restart and is NOT shared across
// multiple instances — for a horizontally-scaled deployment, back this with Redis
// (or similar). For a single Next.js server it meaningfully slows credential stuffing.

type Hit = { count: number; resetAt: number };

const buckets = new Map<string, Hit>();

// Opportunistic cleanup so the Map doesn't grow unbounded.
function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, hit] of buckets) {
    if (hit.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

/**
 * Record an attempt for `key` and report whether it is allowed.
 * @param key    Identifier to throttle on (e.g. `login:<ip>:<email>`).
 * @param limit  Max attempts permitted within the window.
 * @param windowMs Window length in milliseconds.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const hit = buckets.get(key);
  if (!hit || hit.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (hit.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterSeconds: Math.ceil((hit.resetAt - now) / 1000) };
  }

  hit.count += 1;
  return { allowed: true, remaining: limit - hit.count, retryAfterSeconds: 0 };
}

/** Clear the counter for a key (e.g. after a successful login). */
export function resetRateLimit(key: string) {
  buckets.delete(key);
}

/** Best-effort client IP from proxy headers, falling back to a constant. */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
