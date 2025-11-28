import { prisma } from "@/lib/prisma";
import { requireAuthAndRateLimit, RATE_LIMITS } from "@/lib/request-guard";
import {
  successResponse,
  badRequestResponse,
  internalErrorResponse,
} from "@/lib/api-response";
import { z } from "zod";

// Sync request schema - client sends all local changes
const syncRequestSchema = z.object({
  lastSyncAt: z.string().datetime().nullable().optional(),
  projects: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().nullable().optional(),
    content: z.unknown().nullable().optional(),
    emoji: z.string().optional(),
    cover: z.string().nullable().optional(),
    status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]).optional(),
    dueDate: z.string().datetime().nullable().optional(),
    isFavorite: z.boolean().optional(),
    tasks: z.array(z.object({
      id: z.string(),
      text: z.string(),
      tag: z.string().nullable().optional(),
      checked: z.boolean().optional(),
      order: z.number().optional(),
      _deleted: z.boolean().optional(),
    })).optional(),
    kanbanCards: z.array(z.object({
      id: z.string(),
      text: z.string(),
      column: z.enum(["TODO", "PROGRESS", "DONE"]).optional(),
      priority: z.enum(["HIGH", "MEDIUM", "LOW"]).nullable().optional(),
      order: z.number().optional(),
      _deleted: z.boolean().optional(),
    })).optional(),
    updatedAt: z.string().datetime(),
    _deleted: z.boolean().optional(),
    _isNew: z.boolean().optional(),
  })).optional(),
});

type SyncRequest = z.infer<typeof syncRequestSchema>;

/**
 * GET /api/sync
 * Fetch all projects for the user (initial load or full refresh)
 */
export async function GET(request: Request) {
  const guard = await requireAuthAndRateLimit(request, "sync:get", RATE_LIMITS.read);
  if (!guard.success) return guard.response;

  try {
    const { searchParams } = new URL(request.url);
    const since = searchParams.get("since"); // ISO timestamp for delta sync

    const whereClause = since
      ? { userId: guard.user!.id, updatedAt: { gte: new Date(since) } }
      : { userId: guard.user!.id };

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        tasks: { orderBy: { order: "asc" } },
        kanbanCards: { orderBy: [{ column: "asc" }, { order: "asc" }] },
      },
      orderBy: { updatedAt: "desc" },
    });

    return successResponse({
      projects,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    return internalErrorResponse("fetch", "projects", error);
  }
}

/**
 * POST /api/sync
 * Sync local changes to the server
 * Client sends all modified projects since last sync
 */
export async function POST(request: Request) {
  const guard = await requireAuthAndRateLimit(request, "sync:post", { limit: 10, window: 60 });
  if (!guard.success) return guard.response;

  try {
    const body = await request.json();
    const validation = syncRequestSchema.safeParse(body);

    if (!validation.success) {
      return badRequestResponse(validation.error.issues.map(e => e.message).join(", "));
    }

    const { projects: clientProjects } = validation.data;
    const userId = guard.user!.id;

    if (!clientProjects || clientProjects.length === 0) {
      // No changes to sync, just return current state
      const projects = await prisma.project.findMany({
        where: { userId },
        include: {
          tasks: { orderBy: { order: "asc" } },
          kanbanCards: { orderBy: [{ column: "asc" }, { order: "asc" }] },
        },
        orderBy: { updatedAt: "desc" },
      });

      return successResponse({
        projects,
        syncedAt: new Date().toISOString(),
      });
    }

    const results: { created: string[]; updated: string[]; deleted: string[] } = {
      created: [],
      updated: [],
      deleted: [],
    };

    // Process each project
    for (const clientProject of clientProjects) {
      const isTemp = clientProject.id.startsWith("temp-") || clientProject._isNew;

      if (clientProject._deleted && !isTemp) {
        // Delete project
        await prisma.project.deleteMany({
          where: { id: clientProject.id, userId },
        });
        results.deleted.push(clientProject.id);
        continue;
      }

      if (isTemp) {
        // Create new project
        const created = await prisma.project.create({
          data: {
            title: clientProject.title,
            description: clientProject.description ?? null,
            content: clientProject.content ?? undefined,
            emoji: clientProject.emoji ?? "📝",
            cover: clientProject.cover ?? null,
            status: clientProject.status ?? "NOT_STARTED",
            dueDate: clientProject.dueDate ? new Date(clientProject.dueDate) : null,
            isFavorite: clientProject.isFavorite ?? false,
            userId,
            tasks: clientProject.tasks ? {
              create: clientProject.tasks
                .filter(t => !t._deleted)
                .map(t => ({
                  text: t.text,
                  tag: t.tag ?? null,
                  checked: t.checked ?? false,
                  order: t.order ?? 0,
                })),
            } : undefined,
            kanbanCards: clientProject.kanbanCards ? {
              create: clientProject.kanbanCards
                .filter(k => !k._deleted)
                .map(k => ({
                  text: k.text,
                  column: k.column ?? "TODO",
                  priority: k.priority ?? null,
                  order: k.order ?? 0,
                })),
            } : undefined,
          },
        });
        results.created.push(created.id);
      } else {
        // Update existing project
        const existing = await prisma.project.findUnique({
          where: { id: clientProject.id },
          select: { userId: true, updatedAt: true },
        });

        if (!existing || existing.userId !== userId) continue;

        // Check if client version is newer
        const clientUpdatedAt = new Date(clientProject.updatedAt);
        if (clientUpdatedAt <= existing.updatedAt) continue; // Server has newer version

        await prisma.project.update({
          where: { id: clientProject.id },
          data: {
            title: clientProject.title,
            description: clientProject.description,
            content: clientProject.content ?? undefined,
            emoji: clientProject.emoji,
            cover: clientProject.cover,
            status: clientProject.status,
            dueDate: clientProject.dueDate ? new Date(clientProject.dueDate) : null,
            isFavorite: clientProject.isFavorite,
          },
        });

        // Handle tasks
        if (clientProject.tasks) {
          for (const task of clientProject.tasks) {
            const isNewTask = task.id.startsWith("temp-");

            if (task._deleted && !isNewTask) {
              await prisma.task.deleteMany({
                where: { id: task.id, projectId: clientProject.id },
              });
            } else if (isNewTask) {
              await prisma.task.create({
                data: {
                  text: task.text,
                  tag: task.tag ?? null,
                  checked: task.checked ?? false,
                  order: task.order ?? 0,
                  projectId: clientProject.id,
                },
              });
            } else {
              await prisma.task.updateMany({
                where: { id: task.id, projectId: clientProject.id },
                data: {
                  text: task.text,
                  tag: task.tag,
                  checked: task.checked,
                  order: task.order,
                },
              });
            }
          }
        }

        // Handle kanban cards
        if (clientProject.kanbanCards) {
          for (const card of clientProject.kanbanCards) {
            const isNewCard = card.id.startsWith("temp-");

            if (card._deleted && !isNewCard) {
              await prisma.kanbanCard.deleteMany({
                where: { id: card.id, projectId: clientProject.id },
              });
            } else if (isNewCard) {
              await prisma.kanbanCard.create({
                data: {
                  text: card.text,
                  column: card.column ?? "TODO",
                  priority: card.priority ?? null,
                  order: card.order ?? 0,
                  projectId: clientProject.id,
                },
              });
            } else {
              await prisma.kanbanCard.updateMany({
                where: { id: card.id, projectId: clientProject.id },
                data: {
                  text: card.text,
                  column: card.column,
                  priority: card.priority,
                  order: card.order,
                },
              });
            }
          }
        }

        results.updated.push(clientProject.id);
      }
    }

    // Return updated state
    const projects = await prisma.project.findMany({
      where: { userId },
      include: {
        tasks: { orderBy: { order: "asc" } },
        kanbanCards: { orderBy: [{ column: "asc" }, { order: "asc" }] },
      },
      orderBy: { updatedAt: "desc" },
    });

    return successResponse({
      projects,
      syncedAt: new Date().toISOString(),
      results,
    });
  } catch (error) {
    return internalErrorResponse("sync", "projects", error);
  }
}
