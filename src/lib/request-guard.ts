import { auth } from "@/lib/auth";
import {
  rateLimit,
  getClientId,
  rateLimitResponse,
  RATE_LIMITS,
  RateLimitConfig,
  ipRateLimit,
  validateOrigin,
  checkPayloadSize,
} from "@/lib/rate-limit";
import { unauthorizedResponse, badRequestResponse, forbiddenResponse } from "@/lib/api-response";

const ALLOWED_HOSTS = [
  "localhost",
  "127.0.0.1",
  "khmer-note.vercel.app",
  "camnova.com",
  "camnova.rithytep.online",
  "rithytep.online",
];

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
  const ipResult = ipRateLimit(request);
  if (!ipResult.success) {
    return { success: false, response: rateLimitResponse(ipResult) };
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    if (!validateOrigin(request, ALLOWED_HOSTS)) {
      return { success: false, response: forbiddenResponse("Invalid request origin") };
    }
  }

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

export function validatePayloadSize(body: string, maxBytes: number = 100000): GuardResult {
  if (!checkPayloadSize(body, maxBytes)) {
    return {
      success: false,
      response: badRequestResponse(`Payload too large (max ${maxBytes / 1000}KB)`),
    };
  }
  return { success: true };
}

export { RATE_LIMITS } from "@/lib/rate-limit";
export { checkPayloadSize } from "@/lib/rate-limit";
