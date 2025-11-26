import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Security Middleware for DDoS and Spam Protection
 * - Global rate limiting per IP
 * - Bot/crawler detection
 * - Request validation
 * - Suspicious pattern detection
 */

// In-memory stores (reset on cold start, but still effective)
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();
const ipBlockList = new Map<string, number>(); // IP -> block until timestamp
const suspiciousIPs = new Map<string, number>(); // IP -> violation count

// Configuration
const CONFIG = {
  // Global rate limit (applies to all requests)
  globalLimit: 100,        // requests per window
  globalWindow: 60 * 1000, // 1 minute in ms

  // Burst protection (short window)
  burstLimit: 20,          // requests per burst window
  burstWindow: 5 * 1000,   // 5 seconds

  // Block duration for violators
  blockDuration: 5 * 60 * 1000, // 5 minutes

  // Suspicious behavior threshold
  suspiciousThreshold: 3,  // violations before blocking

  // Max request body size (prevent large payload attacks)
  maxBodySize: 1024 * 100, // 100KB
};

// Suspicious patterns in user agents
const BLOCKED_USER_AGENTS = [
  /curl/i,
  /wget/i,
  /python-requests/i,
  /scrapy/i,
  /httpclient/i,
  /java\//i,
  /libwww/i,
  /lwp-trivial/i,
  /nikto/i,
  /sqlmap/i,
  /nmap/i,
  /masscan/i,
  /zgrab/i,
];

// Allowed paths that bypass some checks (like static assets)
const BYPASS_PATHS = [
  "/_next",
  "/favicon.ico",
  "/robots.txt",
];

function getClientIP(request: NextRequest): string {
  // Check various headers for real IP
  const cfIP = request.headers.get("cf-connecting-ip");
  const realIP = request.headers.get("x-real-ip");
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (cfIP) return cfIP;
  if (realIP) return realIP;
  if (forwardedFor) return forwardedFor.split(",")[0].trim();

  return "unknown";
}

function isBlockedUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return BLOCKED_USER_AGENTS.some(pattern => pattern.test(userAgent));
}

function checkGlobalRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = ipRequestCounts.get(ip);

  if (!entry || entry.resetTime < now) {
    ipRequestCounts.set(ip, { count: 1, resetTime: now + CONFIG.globalWindow });
    return { allowed: true, remaining: CONFIG.globalLimit - 1 };
  }

  entry.count++;

  if (entry.count > CONFIG.globalLimit) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: CONFIG.globalLimit - entry.count };
}

function isIPBlocked(ip: string): boolean {
  const blockUntil = ipBlockList.get(ip);
  if (!blockUntil) return false;

  if (Date.now() > blockUntil) {
    ipBlockList.delete(ip);
    return false;
  }

  return true;
}

function markSuspicious(ip: string): boolean {
  const violations = (suspiciousIPs.get(ip) || 0) + 1;
  suspiciousIPs.set(ip, violations);

  if (violations >= CONFIG.suspiciousThreshold) {
    // Block this IP
    ipBlockList.set(ip, Date.now() + CONFIG.blockDuration);
    suspiciousIPs.delete(ip);
    return true; // IP is now blocked
  }

  return false;
}

function createBlockedResponse(reason: string, retryAfter?: number): NextResponse {
  const response = NextResponse.json(
    {
      error: "Access Denied",
      message: "សូមអភ័យទោស ការចូលប្រើត្រូវបានបដិសេធ", // Sorry, access denied
      reason,
    },
    { status: 403 }
  );

  if (retryAfter) {
    response.headers.set("Retry-After", retryAfter.toString());
  }

  return response;
}

function createRateLimitResponse(remaining: number, resetTime: number): NextResponse {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

  return NextResponse.json(
    {
      error: "Too Many Requests",
      message: "សូមរង់ចាំមួយភ្លែត មុននឹងព្យាយាមម្តងទៀត", // Please wait before trying again
      retryAfter,
    },
    {
      status: 429,
      headers: {
        "Retry-After": retryAfter.toString(),
        "X-RateLimit-Limit": CONFIG.globalLimit.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": resetTime.toString(),
      },
    }
  );
}

// Cleanup old entries periodically
let lastCleanup = Date.now();
function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < 60000) return; // Clean every minute

  lastCleanup = now;

  // Clean expired rate limit entries
  for (const [ip, entry] of ipRequestCounts.entries()) {
    if (entry.resetTime < now) {
      ipRequestCounts.delete(ip);
    }
  }

  // Clean expired blocks
  for (const [ip, blockUntil] of ipBlockList.entries()) {
    if (blockUntil < now) {
      ipBlockList.delete(ip);
    }
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets and internal paths
  if (BYPASS_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Run cleanup
  cleanup();

  const ip = getClientIP(request);
  const userAgent = request.headers.get("user-agent");

  // 1. Check if IP is blocked
  if (isIPBlocked(ip)) {
    const blockUntil = ipBlockList.get(ip) || Date.now();
    const retryAfter = Math.ceil((blockUntil - Date.now()) / 1000);
    return createBlockedResponse("IP temporarily blocked", retryAfter);
  }

  // 2. Check for blocked user agents (only for API routes)
  if (pathname.startsWith("/api/") && isBlockedUserAgent(userAgent)) {
    markSuspicious(ip);
    return createBlockedResponse("Automated requests not allowed");
  }

  // 3. Check for missing or empty user agent on API routes
  if (pathname.startsWith("/api/") && (!userAgent || userAgent.length < 10)) {
    markSuspicious(ip);
    return createBlockedResponse("Invalid request");
  }

  // 4. Global rate limiting
  const rateCheck = checkGlobalRateLimit(ip);
  if (!rateCheck.allowed) {
    const wasBlocked = markSuspicious(ip);
    const entry = ipRequestCounts.get(ip);
    return createRateLimitResponse(0, entry?.resetTime || Date.now() + CONFIG.globalWindow);
  }

  // 5. Check request method validity for API routes
  if (pathname.startsWith("/api/")) {
    const method = request.method.toUpperCase();
    const validMethods = ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS", "HEAD"];

    if (!validMethods.includes(method)) {
      markSuspicious(ip);
      return createBlockedResponse("Invalid request method");
    }
  }

  // 6. Add security headers to response
  const response = NextResponse.next();

  // Security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  // Rate limit info headers
  response.headers.set("X-RateLimit-Limit", CONFIG.globalLimit.toString());
  response.headers.set("X-RateLimit-Remaining", rateCheck.remaining.toString());

  return response;
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
