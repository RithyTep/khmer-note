"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Project, Task, KanbanCard, UpdateProjectInput } from "@/types";
import { Status, KanbanColumn, Priority } from "@prisma/client";
import {
  getAllProjects,
  getProject,
  saveProject,
  deleteProject as deleteProjectFromDB,
  generateTempId,
  isTempId,
  getLastProjectId as getLastProjectIdFromDB,
  setLastProjectId as setLastProjectIdToDB,
  updateProjectTask,
  addProjectTask,
  deleteProjectTask,
  updateProjectKanbanCard,
  addProjectKanbanCard,
  deleteProjectKanbanCard,
} from "@/lib/local-db";
import { syncProject, initialSync, forceSync, addSyncListener } from "@/lib/sync-service";
import { DEFAULT_VALUES } from "@/lib/constants";

const STATUS_CYCLE: Status[] = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"];

// ============ Single Project Hook ============

export function useProject(projectId: string | null) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  // Use ref to avoid dependency on project object in callbacks
  const projectRef = useRef<Project | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    projectRef.current = project;
  }, [project]);

  // Load project from local DB
  const loadProject = useCallback(async () => {
    if (!projectId) {
      setProject(null);
      return;
    }

    setLoading(true);
    try {
      const localProject = await getProject(projectId);
      if (mountedRef.current) {
        setProject(localProject);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to load project");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [projectId]);

  useEffect(() => {
    mountedRef.current = true;
    loadProject();
    return () => {
      mountedRef.current = false;
    };
  }, [loadProject]);

  // Update project locally - stable callback that doesn't depend on project state
  const updateProject = useCallback(
    async (data: UpdateProjectInput) => {
      const currentProject = projectRef.current;
      if (!projectId || !currentProject) return;

      const updated: Project = {
        ...currentProject,
        title: data.title ?? currentProject.title,
        description: data.description !== undefined ? data.description : currentProject.description,
        content: data.content !== undefined ? data.content : currentProject.content,
        emoji: data.emoji ?? currentProject.emoji,
        cover: data.cover !== undefined ? data.cover : currentProject.cover,
        status: data.status ?? currentProject.status,
        dueDate: data.dueDate !== undefined
          ? (data.dueDate ? new Date(data.dueDate) : null)
          : currentProject.dueDate,
        isFavorite: data.isFavorite ?? currentProject.isFavorite,
        assigneeId: data.assigneeId !== undefined ? data.assigneeId : currentProject.assigneeId,
        updatedAt: new Date(),
      };

      setProject(updated);
      await saveProject(updated);
      syncProject(updated); // Sync to server (debounced 2s)
    },
    [projectId] // Only depends on projectId, not the entire project object
  );

  // Cycle through statuses - stable callback
  const cycleStatus = useCallback(() => {
    const currentProject = projectRef.current;
    if (!currentProject) return;
    const currentIdx = STATUS_CYCLE.indexOf(currentProject.status);
    const nextStatus = STATUS_CYCLE[(currentIdx + 1) % STATUS_CYCLE.length];
    updateProject({ status: nextStatus });
  }, [updateProject]);

  // ============ Task Operations ============

  const addTask = useCallback(
    async (text: string, tag?: string) => {
      const currentProject = projectRef.current;
      if (!projectId || !currentProject) return null;

      const maxOrder = currentProject.tasks.length > 0
        ? Math.max(...currentProject.tasks.map(t => t.order))
        : -1;

      const newTask: Task = {
        id: generateTempId(),
        text,
        tag: tag ?? "New",
        checked: false,
        order: maxOrder + 1,
        projectId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedProject = {
        ...currentProject,
        tasks: [...currentProject.tasks, newTask],
        updatedAt: new Date(),
      };

      setProject(updatedProject);
      await saveProject(updatedProject);
      syncProject(updatedProject);
      return newTask;
    },
    [projectId]
  );

  const updateTask = useCallback(
    async (taskId: string, updates: Partial<Task>) => {
      const currentProject = projectRef.current;
      if (!projectId || !currentProject) return;

      const taskIndex = currentProject.tasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) return;

      const updatedTasks = [...currentProject.tasks];
      updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], ...updates, updatedAt: new Date() };

      const updatedProject = {
        ...currentProject,
        tasks: updatedTasks,
        updatedAt: new Date(),
      };

      setProject(updatedProject);
      await saveProject(updatedProject);
      syncProject(updatedProject);
    },
    [projectId]
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      const currentProject = projectRef.current;
      if (!projectId || !currentProject) return;

      const updatedProject = {
        ...currentProject,
        tasks: currentProject.tasks.filter(t => t.id !== taskId),
        updatedAt: new Date(),
      };

      setProject(updatedProject);
      await saveProject(updatedProject);
      syncProject(updatedProject);
    },
    [projectId]
  );

  const toggleTask = useCallback(
    async (taskId: string) => {
      const currentProject = projectRef.current;
      if (!currentProject) return;
      const task = currentProject.tasks.find(t => t.id === taskId);
      if (task) {
        await updateTask(taskId, { checked: !task.checked });
      }
    },
    [updateTask]
  );

  // ============ Kanban Operations ============

  const addKanbanCard = useCallback(
    async (text: string, column: KanbanColumn = "TODO", priority?: Priority) => {
      const currentProject = projectRef.current;
      if (!projectId || !currentProject) return null;

      const cardsInColumn = currentProject.kanbanCards.filter(c => c.column === column);
      const maxOrder = cardsInColumn.length > 0
        ? Math.max(...cardsInColumn.map(c => c.order))
        : -1;

      const newCard: KanbanCard = {
        id: generateTempId(),
        text,
        column,
        priority: priority ?? null,
        order: maxOrder + 1,
        projectId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedProject = {
        ...currentProject,
        kanbanCards: [...currentProject.kanbanCards, newCard],
        updatedAt: new Date(),
      };

      setProject(updatedProject);
      await saveProject(updatedProject);
      syncProject(updatedProject);
      return newCard;
    },
    [projectId]
  );

  const updateKanbanCard = useCallback(
    async (cardId: string, updates: Partial<KanbanCard>) => {
      const currentProject = projectRef.current;
      if (!projectId || !currentProject) return;

      const cardIndex = currentProject.kanbanCards.findIndex(c => c.id === cardId);
      if (cardIndex === -1) return;

      const updatedCards = [...currentProject.kanbanCards];
      updatedCards[cardIndex] = { ...updatedCards[cardIndex], ...updates, updatedAt: new Date() };

      const updatedProject = {
        ...currentProject,
        kanbanCards: updatedCards,
        updatedAt: new Date(),
      };

      setProject(updatedProject);
      await saveProject(updatedProject);
      syncProject(updatedProject);
    },
    [projectId]
  );

  const deleteKanbanCard = useCallback(
    async (cardId: string) => {
      const currentProject = projectRef.current;
      if (!projectId || !currentProject) return;

      const updatedProject = {
        ...currentProject,
        kanbanCards: currentProject.kanbanCards.filter(c => c.id !== cardId),
        updatedAt: new Date(),
      };

      setProject(updatedProject);
      await saveProject(updatedProject);
      syncProject(updatedProject);
    },
    [projectId]
  );

  const moveKanbanCard = useCallback(
    async (cardId: string, column: KanbanColumn, order?: number) => {
      await updateKanbanCard(cardId, { column, order });
    },
    [updateKanbanCard]
  );

  return {
    project,
    loading,
    error,
    refetch: loadProject,
    updateProject,
    cycleStatus,
    // Task operations
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    // Kanban operations
    addKanbanCard,
    updateKanbanCard,
    deleteKanbanCard,
    moveKanbanCard,
  };
}

// ============ Projects List Hook ============

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<string>("idle");
  const initializedRef = useRef(false);

  // Load projects from local DB
  const loadProjects = useCallback(async () => {
    try {
      const localProjects = await getAllProjects();
      setProjects(localProjects);
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize: load from local DB, then sync from server
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const init = async () => {
      // First, load from local DB (instant)
      await loadProjects();

      // Then fetch latest from server and merge
      const serverProjects = await initialSync();
      if (serverProjects.length > 0) {
        setProjects(serverProjects);
      }
    };

    init();

    // Listen for sync status changes
    const unsubscribe = addSyncListener((status) => {
      setSyncStatus(status);
    });

    return () => unsubscribe();
  }, [loadProjects]);

  // Create project locally
  const createProject = useCallback(
    async (title: string, userId: string, content?: Record<string, unknown>[]) => {
      const newProject: Project = {
        id: generateTempId(),
        title,
        description: null,
        content: content ?? null,
        emoji: DEFAULT_VALUES.EMOJI,
        cover: null,
        status: "NOT_STARTED",
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

      // Update state immediately
      setProjects((prev) => [newProject, ...prev]);

      // Save to local DB and sync
      await saveProject(newProject);
      await setLastProjectIdToDB(newProject.id);
      syncProject(newProject);

      return newProject;
    },
    []
  );

  // Delete project locally
  const deleteProjectLocal = useCallback(async (projectId: string) => {
    // Update state immediately
    setProjects((prev) => prev.filter((p) => p.id !== projectId));

    // Delete from local DB
    await deleteProjectFromDB(projectId);
  }, []);

  // Duplicate project
  const duplicateProject = useCallback(
    async (projectId: string, userId: string) => {
      const original = await getProject(projectId);
      if (!original) return null;

      const duplicated: Project = {
        ...original,
        id: generateTempId(),
        title: `${original.title} (ច្បាប់ចម្លង)`,
        createdAt: new Date(),
        updatedAt: new Date(),
        tasks: original.tasks.map(t => ({ ...t, id: generateTempId() })),
        kanbanCards: original.kanbanCards.map(c => ({ ...c, id: generateTempId() })),
      };

      setProjects((prev) => [duplicated, ...prev]);
      await saveProject(duplicated);
      syncProject(duplicated);

      return duplicated;
    },
    []
  );

  // Toggle favorite
  const toggleFavorite = useCallback(async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const updated = { ...project, isFavorite: !project.isFavorite, updatedAt: new Date() };

    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? updated : p))
    );

    await saveProject(updated);
    syncProject(updated);
  }, [projects]);

  // Manual sync
  const triggerForceSync = useCallback(async () => {
    await forceSync();
    await loadProjects();
  }, [loadProjects]);

  return {
    projects,
    loading,
    syncStatus,
    refetch: loadProjects,
    createProject,
    deleteProject: deleteProjectLocal,
    duplicateProject,
    toggleFavorite,
    forceSync: triggerForceSync,
  };
}

// ============ Last Project ID ============

export async function getLastProjectId(): Promise<string | null> {
  return getLastProjectIdFromDB();
}

export async function setLastProjectId(id: string): Promise<void> {
  return setLastProjectIdToDB(id);
}
