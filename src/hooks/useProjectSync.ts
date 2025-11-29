"use client";

import { useCallback, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useProjectStore } from "@/store";
import { getAllProjects, saveProject } from "@/lib/local-db";
import { logger } from "@/lib/logger";
import type { Project } from "@/types";

/**
 * Helper to safely convert date to ISO string
 * Handles Date objects, strings, and null/undefined
 */
function toISOStringOrNull(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  if (typeof date === "string") return date;
  if (date instanceof Date) return date.toISOString();
  return null;
}

/**
 * Helper to ensure we have a valid ISO string for updatedAt
 */
function toISOString(date: Date | string): string {
  if (typeof date === "string") return date;
  if (date instanceof Date) return date.toISOString();
  return new Date().toISOString();
}

/**
 * Hook to sync projects between local storage and server
 * Uses tRPC for server communication and Zustand for state management
 */
export function useProjectSync() {
  const setProjects = useProjectStore((s) => s.setProjects);
  const setSyncStatus = useProjectStore((s) => s.setSyncStatus);
  const loadProjects = useProjectStore((s) => s.loadProjects);

  // Track if initial sync has been done
  const hasSyncedRef = useRef(false);
  const isSyncingRef = useRef(false);

  const utils = trpc.useUtils();

  // Sync mutation
  const syncMutation = trpc.project.sync.useMutation({
    onMutate: () => {
      setSyncStatus("syncing");
    },
    onSuccess: async (data) => {
      // Update local store with server data
      if (data.projects.length > 0) {
        // Transform server projects to match local Project type
        const transformedProjects: Project[] = data.projects.map((p) => ({
          ...p,
          content: p.content as Record<string, unknown>[] | null,
          assignee: null, // Server doesn't include this in response
        }));

        setProjects(transformedProjects);

        // Also save to local DB for offline support
        for (const project of transformedProjects) {
          await saveProject(project);
        }
      }

      setSyncStatus("success");
      isSyncingRef.current = false;
    },
    onError: (error) => {
      logger.error("Sync failed", error);
      setSyncStatus("error");
      isSyncingRef.current = false;
    },
  });

  // Initial sync on mount - only runs once
  const initialSync = useCallback(async () => {
    // Prevent multiple syncs
    if (hasSyncedRef.current || isSyncingRef.current) {
      return;
    }

    hasSyncedRef.current = true;
    isSyncingRef.current = true;

    try {
      // First load from local DB (instant)
      await loadProjects();

      // Then sync with server
      const localProjects = await getAllProjects();

      // Don't sync if no projects
      if (localProjects.length === 0) {
        // Just fetch from server
        syncMutation.mutate({ projects: [] });
        return;
      }

      syncMutation.mutate({
        projects: localProjects.map((p) => ({
          ...p,
          id: p.id,
          title: p.title,
          description: p.description,
          content: p.content,
          emoji: p.emoji,
          cover: p.cover,
          status: p.status,
          dueDate: toISOStringOrNull(p.dueDate),
          isFavorite: p.isFavorite,
          tasks: p.tasks,
          kanbanCards: p.kanbanCards,
          updatedAt: toISOString(p.updatedAt),
          _isNew: p.id.startsWith("temp-"),
        })),
      });
    } catch (error) {
      logger.error("Initial sync error", error);
      isSyncingRef.current = false;
    }
  }, [loadProjects, syncMutation, setProjects, setSyncStatus]);

  // Force sync (can be called multiple times)
  const forceSync = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;

    const localProjects = await getAllProjects();
    syncMutation.mutate({
      projects: localProjects.map((p) => ({
        ...p,
        id: p.id,
        title: p.title,
        description: p.description,
        content: p.content,
        emoji: p.emoji,
        cover: p.cover,
        status: p.status,
        dueDate: toISOStringOrNull(p.dueDate),
        isFavorite: p.isFavorite,
        tasks: p.tasks,
        kanbanCards: p.kanbanCards,
        updatedAt: toISOString(p.updatedAt),
      })),
    });
  }, [syncMutation]);

  // Invalidate cache and refetch
  const invalidateProjects = useCallback(() => {
    utils.project.getAll.invalidate();
  }, [utils]);

  return {
    initialSync,
    forceSync,
    invalidateProjects,
    isSyncing: syncMutation.isPending,
    syncError: syncMutation.error,
  };
}

/**
 * Hook to fetch projects using tRPC
 * Provides React Query features like caching, refetching, etc.
 */
export function useProjectsQuery(options?: { enabled?: boolean }) {
  return trpc.project.getAll.useQuery(undefined, {
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch single project using tRPC
 */
export function useProjectQuery(id: string | null) {
  return trpc.project.getById.useQuery(
    { id: id! },
    {
      enabled: !!id,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  );
}

/**
 * Hook to create a project using tRPC
 */
export function useCreateProject() {
  const utils = trpc.useUtils();

  return trpc.project.create.useMutation({
    onSuccess: () => {
      utils.project.getAll.invalidate();
    },
  });
}

/**
 * Hook to update a project using tRPC
 */
export function useUpdateProject() {
  const utils = trpc.useUtils();

  return trpc.project.update.useMutation({
    onSuccess: (data) => {
      utils.project.getAll.invalidate();
      if (data?.id) {
        utils.project.getById.invalidate({ id: data.id });
      }
    },
  });
}

/**
 * Hook to delete a project using tRPC
 */
export function useDeleteProject() {
  const utils = trpc.useUtils();

  return trpc.project.delete.useMutation({
    onSuccess: () => {
      utils.project.getAll.invalidate();
    },
  });
}
