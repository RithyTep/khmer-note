import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { API_HEADERS } from "@/lib/constants";

const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();
const ipBlockList = new Map<string, number>();
const suspiciousIPs = new Map<string, number>();

const CONFIG = {
  globalLimit: 100,
  globalWindow: 60 * 1000,
  burstLimit: 20,
  burstWindow: 5 * 1000,
  blockDuration: 5 * 60 * 1000,
  suspiciousThreshold: 3,
  maxBodySize: 1024 * 100,
};

// Content Security Policy directives
const CSP_DIRECTIVES = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://accounts.google.com"],
  "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  "img-src": ["'self'", "data:", "blob:", "https:", "*.googleusercontent.com"],
  "font-src": ["'self'", "https://fonts.gstatic.com"],
  "connect-src": ["'self'", "https://accounts.google.com"],
  "frame-src": ["'self'", "https://accounts.google.com"],
  "frame-ancestors": ["'none'"],
  "form-action": ["'self'"],
  "base-uri": ["'self'"],
  "object-src": ["'none'"],
  "upgrade-insecure-requests": [],
};

function buildCSP(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, values]) => {
      if (values.length === 0) return directive;
      return `${directive} ${values.join(" ")}`;
    })
    .join("; ");
}

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

const BYPASS_PATHS = [
  "/_next",
  "/favicon.ico",
  "/robots.txt",
];

function getClientIP(request: NextRequest): string {
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
    ipBlockList.set(ip, Date.now() + CONFIG.blockDuration);
    suspiciousIPs.delete(ip);
    return true;
  }

  return false;
}

function createBlockedResponse(reason: string, retryAfter?: number): NextResponse {
  // Generate a fake request ID for the "security checkpoint" look
  const requestId = `sin1::${Date.now().toString(36)}-${Math.random().toString(36).substring(2)}`;
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Checkpoint</title>
    <style>
        body {
            background-color: #000;
            color: #fff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
        }
        .spinner {
            width: 40px;
            height: 40px;
            border: 2px solid #333;
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 0.8s linear infinite;
            margin-bottom: 24px;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        h1 {
            font-size: 20px;
            font-weight: 500;
            margin: 0 0 16px 0;
            letter-spacing: -0.02em;
        }
        .footer {
            position: absolute;
            bottom: 32px;
            color: #444;
            font-family: monospace;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="spinner"></div>
    <h1>${reason}</h1>
    <div class="footer">
        Vercel Security Checkpoint | ${requestId}
    </div>
</body>
</html>`;

  const response = new NextResponse(html, {
    status: 403,
    headers: {
      "Content-Type": "text/html",
    },
  });

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
      message: "សូមរង់ចាំមួយភ្លែត មុននឹងព្យាយាមម្តងទៀត",
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

let lastCleanup = Date.now();
function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < 60000) return;

  lastCleanup = now;

  for (const [ip, entry] of ipRequestCounts.entries()) {
    if (entry.resetTime < now) {
      ipRequestCounts.delete(ip);
    }
  }

  for (const [ip, blockUntil] of ipBlockList.entries()) {
    if (blockUntil < now) {
      ipBlockList.delete(ip);
    }
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (BYPASS_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  cleanup();

  const ip = getClientIP(request);
  const userAgent = request.headers.get("user-agent");

  // Only block API requests for suspicious IPs
  // This allows the user to load the UI and potentially fix their session (e.g. get a new cookie)
  if (pathname.startsWith("/api/") && isIPBlocked(ip)) {
    const blockUntil = ipBlockList.get(ip) || Date.now();
    const retryAfter = Math.ceil((blockUntil - Date.now()) / 1000);
    return createBlockedResponse("IP temporarily blocked due to suspicious activity", retryAfter);
  }

  if (pathname.startsWith("/api/") && isBlockedUserAgent(userAgent)) {
    markSuspicious(ip);
    return createBlockedResponse("Automated requests not allowed");
  }

  if (pathname.startsWith("/api/") && (!userAgent || userAgent.length < 10)) {
    markSuspicious(ip);
    return createBlockedResponse("Invalid request");
  }

  // Challenge: Verify Client Headers & Origin
  // Exclude /api/auth from strict checks as NextAuth handles its own security
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth")) {
    const clientKey = request.headers.get(API_HEADERS.CLIENT_KEY);
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const host = request.headers.get("host");

    // 1. Check Custom Header
    if (clientKey !== API_HEADERS.CLIENT_VALUE) {
      markSuspicious(ip);
      return createBlockedResponse("Unauthorized Client: Missing or invalid client key");
    }

    // 2. Check Origin/Referer (Basic protection against direct curl/postman)
    // Note: This might block server-side calls if they don't set these headers.
    // Ensure your server-side fetches (if any) include the client key.
    if (!origin && !referer) {
      markSuspicious(ip);
      return createBlockedResponse("Unauthorized Client: Missing origin or referer");
    }

    if (host && referer && !referer.includes(host)) {
       markSuspicious(ip);
       return createBlockedResponse("Unauthorized Client: Invalid referer");
    }

    // 3. Check Sec-Fetch-* Headers (Browser-only headers)
    // These headers are "forbidden headers" and cannot be set by JavaScript,
    // making them a strong indicator of a real browser.
    const secFetchSite = request.headers.get("sec-fetch-site");
    const secFetchMode = request.headers.get("sec-fetch-mode");

    // If headers are present, validate them
    if (secFetchSite && !["same-origin", "same-site", "none"].includes(secFetchSite)) {
      markSuspicious(ip);
      return createBlockedResponse("Unauthorized Client: Invalid fetch site");
    }

    if (secFetchMode && !["cors", "navigate", "same-origin", "no-cors"].includes(secFetchMode)) {
      markSuspicious(ip);
      return createBlockedResponse("Unauthorized Client: Invalid fetch mode");
    }

    // 4. Check Client Cookie (JS Challenge)
    // This requires the client to have executed JS to set the cookie.
    // The token is time-based and expires quickly (10s window), preventing replay attacks.
    const clientToken = request.cookies.get("kn-client-token");
    
    if (!clientToken) {
      markSuspicious(ip);
      return createBlockedResponse("Enable JavaScript to continue");
    }

    try {
      const timestamp = parseInt(atob(clientToken.value), 10);
      const now = Date.now();
      
      // Allow 10 seconds drift/delay
      if (isNaN(timestamp) || now - timestamp > 10000 || now - timestamp < -5000) {
        markSuspicious(ip);
        return createBlockedResponse("Enable JavaScript to continue");
      }
    } catch {
      markSuspicious(ip);
      return createBlockedResponse("Enable JavaScript to continue");
    }
  }

  const rateCheck = checkGlobalRateLimit(ip);
  if (!rateCheck.allowed) {
    markSuspicious(ip);
    const entry = ipRequestCounts.get(ip);
    return createRateLimitResponse(0, entry?.resetTime || Date.now() + CONFIG.globalWindow);
  }

  if (pathname.startsWith("/api/")) {
    const method = request.method.toUpperCase();
    const validMethods = ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS", "HEAD"];

    if (!validMethods.includes(method)) {
      markSuspicious(ip);
      return createBlockedResponse("Invalid request method");
    }
  }

  const response = NextResponse.next();

  // Security Headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");

  // Content Security Policy
  response.headers.set("Content-Security-Policy", buildCSP());

  // HSTS - Strict Transport Security (1 year, include subdomains, preload)
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");

  // Prevent MIME type sniffing
  response.headers.set("X-DNS-Prefetch-Control", "off");

  // Cross-Origin policies
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");

  // Rate limit headers
  response.headers.set("X-RateLimit-Limit", CONFIG.globalLimit.toString());
  response.headers.set("X-RateLimit-Remaining", rateCheck.remaining.toString());

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
