"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  Project,
  User,
  Task,
  KanbanCard,
  UpdateProjectInput,
  CreateTaskInput,
  UpdateTaskInput,
  CreateKanbanCardInput,
  UpdateKanbanCardInput,
} from "@/types";
import { KanbanColumn } from "@prisma/client";

export function useProject(projectId: string | null) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    if (!projectId) {
      setProject(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch project");
      const data = await res.json();
      setProject(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  // Update project
  const updateProject = useCallback(
    async (data: UpdateProjectInput) => {
      if (!projectId) return;
      try {
        const res = await fetch(`/api/projects/${projectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to update project");
        const updated = await res.json();
        setProject(updated);
        return updated;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        throw err;
      }
    },
    [projectId]
  );

  // Cycle status
  const cycleStatus = useCallback(async () => {
    if (!project) return;
    const statusOrder = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"] as const;
    const currentIndex = statusOrder.indexOf(project.status);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
    return updateProject({ status: nextStatus });
  }, [project, updateProject]);

  // Task operations
  const addTask = useCallback(
    async (input: Omit<CreateTaskInput, "projectId">) => {
      if (!projectId) return;
      try {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...input, projectId }),
        });
        if (!res.ok) throw new Error("Failed to create task");
        const task = await res.json();
        setProject((prev) =>
          prev ? { ...prev, tasks: [...prev.tasks, task] } : null
        );
        return task;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        throw err;
      }
    },
    [projectId]
  );

  const updateTask = useCallback(
    async (taskId: string, data: UpdateTaskInput) => {
      try {
        const res = await fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to update task");
        const updated = await res.json();
        setProject((prev) =>
          prev
            ? {
                ...prev,
                tasks: prev.tasks.map((t) => (t.id === taskId ? updated : t)),
              }
            : null
        );
        return updated;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        throw err;
      }
    },
    []
  );

  const deleteTask = useCallback(async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete task");
      setProject((prev) =>
        prev
          ? { ...prev, tasks: prev.tasks.filter((t) => t.id !== taskId) }
          : null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      throw err;
    }
  }, []);

  const toggleTask = useCallback(
    async (taskId: string) => {
      const task = project?.tasks.find((t) => t.id === taskId);
      if (!task) return;
      return updateTask(taskId, { checked: !task.checked });
    },
    [project, updateTask]
  );

  // Kanban operations
  const addKanbanCard = useCallback(
    async (input: Omit<CreateKanbanCardInput, "projectId">) => {
      if (!projectId) return;
      try {
        const res = await fetch("/api/kanban", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...input, projectId }),
        });
        if (!res.ok) throw new Error("Failed to create kanban card");
        const card = await res.json();
        setProject((prev) =>
          prev ? { ...prev, kanbanCards: [...prev.kanbanCards, card] } : null
        );
        return card;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        throw err;
      }
    },
    [projectId]
  );

  const updateKanbanCard = useCallback(
    async (cardId: string, data: UpdateKanbanCardInput) => {
      try {
        const res = await fetch(`/api/kanban/${cardId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to update kanban card");
        const updated = await res.json();
        setProject((prev) =>
          prev
            ? {
                ...prev,
                kanbanCards: prev.kanbanCards.map((c) =>
                  c.id === cardId ? updated : c
                ),
              }
            : null
        );
        return updated;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        throw err;
      }
    },
    []
  );

  const deleteKanbanCard = useCallback(async (cardId: string) => {
    try {
      const res = await fetch(`/api/kanban/${cardId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete kanban card");
      setProject((prev) =>
        prev
          ? {
              ...prev,
              kanbanCards: prev.kanbanCards.filter((c) => c.id !== cardId),
            }
          : null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      throw err;
    }
  }, []);

  const moveKanbanCard = useCallback(
    async (cardId: string, direction: -1 | 1) => {
      const card = project?.kanbanCards.find((c) => c.id === cardId);
      if (!card) return;

      const columns: KanbanColumn[] = ["TODO", "PROGRESS", "DONE"];
      const currentIndex = columns.indexOf(card.column);
      const newIndex = currentIndex + direction;

      if (newIndex < 0 || newIndex >= columns.length) return;

      return updateKanbanCard(cardId, { column: columns[newIndex] });
    },
    [project, updateKanbanCard]
  );

  const resetKanban = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/kanban?projectId=${projectId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to reset kanban");
      setProject((prev) => (prev ? { ...prev, kanbanCards: [] } : null));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      throw err;
    }
  }, [projectId]);

  return {
    project,
    loading,
    error,
    refetch: fetchProject,
    updateProject,
    cycleStatus,
    // Tasks
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    // Kanban
    addKanbanCard,
    updateKanbanCard,
    deleteKanbanCard,
    moveKanbanCard,
    resetKanban,
  };
}

// Hook for users list
export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } catch (err) {
        console.error("Failed to fetch users:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  return { users, loading };
}

// Hook for projects list
export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = useCallback(
    async (title: string) => {
      try {
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        });
        if (!res.ok) throw new Error("Failed to create project");
        const project = await res.json();
        setProjects((prev) => [project, ...prev]);
        return project;
      } catch (err) {
        console.error("Failed to create project:", err);
        throw err;
      }
    },
    []
  );

  return { projects, loading, refetch: fetchProjects, createProject };
}
