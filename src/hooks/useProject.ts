"use client";

import { useCallback, useMemo } from "react";
import { useProjectStore, useCurrentProject, useProjects as useProjectsSelector } from "@/store";
import { trpc } from "@/lib/trpc";
import type { Project, Task, KanbanCard, UpdateProjectInput } from "@/types";
import type { KanbanColumn, Priority } from "@prisma/client";

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

  // tRPC mutations
  const updateMutation = trpc.project.update.useMutation();

  // Update project with optimistic update
  const updateProject = useCallback(
    async (data: UpdateProjectInput) => {
      if (!projectId) return;

      // Optimistic update to store
      await storeUpdateProject(projectId, data as Partial<Project>);

      // Sync with server (fire and forget)
      updateMutation.mutate({
        id: projectId,
        ...data,
      });
    },
    [projectId, storeUpdateProject, updateMutation]
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
