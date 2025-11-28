import { auth } from "@/lib/auth";
import { rateLimit, getClientId, rateLimitResponse, RATE_LIMITS, RateLimitConfig } from "@/lib/rate-limit";
import { unauthorizedResponse } from "@/lib/api-response";

export interface AuthenticatedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export interface GuardResult {
  success: boolean;
  user?: AuthenticatedUser;
  response?: Response;
}

export async function requireAuth(): Promise<GuardResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, response: unauthorizedResponse() };
  }

  return {
    success: true,
    user: session.user as AuthenticatedUser
  };
}

export function requireRateLimit(
  request: Request,
  endpoint: string,
  config: RateLimitConfig = RATE_LIMITS.api
): GuardResult {
  const clientId = getClientId(request);
  const result = rateLimit(`${endpoint}:${clientId}`, config);

  if (!result.success) {
    return { success: false, response: rateLimitResponse(result) };
  }

  return { success: true };
}

export async function requireAuthAndRateLimit(
  request: Request,
  endpoint: string,
  config: RateLimitConfig = RATE_LIMITS.api
): Promise<GuardResult> {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult;
  }

  const rateLimitResult = requireRateLimit(request, endpoint, config);
  if (!rateLimitResult.success) {
    return rateLimitResult;
  }

  return { success: true, user: authResult.user };
}

export { RATE_LIMITS } from "@/lib/rate-limit";
