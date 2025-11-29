import { z } from "zod";
import { logger } from "@/lib/logger";

/**
 * Client-side environment variables schema
 * Only NEXT_PUBLIC_ prefixed vars are available in the browser
 */
const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

/**
 * Validate client environment variables
 */
function validateClientEnv() {
  const parsed = clientSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });

  if (!parsed.success) {
    logger.warn("Invalid client environment variables", {
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  return parsed.success ? parsed.data : {};
}

export const clientEnv = validateClientEnv();

// Type exports
export type ClientEnv = z.infer<typeof clientSchema>;
