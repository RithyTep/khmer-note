"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getLastProjectId as getLastProjectIdFromCache,
  setLastProjectId as setLastProjectIdToCache,
} from "@/lib/cache-client";
import {
  deleteProject as deleteProjectFromDB,
  saveProject,
  getLastProjectId as getLastProjectIdFromDB,
  setLastProjectId as setLastProjectIdToDB,
} from "@/lib/local-db";
import type { Project } from "@/types";

function getProjectIdFromPath(): string | null {
  if (typeof window === "undefined") return null;
  const match = window.location.pathname.match(/^\/p\/(.+)$/);
  return match ? match[1] : null;
}

function updateUrl(projectId: string | null, replace = false): void {
  if (typeof window === "undefined") return;
  const url = projectId ? `/p/${projectId}` : "/";
  if (replace) {
    window.history.replaceState(null, "", url);
  } else {
    window.history.pushState(null, "", url);
  }
}

interface UseProjectSelectionOptions {
  projects: Project[];
  onRefetch: () => void;
  initialProjectId?: string | null;
}

export function useProjectSelection({ projects, onRefetch, initialProjectId }: UseProjectSelectionOptions) {
  const [selectedId, setSelectedId] = useState<string | null>(() => initialProjectId ?? null);
  const [isReady, setIsReady] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const init = async () => {
      const urlId = initialProjectId ?? getProjectIdFromPath();
      // Try both cache and IndexedDB for last project ID
      const cacheLastId = getLastProjectIdFromCache();
      const dbLastId = await getLastProjectIdFromDB();
      const lastId = cacheLastId ?? dbLastId;
      const initialId = urlId ?? lastId;

      if (initialId) {
        setSelectedId(initialId);
        setLastProjectIdToCache(initialId);
        await setLastProjectIdToDB(initialId);
        if (!urlId && lastId) {
          updateUrl(lastId, true);
        }
      }
      setIsReady(true);
    };

    init();
  }, [initialProjectId]);

  useEffect(() => {
    if (!isReady || selectedId) return;

    if (projects.length > 0) {
      const firstId = projects[0].id;
      setSelectedId(firstId);
      setLastProjectIdToCache(firstId);
      setLastProjectIdToDB(firstId);
      updateUrl(firstId, true);
    }
  }, [projects, selectedId, isReady]);

  useEffect(() => {
    const handlePopState = () => {
      const urlId = getProjectIdFromPath();
      if (urlId) {
        setSelectedId(urlId);
        setLastProjectIdToCache(urlId);
        setLastProjectIdToDB(urlId);
      } else if (projects.length > 0) {
        setSelectedId(projects[0].id);
        setLastProjectIdToCache(projects[0].id);
        setLastProjectIdToDB(projects[0].id);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [projects]);

  const selectProject = useCallback((id: string) => {
    setSelectedId(id);
    setLastProjectIdToCache(id);
    setLastProjectIdToDB(id);
    updateUrl(id);
  }, []);

  const handleDelete = useCallback(
    async (projectId: string) => {
      // Delete from local IndexedDB
      await deleteProjectFromDB(projectId);

      if (selectedId === projectId) {
        const remaining = projects.filter((p) => p.id !== projectId);
        if (remaining.length > 0) {
          const newId = remaining[0].id;
          setSelectedId(newId);
          setLastProjectIdToCache(newId);
          await setLastProjectIdToDB(newId);
          updateUrl(newId, true);
        } else {
          setSelectedId(null);
          updateUrl(null, true);
        }
      }

      // Refresh the projects list
      onRefetch();
    },
    [projects, selectedId, onRefetch]
  );

  const handleToggleFavorite = useCallback(
    async (projectId: string) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return false;

      const newValue = !project.isFavorite;

      // Update in local IndexedDB
      const updated = { ...project, isFavorite: newValue, updatedAt: new Date() };
      await saveProject(updated);

      // Refresh the projects list
      onRefetch();

      return newValue;
    },
    [projects, onRefetch]
  );

  return {
    selectedId,
    selectProject,
    handleDelete,
    handleToggleFavorite,
    isReady,
  };
}
