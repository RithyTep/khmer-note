"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import { KanbanColumn, Status } from "@prisma/client";

// Helper to generate temporary IDs
const tempId = () => `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

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

  // OPTIMISTIC: Update project - instant UI update
  const updateProject = useCallback(
    (data: UpdateProjectInput) => {
      if (!projectId || !project) return;

      // Optimistic update
      setProject((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          ...data,
          dueDate: data.dueDate ? new Date(data.dueDate) : data.dueDate === null ? null : prev.dueDate,
          updatedAt: new Date(),
        } as Project;
      });

      // Fire and forget API call
      fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).catch(console.error);
    },
    [projectId, project]
  );

  // OPTIMISTIC: Cycle status
  const cycleStatus = useCallback(() => {
    if (!project) return;
    const statusOrder: Status[] = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"];
    const currentIndex = statusOrder.indexOf(project.status);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
    updateProject({ status: nextStatus });
  }, [project, updateProject]);

  // OPTIMISTIC: Add task - instant UI update with temp ID
  const addTask = useCallback(
    (input: Omit<CreateTaskInput, "projectId">) => {
      if (!projectId || !project) return;

      const newTask: Task = {
        id: tempId(),
        text: input.text,
        tag: input.tag || "New",
        checked: false,
        order: project.tasks.length,
        projectId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Optimistic update
      setProject((prev) =>
        prev ? { ...prev, tasks: [...prev.tasks, newTask] } : null
      );

      // Fire and forget
      fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, projectId }),
      })
        .then((res) => res.json())
        .then((task) => {
          // Replace temp ID with real ID
          setProject((prev) =>
            prev
              ? {
                  ...prev,
                  tasks: prev.tasks.map((t) =>
                    t.id === newTask.id ? task : t
                  ),
                }
              : null
          );
        })
        .catch(console.error);
    },
    [projectId, project]
  );

  // OPTIMISTIC: Update task
  const updateTask = useCallback(
    (taskId: string, data: UpdateTaskInput) => {
      // Optimistic update
      setProject((prev) =>
        prev
          ? {
              ...prev,
              tasks: prev.tasks.map((t) =>
                t.id === taskId ? { ...t, ...data, updatedAt: new Date() } : t
              ),
            }
          : null
      );

      // Fire and forget
      fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).catch(console.error);
    },
    []
  );

  // OPTIMISTIC: Delete task
  const deleteTask = useCallback((taskId: string) => {
    // Optimistic update
    setProject((prev) =>
      prev
        ? { ...prev, tasks: prev.tasks.filter((t) => t.id !== taskId) }
        : null
    );

    // Fire and forget
    fetch(`/api/tasks/${taskId}`, { method: "DELETE" }).catch(console.error);
  }, []);

  // OPTIMISTIC: Toggle task
  const toggleTask = useCallback(
    (taskId: string) => {
      const task = project?.tasks.find((t) => t.id === taskId);
      if (!task) return;
      updateTask(taskId, { checked: !task.checked });
    },
    [project, updateTask]
  );

  // OPTIMISTIC: Add kanban card
  const addKanbanCard = useCallback(
    (input: Omit<CreateKanbanCardInput, "projectId">) => {
      if (!projectId || !project) return;

      const column = input.column || "TODO";
      const cardsInColumn = project.kanbanCards.filter((c) => c.column === column);

      const newCard: KanbanCard = {
        id: tempId(),
        text: input.text,
        column: column as KanbanColumn,
        priority: input.priority || null,
        order: cardsInColumn.length,
        projectId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Optimistic update
      setProject((prev) =>
        prev ? { ...prev, kanbanCards: [...prev.kanbanCards, newCard] } : null
      );

      // Fire and forget
      fetch("/api/kanban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, projectId }),
      })
        .then((res) => res.json())
        .then((card) => {
          // Replace temp ID with real ID
          setProject((prev) =>
            prev
              ? {
                  ...prev,
                  kanbanCards: prev.kanbanCards.map((c) =>
                    c.id === newCard.id ? card : c
                  ),
                }
              : null
          );
        })
        .catch(console.error);
    },
    [projectId, project]
  );

  // OPTIMISTIC: Update kanban card
  const updateKanbanCard = useCallback(
    (cardId: string, data: UpdateKanbanCardInput) => {
      // Optimistic update
      setProject((prev) =>
        prev
          ? {
              ...prev,
              kanbanCards: prev.kanbanCards.map((c) =>
                c.id === cardId ? { ...c, ...data, updatedAt: new Date() } : c
              ),
            }
          : null
      );

      // Fire and forget
      fetch(`/api/kanban/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).catch(console.error);
    },
    []
  );

  // OPTIMISTIC: Delete kanban card
  const deleteKanbanCard = useCallback((cardId: string) => {
    // Optimistic update
    setProject((prev) =>
      prev
        ? {
            ...prev,
            kanbanCards: prev.kanbanCards.filter((c) => c.id !== cardId),
          }
        : null
    );

    // Fire and forget
    fetch(`/api/kanban/${cardId}`, { method: "DELETE" }).catch(console.error);
  }, []);

  // OPTIMISTIC: Move kanban card
  const moveKanbanCard = useCallback(
    (cardId: string, direction: -1 | 1) => {
      const card = project?.kanbanCards.find((c) => c.id === cardId);
      if (!card) return;

      const columns: KanbanColumn[] = ["TODO", "PROGRESS", "DONE"];
      const currentIndex = columns.indexOf(card.column);
      const newIndex = currentIndex + direction;

      if (newIndex < 0 || newIndex >= columns.length) return;

      const newColumn = columns[newIndex];
      updateKanbanCard(cardId, { column: newColumn });
    },
    [project, updateKanbanCard]
  );

  // OPTIMISTIC: Reset kanban
  const resetKanban = useCallback(() => {
    if (!projectId) return;

    // Optimistic update
    setProject((prev) => (prev ? { ...prev, kanbanCards: [] } : null));

    // Fire and forget
    fetch(`/api/kanban?projectId=${projectId}`, {
      method: "DELETE",
    }).catch(console.error);
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

// Hook for projects list with optimistic updates
export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(() => {
    setLoading(true);
    fetch("/api/projects")
      .then((res) => res.ok ? res.json() : [])
      .then(setProjects)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // OPTIMISTIC: Create project
  const createProject = useCallback((title: string, userId: string) => {
    const newProject: Project = {
      id: tempId(),
      title,
      description: null,
      emoji: "📝",
      status: "NOT_STARTED" as Status,
      dueDate: null,
      isFavorite: false,
      userId,
      assigneeId: null,
      assignee: null,
      tasks: [],
      kanbanCards: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Optimistic update
    setProjects((prev) => [newProject, ...prev]);

    // Fire API and update with real ID
    fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    })
      .then((res) => res.json())
      .then((project) => {
        setProjects((prev) =>
          prev.map((p) => (p.id === newProject.id ? project : p))
        );
      })
      .catch(console.error);

    return newProject;
  }, []);

  return { projects, loading, refetch: fetchProjects, createProject };
}
