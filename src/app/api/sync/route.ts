import { prisma } from "@/lib/prisma";
import { requireAuthAndRateLimit, validatePayloadSize, RATE_LIMITS } from "@/lib/request-guard";
import {
  successResponse,
  badRequestResponse,
  internalErrorResponse,
} from "@/lib/api-response";
import { z } from "zod";

const MAX_PAYLOAD_SIZE = 500000;

const partialUpdateSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
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
  })).optional(),
  kanbanCards: z.array(z.object({
    id: z.string(),
    text: z.string(),
    column: z.enum(["TODO", "PROGRESS", "DONE"]).optional(),
    priority: z.enum(["HIGH", "MEDIUM", "LOW"]).nullable().optional(),
    order: z.number().optional(),
  })).optional(),
  updatedAt: z.string().datetime().optional(),
});

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

export async function GET(request: Request) {
  const guard = await requireAuthAndRateLimit(request, "sync:get", RATE_LIMITS.read);
  if (!guard.success) return guard.response;

  try {
    const { searchParams } = new URL(request.url);
    const since = searchParams.get("since");

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

export async function POST(request: Request) {
  const guard = await requireAuthAndRateLimit(request, "sync:post", { limit: 10, window: 60 });
  if (!guard.success) return guard.response;

  try {
    const bodyText = await request.text();
    const sizeCheck = validatePayloadSize(bodyText, MAX_PAYLOAD_SIZE);
    if (!sizeCheck.success) return sizeCheck.response;

    const body = JSON.parse(bodyText);
    const validation = syncRequestSchema.safeParse(body);

    if (!validation.success) {
      return badRequestResponse(validation.error.issues.map(e => e.message).join(", "));
    }

    const { projects: clientProjects } = validation.data;
    const userId = guard.user!.id;

    if (!clientProjects || clientProjects.length === 0) {
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

    for (const clientProject of clientProjects) {
      const isTemp = clientProject.id.startsWith("temp-") || clientProject._isNew;

      if (clientProject._deleted && !isTemp) {
        await prisma.project.deleteMany({
          where: { id: clientProject.id, userId },
        });
        results.deleted.push(clientProject.id);
        continue;
      }

      if (isTemp) {
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
        const existing = await prisma.project.findUnique({
          where: { id: clientProject.id },
          select: { userId: true, updatedAt: true },
        });

        if (!existing || existing.userId !== userId) continue;

        const clientUpdatedAt = new Date(clientProject.updatedAt);
        if (clientUpdatedAt <= existing.updatedAt) continue;

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

        // Batch process tasks to avoid N+1 queries
        if (clientProject.tasks) {
          const tasksToDelete = clientProject.tasks
            .filter(t => t._deleted && !t.id.startsWith("temp-"))
            .map(t => t.id);
          const tasksToCreate = clientProject.tasks
            .filter(t => t.id.startsWith("temp-") && !t._deleted)
            .map(t => ({
              text: t.text,
              tag: t.tag ?? null,
              checked: t.checked ?? false,
              order: t.order ?? 0,
              projectId: clientProject.id,
            }));
          const tasksToUpdate = clientProject.tasks
            .filter(t => !t.id.startsWith("temp-") && !t._deleted);

          // Batch delete
          if (tasksToDelete.length > 0) {
            await prisma.task.deleteMany({
              where: { id: { in: tasksToDelete }, projectId: clientProject.id },
            });
          }

          // Batch create
          if (tasksToCreate.length > 0) {
            await prisma.task.createMany({ data: tasksToCreate });
          }

          // Batch update using transaction for existing tasks
          if (tasksToUpdate.length > 0) {
            await prisma.$transaction(
              tasksToUpdate.map(task =>
                prisma.task.updateMany({
                  where: { id: task.id, projectId: clientProject.id },
                  data: {
                    text: task.text,
                    tag: task.tag,
                    checked: task.checked,
                    order: task.order,
                  },
                })
              )
            );
          }
        }

        // Batch process kanban cards to avoid N+1 queries
        if (clientProject.kanbanCards) {
          const cardsToDelete = clientProject.kanbanCards
            .filter(c => c._deleted && !c.id.startsWith("temp-"))
            .map(c => c.id);
          const cardsToCreate = clientProject.kanbanCards
            .filter(c => c.id.startsWith("temp-") && !c._deleted)
            .map(c => ({
              text: c.text,
              column: c.column ?? "TODO",
              priority: c.priority ?? null,
              order: c.order ?? 0,
              projectId: clientProject.id,
            }));
          const cardsToUpdate = clientProject.kanbanCards
            .filter(c => !c.id.startsWith("temp-") && !c._deleted);

          // Batch delete
          if (cardsToDelete.length > 0) {
            await prisma.kanbanCard.deleteMany({
              where: { id: { in: cardsToDelete }, projectId: clientProject.id },
            });
          }

          // Batch create
          if (cardsToCreate.length > 0) {
            await prisma.kanbanCard.createMany({ data: cardsToCreate });
          }

          // Batch update using transaction for existing cards
          if (cardsToUpdate.length > 0) {
            await prisma.$transaction(
              cardsToUpdate.map(card =>
                prisma.kanbanCard.updateMany({
                  where: { id: card.id, projectId: clientProject.id },
                  data: {
                    text: card.text,
                    column: card.column,
                    priority: card.priority,
                    order: card.order,
                  },
                })
              )
            );
          }
        }

        results.updated.push(clientProject.id);
      }
    }

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

export async function PATCH(request: Request) {
  const guard = await requireAuthAndRateLimit(request, "sync:patch", RATE_LIMITS.write);
  if (!guard.success) return guard.response;

  try {
    const bodyText = await request.text();
    const sizeCheck = validatePayloadSize(bodyText, MAX_PAYLOAD_SIZE);
    if (!sizeCheck.success) return sizeCheck.response;

    const body = JSON.parse(bodyText);
    const validation = partialUpdateSchema.safeParse(body);

    if (!validation.success) {
      return badRequestResponse(validation.error.issues.map(e => e.message).join(", "));
    }

    const update = validation.data;
    const userId = guard.user!.id;

    const isNew = update.id.startsWith("temp-");

    if (isNew) {
      const created = await prisma.project.create({
        data: {
          title: update.title || "Untitled",
          description: update.description ?? null,
          content: update.content ?? undefined,
          emoji: update.emoji ?? "📝",
          cover: update.cover ?? null,
          status: update.status ?? "NOT_STARTED",
          dueDate: update.dueDate ? new Date(update.dueDate) : null,
          isFavorite: update.isFavorite ?? false,
          userId,
          tasks: update.tasks ? {
            create: update.tasks.map(t => ({
              text: t.text,
              tag: t.tag ?? null,
              checked: t.checked ?? false,
              order: t.order ?? 0,
            })),
          } : undefined,
          kanbanCards: update.kanbanCards ? {
            create: update.kanbanCards.map(k => ({
              text: k.text,
              column: k.column ?? "TODO",
              priority: k.priority ?? null,
              order: k.order ?? 0,
            })),
          } : undefined,
        },
      });

      return successResponse({ id: created.id, created: true });
    }

    const existing = await prisma.project.findUnique({
      where: { id: update.id },
      select: { userId: true },
    });

    if (!existing || existing.userId !== userId) {
      return badRequestResponse("Project not found");
    }

    const updateData: Record<string, unknown> = {};
    if (update.title !== undefined) updateData.title = update.title;
    if (update.description !== undefined) updateData.description = update.description;
    if (update.content !== undefined) updateData.content = update.content;
    if (update.emoji !== undefined) updateData.emoji = update.emoji;
    if (update.cover !== undefined) updateData.cover = update.cover;
    if (update.status !== undefined) updateData.status = update.status;
    if (update.dueDate !== undefined) updateData.dueDate = update.dueDate ? new Date(update.dueDate) : null;
    if (update.isFavorite !== undefined) updateData.isFavorite = update.isFavorite;

    if (Object.keys(updateData).length > 0) {
      await prisma.project.update({
        where: { id: update.id },
        data: updateData,
      });
    }

    if (update.tasks) {
      await prisma.task.deleteMany({ where: { projectId: update.id } });
      if (update.tasks.length > 0) {
        await prisma.task.createMany({
          data: update.tasks.map(t => ({
            text: t.text,
            tag: t.tag ?? null,
            checked: t.checked ?? false,
            order: t.order ?? 0,
            projectId: update.id,
          })),
        });
      }
    }

    if (update.kanbanCards) {
      await prisma.kanbanCard.deleteMany({ where: { projectId: update.id } });
      if (update.kanbanCards.length > 0) {
        await prisma.kanbanCard.createMany({
          data: update.kanbanCards.map(k => ({
            text: k.text,
            column: k.column ?? "TODO",
            priority: k.priority ?? null,
            order: k.order ?? 0,
            projectId: update.id,
          })),
        });
      }
    }

    return successResponse({ id: update.id, updated: true });
  } catch (error) {
    return internalErrorResponse("partial sync", "project", error);
  }
}
