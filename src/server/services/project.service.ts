import { db } from "../db/client";
import { applyContentPatches } from "@/lib/content-patch";
import type { Patch } from "@/lib/content-patch";
import type {
  CreateProjectInput,
  UpdateProjectInput,
  SyncRequestInput,
  CreateTaskInput,
  UpdateTaskInput,
  CreateKanbanCardInput,
  UpdateKanbanCardInput,
  PatchContentInput,
} from "../schema/project.schema";

function sanitizeForPrisma<T>(obj: T): T {
  if (obj === undefined) return null as T;
  if (obj === null) return obj;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForPrisma) as T;
  }
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = sanitizeForPrisma(value);
    }
    return result as T;
  }
  return obj;
}

const projectInclude = {
  tasks: { orderBy: { order: "asc" as const } },
  kanbanCards: { orderBy: [{ column: "asc" as const }, { order: "asc" as const }] },
};

export async function getProjects(userId: string, since?: string) {
  const whereClause = since
    ? { userId, updatedAt: { gte: new Date(since) } }
    : { userId };

  return db.project.findMany({
    where: whereClause,
    include: projectInclude,
    orderBy: { updatedAt: "desc" },
  });
}

export async function getProjectById(projectId: string, userId: string) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: projectInclude,
  });

  if (!project || project.userId !== userId) {
    return null;
  }

  return project;
}

export async function createProject(userId: string, input: CreateProjectInput) {
  return db.project.create({
    data: {
      title: input.title,
      description: input.description ?? null,
      content: input.content ? sanitizeForPrisma(input.content) : undefined,
      emoji: input.emoji ?? "📝",
      status: input.status ?? "NOT_STARTED",
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      isFavorite: input.isFavorite ?? false,
      userId,
    },
    include: projectInclude,
  });
}

export async function updateProject(
  projectId: string,
  userId: string,
  input: Omit<UpdateProjectInput, "id">
) {
  const existing = await db.project.findUnique({
    where: { id: projectId },
    select: { userId: true },
  });

  if (!existing || existing.userId !== userId) {
    throw new Error("Project not found or access denied");
  }

  const updateData: Record<string, unknown> = {};

  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.content !== undefined) updateData.content = sanitizeForPrisma(input.content);
  if (input.emoji !== undefined) updateData.emoji = input.emoji;
  if (input.cover !== undefined) updateData.cover = input.cover;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.dueDate !== undefined) {
    updateData.dueDate = input.dueDate ? new Date(input.dueDate) : null;
  }
  if (input.isFavorite !== undefined) updateData.isFavorite = input.isFavorite;

  if (input.tasks) {
    await syncTasks(projectId, input.tasks);
  }

  if (input.kanbanCards) {
    await syncKanbanCards(projectId, input.kanbanCards);
  }

  return db.project.update({
    where: { id: projectId },
    data: updateData,
    include: projectInclude,
  });
}

export async function deleteProject(projectId: string, userId: string) {
  const existing = await db.project.findUnique({
    where: { id: projectId },
    select: { userId: true },
  });

  if (!existing || existing.userId !== userId) {
    throw new Error("Project not found or access denied");
  }

  await db.project.delete({ where: { id: projectId } });
  return { success: true };
}

export async function toggleFavorite(projectId: string, userId: string) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { userId: true, isFavorite: true },
  });

  if (!project || project.userId !== userId) {
    throw new Error("Project not found or access denied");
  }

  return db.project.update({
    where: { id: projectId },
    data: { isFavorite: !project.isFavorite },
    include: projectInclude,
  });
}

async function syncTasks(
  projectId: string,
  tasks: Array<{ id: string; text: string; tag?: string | null; checked?: boolean; order?: number; _deleted?: boolean }>
) {
  const tasksToDelete = tasks
    .filter((t) => t._deleted && !t.id.startsWith("temp-"))
    .map((t) => t.id);

  const tasksToCreate = tasks
    .filter((t) => t.id.startsWith("temp-") && !t._deleted)
    .map((t) => ({
      text: t.text,
      tag: t.tag ?? null,
      checked: t.checked ?? false,
      order: t.order ?? 0,
      projectId,
    }));

  const tasksToUpdate = tasks.filter(
    (t) => !t.id.startsWith("temp-") && !t._deleted
  );

  if (tasksToDelete.length > 0) {
    await db.task.deleteMany({
      where: { id: { in: tasksToDelete }, projectId },
    });
  }

  if (tasksToCreate.length > 0) {
    await db.task.createMany({ data: tasksToCreate });
  }

  if (tasksToUpdate.length > 0) {
    await db.$transaction(
      tasksToUpdate.map((task) =>
        db.task.updateMany({
          where: { id: task.id, projectId },
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

async function syncKanbanCards(
  projectId: string,
  cards: Array<{
    id: string;
    text: string;
    column?: "TODO" | "PROGRESS" | "DONE";
    priority?: "HIGH" | "MEDIUM" | "LOW" | null;
    order?: number;
    _deleted?: boolean;
  }>
) {
  const cardsToDelete = cards
    .filter((c) => c._deleted && !c.id.startsWith("temp-"))
    .map((c) => c.id);

  const cardsToCreate = cards
    .filter((c) => c.id.startsWith("temp-") && !c._deleted)
    .map((c) => ({
      text: c.text,
      column: c.column ?? "TODO",
      priority: c.priority ?? null,
      order: c.order ?? 0,
      projectId,
    }));

  const cardsToUpdate = cards.filter(
    (c) => !c.id.startsWith("temp-") && !c._deleted
  );

  if (cardsToDelete.length > 0) {
    await db.kanbanCard.deleteMany({
      where: { id: { in: cardsToDelete }, projectId },
    });
  }

  if (cardsToCreate.length > 0) {
    await db.kanbanCard.createMany({ data: cardsToCreate });
  }

  if (cardsToUpdate.length > 0) {
    await db.$transaction(
      cardsToUpdate.map((card) =>
        db.kanbanCard.updateMany({
          where: { id: card.id, projectId },
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

export async function syncProjects(userId: string, input: SyncRequestInput) {
  const { projects: clientProjects } = input;

  if (!clientProjects || clientProjects.length === 0) {
    return {
      projects: await getProjects(userId),
      syncedAt: new Date().toISOString(),
      results: { created: [], updated: [], deleted: [] },
    };
  }

  const results = {
    created: [] as string[],
    updated: [] as string[],
    deleted: [] as string[],
  };

  for (const clientProject of clientProjects) {
    const isTemp = clientProject.id.startsWith("temp-") || clientProject._isNew;

    if (clientProject._deleted && !isTemp) {
      await db.project.deleteMany({
        where: { id: clientProject.id, userId },
      });
      results.deleted.push(clientProject.id);
      continue;
    }

    if (isTemp) {
      const created = await db.project.create({
        data: {
          title: clientProject.title,
          description: clientProject.description ?? null,
          content: clientProject.content ? sanitizeForPrisma(clientProject.content) : undefined,
          emoji: clientProject.emoji ?? "📝",
          cover: clientProject.cover ?? null,
          status: clientProject.status ?? "NOT_STARTED",
          dueDate: clientProject.dueDate ? new Date(clientProject.dueDate) : null,
          isFavorite: clientProject.isFavorite ?? false,
          userId,
          tasks: clientProject.tasks
            ? {
                create: clientProject.tasks
                  .filter((t) => !t._deleted)
                  .map((t) => ({
                    text: t.text,
                    tag: t.tag ?? null,
                    checked: t.checked ?? false,
                    order: t.order ?? 0,
                  })),
              }
            : undefined,
          kanbanCards: clientProject.kanbanCards
            ? {
                create: clientProject.kanbanCards
                  .filter((k) => !k._deleted)
                  .map((k) => ({
                    text: k.text,
                    column: k.column ?? "TODO",
                    priority: k.priority ?? null,
                    order: k.order ?? 0,
                  })),
              }
            : undefined,
        },
      });
      results.created.push(created.id);
      continue;
    }

    const existing = await db.project.findUnique({
      where: { id: clientProject.id },
      select: { userId: true, updatedAt: true },
    });

    if (!existing || existing.userId !== userId) continue;

    const clientUpdatedAt = clientProject.updatedAt
      ? new Date(clientProject.updatedAt)
      : new Date();
    if (clientUpdatedAt <= existing.updatedAt) continue;

    await db.project.update({
      where: { id: clientProject.id },
      data: {
        title: clientProject.title,
        description: clientProject.description,
        content: clientProject.content ? sanitizeForPrisma(clientProject.content) : undefined,
        emoji: clientProject.emoji,
        cover: clientProject.cover,
        status: clientProject.status,
        dueDate: clientProject.dueDate ? new Date(clientProject.dueDate) : null,
        isFavorite: clientProject.isFavorite,
      },
    });

    if (clientProject.tasks) {
      await syncTasks(clientProject.id, clientProject.tasks);
    }

    if (clientProject.kanbanCards) {
      await syncKanbanCards(clientProject.id, clientProject.kanbanCards);
    }

    results.updated.push(clientProject.id);
  }

  return {
    projects: await getProjects(userId),
    syncedAt: new Date().toISOString(),
    results,
  };
}

export async function createTask(userId: string, input: CreateTaskInput) {
  const project = await db.project.findUnique({
    where: { id: input.projectId },
    select: { userId: true },
  });

  if (!project || project.userId !== userId) {
    throw new Error("Project not found or access denied");
  }

  const maxOrder = await db.task.aggregate({
    where: { projectId: input.projectId },
    _max: { order: true },
  });

  return db.task.create({
    data: {
      text: input.text,
      tag: input.tag ?? null,
      order: (maxOrder._max.order ?? -1) + 1,
      projectId: input.projectId,
    },
  });
}

export async function updateTask(
  userId: string,
  taskId: string,
  input: Omit<UpdateTaskInput, "id">
) {
  const task = await db.task.findUnique({
    where: { id: taskId },
    include: { project: { select: { userId: true } } },
  });

  if (!task || task.project.userId !== userId) {
    throw new Error("Task not found or access denied");
  }

  return db.task.update({
    where: { id: taskId },
    data: input,
  });
}

export async function deleteTask(userId: string, taskId: string) {
  const task = await db.task.findUnique({
    where: { id: taskId },
    include: { project: { select: { userId: true } } },
  });

  if (!task || task.project.userId !== userId) {
    throw new Error("Task not found or access denied");
  }

  await db.task.delete({ where: { id: taskId } });
  return { success: true };
}

export async function createKanbanCard(userId: string, input: CreateKanbanCardInput) {
  const project = await db.project.findUnique({
    where: { id: input.projectId },
    select: { userId: true },
  });

  if (!project || project.userId !== userId) {
    throw new Error("Project not found or access denied");
  }

  const column = input.column ?? "TODO";
  const maxOrder = await db.kanbanCard.aggregate({
    where: { projectId: input.projectId, column },
    _max: { order: true },
  });

  return db.kanbanCard.create({
    data: {
      text: input.text,
      column,
      priority: input.priority ?? null,
      order: (maxOrder._max.order ?? -1) + 1,
      projectId: input.projectId,
    },
  });
}

export async function updateKanbanCard(
  userId: string,
  cardId: string,
  input: Omit<UpdateKanbanCardInput, "id">
) {
  const card = await db.kanbanCard.findUnique({
    where: { id: cardId },
    include: { project: { select: { userId: true } } },
  });

  if (!card || card.project.userId !== userId) {
    throw new Error("Card not found or access denied");
  }

  return db.kanbanCard.update({
    where: { id: cardId },
    data: input,
  });
}

export async function deleteKanbanCard(userId: string, cardId: string) {
  const card = await db.kanbanCard.findUnique({
    where: { id: cardId },
    include: { project: { select: { userId: true } } },
  });

  if (!card || card.project.userId !== userId) {
    throw new Error("Card not found or access denied");
  }

  await db.kanbanCard.delete({ where: { id: cardId } });
  return { success: true };
}

/**
 * Apply content patches to a project (delta updates)
 * Much more efficient than sending full content for large documents
 */
export async function patchProjectContent(
  projectId: string,
  userId: string,
  input: Omit<PatchContentInput, "id">
) {
  const existing = await db.project.findUnique({
    where: { id: projectId },
    select: { userId: true, content: true, contentVersion: true },
  });

  if (!existing || existing.userId !== userId) {
    throw new Error("Project not found or access denied");
  }

  // Check for version conflict
  const currentVersion = existing.contentVersion ?? 0;
  if (input.baseVersion !== currentVersion) {
    // Version mismatch - client needs to refresh and retry
    return {
      success: false,
      conflict: true,
      currentVersion,
      content: existing.content,
    };
  }

  // Apply patches to existing content
  const currentContent = (existing.content as Record<string, unknown>[] | null) ?? [];
  const patches = input.patches as Patch[];
  const newContent = applyContentPatches(currentContent, patches);

  // Update with new content and increment version
  const updated = await db.project.update({
    where: { id: projectId },
    data: {
      content: sanitizeForPrisma(newContent) as unknown as undefined,
      contentVersion: currentVersion + 1,
    },
    include: projectInclude,
  });

  return {
    success: true,
    conflict: false,
    currentVersion: currentVersion + 1,
    project: updated,
  };
}
