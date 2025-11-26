/**
 * Simple in-memory rate limiter for API protection
 * Compatible with Vercel Edge/Serverless
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (resets on cold start, but still provides protection)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
const CLEANUP_INTERVAL = 60000; // 1 minute
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
  limit: number;      // Max requests
  window: number;     // Time window in seconds
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check rate limit for a given identifier
 */
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
    // Create new entry
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

  // Increment existing entry
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

/**
 * Get client identifier from request
 */
export function getClientId(request: Request): string {
  // Try various headers for real IP (Vercel, Cloudflare, etc.)
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfIp = request.headers.get("cf-connecting-ip");

  if (cfIp) return cfIp;
  if (realIp) return realIp;
  if (forwarded) return forwarded.split(",")[0].trim();

  // Fallback to a generic identifier
  return "anonymous";
}

/**
 * Create rate limit error response with proper headers
 */
export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: "Too many requests",
      message: "សូមរង់ចាំមួយភ្លែត មុននឹងព្យាយាមម្តងទៀត", // Please wait before trying again
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

// Preset configurations for different endpoints
export const RATE_LIMITS = {
  // Standard API endpoints
  api: { limit: 60, window: 60 },      // 60 requests per minute
  // Read operations (more lenient)
  read: { limit: 120, window: 60 },    // 120 requests per minute
  // Write operations (stricter)
  write: { limit: 30, window: 60 },    // 30 requests per minute
  // Heavy operations
  heavy: { limit: 10, window: 60 },    // 10 requests per minute
} as const;
