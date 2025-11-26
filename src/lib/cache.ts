"use cache";

import { prisma } from "./prisma";
import { cacheLife, cacheTag } from "next/cache";

// Cache life profiles
const CACHE_PROFILES = {
  short: 60, // 1 minute
  medium: 300, // 5 minutes
  long: 3600, // 1 hour
} as const;

// Cached: Get all projects
export async function getProjectsCached() {
  "use cache";
  cacheLife("minutes");
  cacheTag("projects");

  return prisma.project.findMany({
    include: {
      assignee: true,
      tasks: { orderBy: { order: "asc" } },
      kanbanCards: { orderBy: [{ column: "asc" }, { order: "asc" }] },
    },
    orderBy: { updatedAt: "desc" },
  });
}

// Cached: Get single project by ID
export async function getProjectByIdCached(id: string) {
  "use cache";
  cacheLife("seconds");
  cacheTag("projects", `project-${id}`);

  return prisma.project.findUnique({
    where: { id },
    include: {
      assignee: true,
      tasks: { orderBy: { order: "asc" } },
      kanbanCards: { orderBy: [{ column: "asc" }, { order: "asc" }] },
    },
  });
}

// Cached: Get all users
export async function getUsersCached() {
  "use cache";
  cacheLife("hours");
  cacheTag("users");

  return prisma.user.findMany({
    orderBy: { name: "asc" },
  });
}

// Cached: Get tasks by project ID
export async function getTasksByProjectCached(projectId: string) {
  "use cache";
  cacheLife("seconds");
  cacheTag("tasks", `tasks-${projectId}`);

  return prisma.task.findMany({
    where: { projectId },
    orderBy: { order: "asc" },
  });
}

// Cached: Get kanban cards by project ID
export async function getKanbanCardsByProjectCached(projectId: string) {
  "use cache";
  cacheLife("seconds");
  cacheTag("kanban", `kanban-${projectId}`);

  return prisma.kanbanCard.findMany({
    where: { projectId },
    orderBy: [{ column: "asc" }, { order: "asc" }],
  });
}
