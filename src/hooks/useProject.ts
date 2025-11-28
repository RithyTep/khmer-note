"use client";

import { useCallback, useMemo, useRef, useEffect } from "react";
import { useProjectStore, useCurrentProject, useProjects as useProjectsSelector } from "@/store";
import { trpc } from "@/lib/trpc";
import { optimizeContent } from "@/lib/content-optimizer";
import type { Project, Task, KanbanCard, UpdateProjectInput } from "@/types";
import type { KanbanColumn, Priority } from "@prisma/client";

const SYNC_DEBOUNCE_MS = 2000;

/**
 * Hook for managing a single project with tRPC mutations
 * Uses Zustand store for local state and tRPC for server sync
 */
export function useProject(projectId: string | null) {
  const {
    currentProject,
    isLoading: loading,
    error,
    loadProject,
    updateProject: storeUpdateProject,
    addTask: storeAddTask,
    updateTask: storeUpdateTask,
    deleteTask: storeDeleteTask,
    toggleTask: storeToggleTask,
    addKanbanCard: storeAddKanbanCard,
    updateKanbanCard: storeUpdateKanbanCard,
    deleteKanbanCard: storeDeleteKanbanCard,
    moveKanbanCard: storeMoveKanbanCard,
    cycleStatus: storeCycleStatus,
  } = useProjectStore();

  // Get project from store
  const projects = useProjectsSelector();
  const project = useMemo(() => {
    if (!projectId) return null;
    return projects.find((p: Project) => p.id === projectId) ?? currentProject;
  }, [projectId, projects, currentProject]);

  const updateMutation = trpc.project.update.useMutation();
  const pendingChangesRef = useRef<Partial<UpdateProjectInput>>({});
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const flushSync = useCallback(() => {
    if (!projectId || projectId.startsWith("temp-")) return;

    const changes = pendingChangesRef.current;
    if (Object.keys(changes).length === 0) return;

    const optimizedChanges = { ...changes };
    if (optimizedChanges.content) {
      optimizedChanges.content = optimizeContent(
        optimizedChanges.content as Record<string, unknown>[]
      );
    }

    updateMutation.mutate({ id: projectId, ...optimizedChanges });
    pendingChangesRef.current = {};
  }, [projectId, updateMutation]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushSync();
      }
    };

    const handleBeforeUnload = () => {
      flushSync();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        flushSync();
      }
    };
  }, [flushSync]);

  const updateProject = useCallback(
    async (data: UpdateProjectInput) => {
      if (!projectId) return;

      await storeUpdateProject(projectId, data as Partial<Project>);

      if (!projectId.startsWith("temp-")) {
        pendingChangesRef.current = { ...pendingChangesRef.current, ...data };

        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
        }
        syncTimeoutRef.current = setTimeout(flushSync, SYNC_DEBOUNCE_MS);
      }
    },
    [projectId, storeUpdateProject, flushSync]
  );

  const cycleStatus = useCallback(() => {
    if (!projectId) return;
    storeCycleStatus(projectId);
  }, [projectId, storeCycleStatus]);

  const addTask = useCallback(
    async (text: string, tag?: string) => {
      if (!projectId) return null;
      return storeAddTask(projectId, text, tag);
    },
    [projectId, storeAddTask]
  );

  const updateTask = useCallback(
    async (taskId: string, updates: Partial<Task>) => {
      if (!projectId) return;
      await storeUpdateTask(projectId, taskId, updates);
    },
    [projectId, storeUpdateTask]
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      if (!projectId) return;
      await storeDeleteTask(projectId, taskId);
    },
    [projectId, storeDeleteTask]
  );

  const toggleTask = useCallback(
    async (taskId: string) => {
      if (!projectId) return;
      await storeToggleTask(projectId, taskId);
    },
    [projectId, storeToggleTask]
  );

  const addKanbanCard = useCallback(
    async (text: string, column: KanbanColumn = "TODO", priority?: Priority) => {
      if (!projectId) return null;
      return storeAddKanbanCard(projectId, text, column, priority);
    },
    [projectId, storeAddKanbanCard]
  );

  const updateKanbanCard = useCallback(
    async (cardId: string, updates: Partial<KanbanCard>) => {
      if (!projectId) return;
      await storeUpdateKanbanCard(projectId, cardId, updates);
    },
    [projectId, storeUpdateKanbanCard]
  );

  const deleteKanbanCard = useCallback(
    async (cardId: string) => {
      if (!projectId) return;
      await storeDeleteKanbanCard(projectId, cardId);
    },
    [projectId, storeDeleteKanbanCard]
  );

  const moveKanbanCard = useCallback(
    async (cardId: string, column: KanbanColumn, order?: number) => {
      if (!projectId) return;
      await storeMoveKanbanCard(projectId, cardId, column, order);
    },
    [projectId, storeMoveKanbanCard]
  );

  return {
    project,
    loading,
    error,
    refetch: () => projectId && loadProject(projectId),
    updateProject,
    cycleStatus,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    addKanbanCard,
    updateKanbanCard,
    deleteKanbanCard,
    moveKanbanCard,
  };
}

/**
 * Hook to manage all projects using Zustand store
 */
export function useAllProjects() {
  const {
    projects,
    isLoading: loading,
    syncStatus,
    loadProjects,
    createProject,
    deleteProject,
    duplicateProject,
    toggleFavorite,
  } = useProjectStore();

  return {
    projects,
    loading,
    syncStatus,
    refetch: loadProjects,
    createProject,
    deleteProject,
    duplicateProject,
    toggleFavorite,
  };
}

/**
 * Legacy hook for backward compatibility
 * @deprecated Use useAllProjects instead
 */
export function useProjects() {
  return useAllProjects();
}

export async function getLastProjectId(): Promise<string | null> {
  return useProjectStore.getState().getLastProjectId();
}

export async function setLastProjectId(id: string): Promise<void> {
  return useProjectStore.getState().setLastProjectId(id);
}
