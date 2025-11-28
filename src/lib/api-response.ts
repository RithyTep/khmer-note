import { NextResponse } from "next/server";

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  PAYLOAD_TOO_LARGE: 413,
  INTERNAL_ERROR: 500,
} as const;

export const ERROR_MESSAGES = {
  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "Forbidden",
  NOT_FOUND: (resource: string) => `${resource} not found`,
  REQUIRED: (field: string) => `${field} is required`,
  FAILED: (action: string, resource: string) => `Failed to ${action} ${resource}`,
  RATE_LIMITED: "Too many requests. Please try again later.",
  PAYLOAD_TOO_LARGE: "Request payload too large",
} as const;

// Security headers for API responses
const SECURITY_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
  "X-Content-Type-Options": "nosniff",
};

function createSecureResponse<T>(data: T, status: number, additionalHeaders?: Record<string, string>) {
  return NextResponse.json(data, {
    status,
    headers: {
      ...SECURITY_HEADERS,
      ...additionalHeaders,
    },
  });
}

export function successResponse<T>(data: T, status = HTTP_STATUS.OK) {
  return createSecureResponse(data, status);
}

export function createdResponse<T>(data: T) {
  return createSecureResponse(data, HTTP_STATUS.CREATED);
}

export function errorResponse(message: string, status: number) {
  // Sanitize error message to prevent information leakage
  const sanitizedMessage = message.replace(/[<>]/g, "");
  return createSecureResponse({ error: sanitizedMessage }, status);
}

export function unauthorizedResponse() {
  return errorResponse(ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
}

export function forbiddenResponse(message?: string) {
  return errorResponse(message || ERROR_MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
}

export function notFoundResponse(resource: string) {
  return errorResponse(ERROR_MESSAGES.NOT_FOUND(resource), HTTP_STATUS.NOT_FOUND);
}

export function badRequestResponse(message: string) {
  return errorResponse(message, HTTP_STATUS.BAD_REQUEST);
}

export function rateLimitedResponse(retryAfter?: number) {
  return createSecureResponse(
    { error: ERROR_MESSAGES.RATE_LIMITED },
    HTTP_STATUS.TOO_MANY_REQUESTS,
    retryAfter ? { "Retry-After": retryAfter.toString() } : undefined
  );
}

export function payloadTooLargeResponse() {
  return errorResponse(ERROR_MESSAGES.PAYLOAD_TOO_LARGE, HTTP_STATUS.PAYLOAD_TOO_LARGE);
}

export function internalErrorResponse(action: string, resource: string, error: unknown) {
  // Log the full error for debugging but don't expose it to the client
  console.error(`${ERROR_MESSAGES.FAILED(action, resource)}:`, error);
  // Return a generic error message to prevent information leakage
  return errorResponse(ERROR_MESSAGES.FAILED(action, resource), HTTP_STATUS.INTERNAL_ERROR);
}

export function deleteSuccessResponse(resource: string) {
  return successResponse({ message: `${resource} deleted successfully` });
}
