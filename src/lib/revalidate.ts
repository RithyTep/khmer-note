import { revalidateTag } from "next/cache";

// Next.js 16: revalidateTag now requires a cacheLife profile as second argument
// Using "max" for stale-while-revalidate behavior

// Revalidate project-related caches
export function revalidateProjects() {
  revalidateTag("projects", "max");
}

export function revalidateProject(id: string) {
  revalidateTag("projects", "max");
  revalidateTag(`project-${id}`, "max");
}

// Revalidate task-related caches
export function revalidateTasks(projectId: string) {
  revalidateTag("tasks", "max");
  revalidateTag(`tasks-${projectId}`, "max");
  revalidateTag(`project-${projectId}`, "max");
  revalidateTag("projects", "max");
}

// Revalidate kanban-related caches
export function revalidateKanban(projectId: string) {
  revalidateTag("kanban", "max");
  revalidateTag(`kanban-${projectId}`, "max");
  revalidateTag(`project-${projectId}`, "max");
  revalidateTag("projects", "max");
}

// Revalidate user-related caches
export function revalidateUsers() {
  revalidateTag("users", "max");
}
