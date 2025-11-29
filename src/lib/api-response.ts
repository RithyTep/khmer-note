import { NextResponse } from "next/server";
import { logger } from "./logger";

export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  INTERNAL_ERROR: 500,
} as const;

export const ERROR_MESSAGES = {
  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "Forbidden",
  FAILED: (action: string, resource: string) => `Failed to ${action} ${resource}`,
} as const;

const SECURITY_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
  "X-Content-Type-Options": "nosniff",
};

function createSecureResponse<T>(data: T, status: number) {
  return NextResponse.json(data, {
    status,
    headers: SECURITY_HEADERS,
  });
}

function errorResponse(message: string, status: number) {
  const sanitizedMessage = message.replace(/[<>]/g, "");
  return createSecureResponse({ error: sanitizedMessage }, status);
}

export function unauthorizedResponse() {
  return errorResponse(ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
}

export function forbiddenResponse(message?: string) {
  return errorResponse(message || ERROR_MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
}

export function badRequestResponse(message: string) {
  return errorResponse(message, HTTP_STATUS.BAD_REQUEST);
}

export function internalErrorResponse(action: string, resource: string, error: unknown) {
  logger.error(`${ERROR_MESSAGES.FAILED(action, resource)}`, error);
  return errorResponse(ERROR_MESSAGES.FAILED(action, resource), HTTP_STATUS.INTERNAL_ERROR);
}
