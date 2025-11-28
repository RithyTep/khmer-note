interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface SuspiciousActivity {
  count: number;
  firstSeen: number;
  blocked: boolean;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const suspiciousIPs = new Map<string, SuspiciousActivity>();
const CLEANUP_INTERVAL = 60000;
const SUSPICIOUS_THRESHOLD = 100;
const BLOCK_DURATION = 300000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

export interface RateLimitConfig {
  limit: number;
  window: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export function rateLimit(
  identifier: string,
  config: RateLimitConfig = { limit: 60, window: 60 }
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const windowMs = config.window * 1000;
  const key = identifier;

  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      reset: now + windowMs,
    };
  }

  entry.count++;

  if (entry.count > config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      reset: entry.resetTime,
    };
  }

  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    reset: entry.resetTime,
  };
}

export function getClientId(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfIp = request.headers.get("cf-connecting-ip");

  if (cfIp) return cfIp;
  if (realIp) return realIp;
  if (forwarded) return forwarded.split(",")[0].trim();

  return "anonymous";
}

export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: "Too many requests",
      message: "សូមរង់ចាំមួយភ្លែត មុននឹងព្យាយាមម្តងទៀត",
      retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": result.reset.toString(),
        "Retry-After": Math.ceil((result.reset - Date.now()) / 1000).toString(),
      },
    }
  );
}

export const RATE_LIMITS = {
  api: { limit: 60, window: 60 },
  read: { limit: 120, window: 60 },
  write: { limit: 30, window: 60 },
  heavy: { limit: 10, window: 60 },
  ip: { limit: 200, window: 60 },
} as const;

export function ipRateLimit(request: Request): RateLimitResult {
  const ip = getClientId(request);
  const now = Date.now();

  const suspicious = suspiciousIPs.get(ip);
  if (suspicious?.blocked) {
    if (now - suspicious.firstSeen < BLOCK_DURATION) {
      console.warn(`[SECURITY] Blocked IP attempted access: ${ip}`);
      return {
        success: false,
        limit: 0,
        remaining: 0,
        reset: suspicious.firstSeen + BLOCK_DURATION,
      };
    }
    suspiciousIPs.delete(ip);
  }

  const result = rateLimit(`ip:${ip}`, RATE_LIMITS.ip);

  if (!result.success) {
    trackSuspiciousActivity(ip);
  }

  return result;
}

function trackSuspiciousActivity(ip: string): void {
  const now = Date.now();
  const existing = suspiciousIPs.get(ip);

  if (existing) {
    existing.count++;
    if (existing.count >= 5) {
      existing.blocked = true;
      console.warn(`[SECURITY] IP blocked for suspicious activity: ${ip}, hits: ${existing.count}`);
    }
  } else {
    suspiciousIPs.set(ip, {
      count: 1,
      firstSeen: now,
      blocked: false,
    });
    console.warn(`[SECURITY] Suspicious activity detected from IP: ${ip}`);
  }
}

export function checkPayloadSize(body: string, maxBytes: number = 100000): boolean {
  const size = new TextEncoder().encode(body).length;
  if (size > maxBytes) {
    console.warn(`[SECURITY] Payload too large: ${size} bytes (max: ${maxBytes})`);
    return false;
  }
  return true;
}

export function validateOrigin(request: Request, allowedHosts: string[]): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  if (!origin && !referer) {
    return true;
  }

  const checkHost = (url: string): boolean => {
    try {
      const parsed = new URL(url);
      return allowedHosts.some(host =>
        parsed.hostname === host ||
        parsed.hostname.endsWith(`.${host}`)
      );
    } catch {
      return false;
    }
  };

  if (origin && checkHost(origin)) return true;
  if (referer && checkHost(referer)) return true;

  console.warn(`[SECURITY] Invalid origin: ${origin || referer}`);
  return false;
}
