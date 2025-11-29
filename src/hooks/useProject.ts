"use client";

import { useCallback, useMemo, useRef, useEffect } from "react";
import { useProjectStore, useCurrentProject, useProjects as useProjectsSelector } from "@/store";
import { trpc } from "@/lib/trpc";
import { optimizeContent } from "@/lib/content-optimizer";
import { generateContentPatches, shouldUsePatch, optimizePatches, type Patch } from "@/lib/content-patch";
import type { Project, Task, KanbanCard, UpdateProjectInput } from "@/types";
import type { KanbanColumn, Priority } from "@prisma/client";

const SYNC_DEBOUNCE_MS = 2000;

/**
 * Hook for managing a single project with tRPC mutations
 * Uses Zustand store for local state and tRPC for server sync
 * Supports patch-based content updates for efficient syncing
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
  const patchMutation = trpc.project.patchContent.useMutation();
  const pendingChangesRef = useRef<Partial<UpdateProjectInput>>({});
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track content for patch generation
  const baseContentRef = useRef<Record<string, unknown>[] | null>(null);
  const contentVersionRef = useRef<number>(0);
  const pendingPatchesRef = useRef<Patch[]>([]);

  // Initialize base content when project loads
  useEffect(() => {
    if (project?.content) {
      baseContentRef.current = project.content as Record<string, unknown>[];
      // Get version from project if available, otherwise start at 0
      contentVersionRef.current = (project as Project & { contentVersion?: number }).contentVersion ?? 0;
    }
  }, [project?.id]); // Only reset when project changes, not on every content update

  const flushSync = useCallback(() => {
    if (!projectId || projectId.startsWith("temp-")) return;

    const changes = pendingChangesRef.current;
    const patches = pendingPatchesRef.current;
    
    // If we have patches and they're more efficient, use patch endpoint
    if (patches.length > 0 && changes.content) {
      const optimizedPatches = optimizePatches(patches);
      
      if (shouldUsePatch(optimizedPatches, changes.content as Record<string, unknown>[])) {
        // Use patch-based update
        patchMutation.mutate(
          {
            id: projectId,
            patches: optimizedPatches,
            baseVersion: contentVersionRef.current,
          },
          {
            onSuccess: (result) => {
              if (result.success && !result.conflict) {
                // Update version and base content
                contentVersionRef.current = result.currentVersion;
                if (result.project?.content) {
                  baseContentRef.current = result.project.content as Record<string, unknown>[];
                }
              } else if (result.conflict) {
                // Handle conflict by falling back to full update
                console.warn("Content conflict detected, falling back to full update");
                const fullChanges = { ...changes };
                if (fullChanges.content) {
                  fullChanges.content = optimizeContent(fullChanges.content as Record<string, unknown>[]);
                }
                updateMutation.mutate({ id: projectId, ...fullChanges });
              }
            },
            onError: () => {
              // Fallback to full update on error
              const fullChanges = { ...changes };
              if (fullChanges.content) {
                fullChanges.content = optimizeContent(fullChanges.content as Record<string, unknown>[]);
              }
              updateMutation.mutate({ id: projectId, ...fullChanges });
            },
          }
        );
        
        // Clear pending patches but keep non-content changes for regular update
        pendingPatchesRef.current = [];
        delete pendingChangesRef.current.content;
        
        // If there are other changes, send them via regular update
        if (Object.keys(pendingChangesRef.current).length > 0) {
          updateMutation.mutate({ id: projectId, ...pendingChangesRef.current });
        }
        pendingChangesRef.current = {};
        return;
      }
    }
    
    // Fall back to regular full update
    if (Object.keys(changes).length === 0) return;

    const optimizedChanges = { ...changes };
    if (optimizedChanges.content) {
      optimizedChanges.content = optimizeContent(
        optimizedChanges.content as Record<string, unknown>[]
      );
      // Update base content after sync
      baseContentRef.current = optimizedChanges.content as Record<string, unknown>[];
    }

    updateMutation.mutate({ id: projectId, ...optimizedChanges });
    pendingChangesRef.current = {};
    pendingPatchesRef.current = [];
  }, [projectId, updateMutation, patchMutation]);

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
        // Generate patches for content changes
        if (data.content && baseContentRef.current) {
          const newContent = data.content as Record<string, unknown>[];
          const { patches } = generateContentPatches(baseContentRef.current, newContent);
          pendingPatchesRef.current = [...pendingPatchesRef.current, ...patches];
        }
        
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
