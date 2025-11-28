import { z } from "zod";

// Enums matching Prisma
export const statusEnum = z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]);
export const kanbanColumnEnum = z.enum(["TODO", "PROGRESS", "DONE"]);
export const priorityEnum = z.enum(["HIGH", "MEDIUM", "LOW"]);

// Task schemas
export const taskSchema = z.object({
  id: z.string(),
  text: z.string(),
  tag: z.string().nullable().optional(),
  checked: z.boolean().optional().default(false),
  order: z.number().optional().default(0),
  _deleted: z.boolean().optional(),
});

export const createTaskSchema = z.object({
  text: z.string().min(1, "Task text is required"),
  tag: z.string().optional(),
  projectId: z.string(),
});

export const updateTaskSchema = z.object({
  id: z.string(),
  text: z.string().optional(),
  tag: z.string().nullable().optional(),
  checked: z.boolean().optional(),
  order: z.number().optional(),
});

// Kanban card schemas
export const kanbanCardSchema = z.object({
  id: z.string(),
  text: z.string(),
  column: kanbanColumnEnum.optional().default("TODO"),
  priority: priorityEnum.nullable().optional(),
  order: z.number().optional().default(0),
  _deleted: z.boolean().optional(),
});

export const createKanbanCardSchema = z.object({
  text: z.string().min(1, "Card text is required"),
  column: kanbanColumnEnum.optional(),
  priority: priorityEnum.optional(),
  projectId: z.string(),
});

export const updateKanbanCardSchema = z.object({
  id: z.string(),
  text: z.string().optional(),
  column: kanbanColumnEnum.optional(),
  priority: priorityEnum.nullable().optional(),
  order: z.number().optional(),
});

// Project schemas
export const projectSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  content: z.unknown().nullable().optional(),
  emoji: z.string().optional().default("📝"),
  cover: z.string().nullable().optional(),
  status: statusEnum.optional().default("NOT_STARTED"),
  dueDate: z.string().datetime().nullable().optional(),
  isFavorite: z.boolean().optional().default(false),
  tasks: z.array(taskSchema).optional(),
  kanbanCards: z.array(kanbanCardSchema).optional(),
  updatedAt: z.string().datetime().optional(),
  _deleted: z.boolean().optional(),
  _isNew: z.boolean().optional(),
});

export const createProjectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  content: z.unknown().optional(),
  emoji: z.string().optional(),
  status: statusEnum.optional(),
  dueDate: z.string().datetime().optional(),
  isFavorite: z.boolean().optional(),
});

export const updateProjectSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  content: z.unknown().nullable().optional(),
  emoji: z.string().optional(),
  cover: z.string().nullable().optional(),
  status: statusEnum.optional(),
  dueDate: z.string().datetime().nullable().optional(),
  isFavorite: z.boolean().optional(),
  tasks: z.array(taskSchema).optional(),
  kanbanCards: z.array(kanbanCardSchema).optional(),
});

export const getByIdSchema = z.object({
  id: z.string(),
});

export const syncRequestSchema = z.object({
  lastSyncAt: z.string().datetime().nullable().optional(),
  projects: z.array(projectSchema).optional(),
});

// Type exports
export type TaskInput = z.infer<typeof taskSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export type KanbanCardInput = z.infer<typeof kanbanCardSchema>;
export type CreateKanbanCardInput = z.infer<typeof createKanbanCardSchema>;
export type UpdateKanbanCardInput = z.infer<typeof updateKanbanCardSchema>;

export type ProjectInput = z.infer<typeof projectSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type SyncRequestInput = z.infer<typeof syncRequestSchema>;
