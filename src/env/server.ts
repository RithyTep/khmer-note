import { z } from "zod";

/**
 * Server-side environment variables schema
 * These are validated at build time and runtime
 */
const serverSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // Auth
  AUTH_SECRET: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),

  // AI (optional)
  GROQ_API_KEY: z.string().optional(),

  // Storage (optional)
  BLOB_READ_WRITE_TOKEN: z.string().optional(),

  // Runtime
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

/**
 * Validate and parse server environment variables
 */
function validateEnv() {
  const parsed = serverSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error(
      "❌ Invalid server environment variables:",
      parsed.error.flatten().fieldErrors
    );

    // In production, throw to prevent startup with invalid env
    if (process.env.NODE_ENV === "production") {
      throw new Error("Invalid server environment variables");
    }

    // In development, return partial env with defaults
    return {
      DATABASE_URL: process.env.DATABASE_URL ?? "",
      AUTH_SECRET: process.env.AUTH_SECRET ?? "dev-secret",
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "",
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? "",
      GROQ_API_KEY: process.env.GROQ_API_KEY,
      BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
      NODE_ENV: (process.env.NODE_ENV as "development" | "production" | "test") ?? "development",
    };
  }

  return parsed.data;
}

export const env = validateEnv();

// Type exports
export type ServerEnv = z.infer<typeof serverSchema>;

// Helper flags
export const isDev = env.NODE_ENV === "development";
export const isProd = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";
