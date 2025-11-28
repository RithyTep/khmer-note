# Security Patterns

## Multi-Layer Security Architecture

### Layer 1: Middleware (`src/middleware.ts`)
- IP-based rate limiting (100 req/60s global, 20 req/5s burst)
- User agent filtering (blocks curl, wget, sqlmap, etc.)
- Client header validation (`x-khmer-note-client: khmer-note-web`)
- Security headers (CSP, HSTS, X-Frame-Options)
- JavaScript challenge token verification

### Layer 2: Request Guard (`src/lib/request-guard.ts`)
```typescript
// Combined auth + rate limit check
const guard = await requireAuthAndRateLimit(request, endpoint, config);
if (!guard.success) return guard.response;
```

### Layer 3: Ownership Verification (`src/lib/ownership.ts`)
```typescript
// Always verify ownership before mutations
const isOwner = await verifyProjectOwnership(projectId, userId);
if (!isOwner) return forbiddenResponse();
```

## Rate Limit Presets
```typescript
RATE_LIMITS = {
  api: { requests: 60, window: 60 },
  read: { requests: 120, window: 60 },
  write: { requests: 30, window: 60 },
  heavy: { requests: 10, window: 60 }
}
```

## Input Validation (`src/lib/validation.ts`)
- Zod schemas for all inputs
- XSS prevention via `sanitizeString()`
- Length limits enforced (title: 200, content: 100KB)

## Security Headers Applied
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security: max-age=31536000`
- `Content-Security-Policy: [restrictive policy]`
