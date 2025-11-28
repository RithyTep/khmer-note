import { z } from "zod";
import { Status, KanbanColumn, Priority } from "@prisma/client";

// Maximum lengths for text fields
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_CONTENT_LENGTH = 100000; // ~100KB for rich text content
const MAX_EMOJI_LENGTH = 10;
const MAX_TAG_LENGTH = 50;

// Common sanitization function to prevent XSS in text fields
function sanitizeString(str: string): string {
  return str
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Common field schemas
const uuidSchema = z.string().regex(UUID_REGEX, "Invalid ID format");

const titleSchema = z
  .string()
  .min(1, "Title is required")
  .max(MAX_TITLE_LENGTH, `Title must be ${MAX_TITLE_LENGTH} characters or less`)
  .transform(sanitizeString);

const optionalTitleSchema = z
  .string()
  .max(MAX_TITLE_LENGTH, `Title must be ${MAX_TITLE_LENGTH} characters or less`)
  .transform(sanitizeString)
  .optional();

const descriptionSchema = z
  .string()
  .max(MAX_DESCRIPTION_LENGTH, `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`)
  .transform(sanitizeString)
  .optional()
  .nullable();

// Content can be any JSON value (BlockNote content is an array of blocks)
const contentSchema = z
  .unknown()
  .refine(
    (val) => {
      if (val === null || val === undefined) return true;
      const str = JSON.stringify(val);
      return str.length <= MAX_CONTENT_LENGTH;
    },
    { message: `Content exceeds maximum size` }
  )
  .optional()
  .nullable();

const emojiSchema = z
  .string()
  .max(MAX_EMOJI_LENGTH, "Invalid emoji")
  .optional()
  .nullable();

const statusSchema = z.nativeEnum(Status).optional();

const dateSchema = z
  .string()
  .datetime()
  .optional()
  .nullable()
  .transform((val) => (val ? new Date(val) : null));

// Project schemas
export const createProjectSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  content: contentSchema,
  emoji: emojiSchema,
  cover: z.string().url().optional().nullable(),
  status: statusSchema,
  dueDate: dateSchema,
  assigneeId: uuidSchema.optional().nullable(),
  isFavorite: z.boolean().optional(),
});

export const updateProjectSchema = z.object({
  title: optionalTitleSchema,
  description: descriptionSchema,
  content: contentSchema,
  emoji: emojiSchema,
  cover: z.string().url().optional().nullable(),
  status: statusSchema,
  dueDate: dateSchema,
  assigneeId: uuidSchema.optional().nullable(),
  isFavorite: z.boolean().optional(),
});

// Task schemas
export const createTaskSchema = z.object({
  text: titleSchema,
  checked: z.boolean().optional(),
  tag: z
    .string()
    .max(MAX_TAG_LENGTH, `Tag must be ${MAX_TAG_LENGTH} characters or less`)
    .transform(sanitizeString)
    .optional()
    .nullable(),
  projectId: uuidSchema,
});

export const updateTaskSchema = z.object({
  text: optionalTitleSchema,
  checked: z.boolean().optional(),
  tag: z
    .string()
    .max(MAX_TAG_LENGTH, `Tag must be ${MAX_TAG_LENGTH} characters or less`)
    .transform(sanitizeString)
    .optional()
    .nullable(),
});

// Kanban card schemas
export const createKanbanCardSchema = z.object({
  text: titleSchema,
  column: z.nativeEnum(KanbanColumn).optional(),
  priority: z.nativeEnum(Priority).optional(),
  order: z.number().int().min(0).optional(),
  projectId: uuidSchema,
});

export const updateKanbanCardSchema = z.object({
  text: optionalTitleSchema,
  column: z.nativeEnum(KanbanColumn).optional(),
  priority: z.nativeEnum(Priority).optional(),
  order: z.number().int().min(0).optional(),
});

// Route params schema
export const idParamSchema = z.object({
  id: uuidSchema,
});

// Maximum request body size (100KB for regular requests, 1MB for content-heavy requests)
const MAX_BODY_SIZE = 100 * 1024; // 100KB
const MAX_CONTENT_BODY_SIZE = 1024 * 1024; // 1MB

// Helper function to validate request body with size check
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>,
  options: { allowLargeBody?: boolean } = {}
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    // Check Content-Length header first for quick rejection
    const contentLength = request.headers.get("content-length");
    const maxSize = options.allowLargeBody ? MAX_CONTENT_BODY_SIZE : MAX_BODY_SIZE;

    if (contentLength && parseInt(contentLength, 10) > maxSize) {
      return { success: false, error: `Request body too large (max ${maxSize / 1024}KB)` };
    }

    // Clone request to read body without consuming it
    const clonedRequest = request.clone();
    const bodyText = await clonedRequest.text();

    // Double-check actual body size
    if (bodyText.length > maxSize) {
      return { success: false, error: `Request body too large (max ${maxSize / 1024}KB)` };
    }

    const body = JSON.parse(bodyText);
    const result = schema.safeParse(body);

    if (!result.success) {
      const errors = result.error.issues.map((e: { message: string }) => e.message).join(", ");
      return { success: false, error: errors };
    }

    return { success: true, data: result.data };
  } catch (e) {
    if (e instanceof SyntaxError) {
      return { success: false, error: "Invalid JSON body" };
    }
    return { success: false, error: "Failed to process request body" };
  }
}

// Helper to validate route params
export function validateId(id: string): { success: true; id: string } | { success: false; error: string } {
  const result = uuidSchema.safeParse(id);
  if (!result.success) {
    return { success: false, error: "Invalid ID format" };
  }
  return { success: true, id: result.data };
}

// Export types for use in API routes
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateKanbanCardInput = z.infer<typeof createKanbanCardSchema>;
export type UpdateKanbanCardInput = z.infer<typeof updateKanbanCardSchema>;
