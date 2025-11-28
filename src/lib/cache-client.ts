"use client";

import type { Project } from "@/types";
import { STORAGE_KEYS, TIMING } from "@/lib/constants";

const isClient = typeof window !== "undefined";

function safeGet<T>(key: string, fallback: T): T {
  if (!isClient) return fallback;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  if (!isClient) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function safeRemove(key: string): void {
  if (!isClient) return;
  try {
    localStorage.removeItem(key);
  } catch {}
}

export function needsSync(): boolean {
  if (!isClient) return true;

  try {
    if (sessionStorage.getItem(STORAGE_KEYS.SESSION_SYNCED)) return false;

    const lastSync = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    if (!lastSync) return true;

    return Date.now() - parseInt(lastSync, 10) > TIMING.SYNC_INTERVAL_MS;
  } catch {
    return true;
  }
}

export function markSynced(): void {
  if (!isClient) return;
  try {
    sessionStorage.setItem(STORAGE_KEYS.SESSION_SYNCED, "true");
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString());
  } catch {}
}

export function getCachedProjects(): Project[] {
  return safeGet<Project[]>(STORAGE_KEYS.PROJECTS, []);
}

export function setCachedProjects(projects: Project[]): void {
  safeSet(STORAGE_KEYS.PROJECTS, projects);
}

export function getCachedProject(id: string): Project | null {
  const cached = safeGet<Project | null>(STORAGE_KEYS.project(id), null);
  if (cached) return cached;

  return getCachedProjects().find((p) => p.id === id) ?? null;
}

export function setCachedProject(project: Project): void {
  safeSet(STORAGE_KEYS.project(project.id), project);

  const projects = getCachedProjects();
  const index = projects.findIndex((p) => p.id === project.id);

  if (index >= 0) {
    projects[index] = project;
  } else {
    projects.unshift(project);
  }

  setCachedProjects(projects);
}

export function updateCachedProject(id: string, updates: Partial<Project>): void {
  const project = getCachedProject(id);
  if (!project) return;

  const updated = { ...project, ...updates, updatedAt: new Date() };
  setCachedProject(updated as Project);
}

export function addProjectToCache(project: Project): void {
  safeSet(STORAGE_KEYS.project(project.id), project);
  setCachedProjects([project, ...getCachedProjects()]);
}

export function removeProjectFromCache(id: string): void {
  safeRemove(STORAGE_KEYS.project(id));
  setCachedProjects(getCachedProjects().filter((p) => p.id !== id));
}

export function getLastProjectId(): string | null {
  if (!isClient) return null;
  try {
    return localStorage.getItem(STORAGE_KEYS.LAST_PROJECT);
  } catch {
    return null;
  }
}

export function setLastProjectId(id: string): void {
  if (!isClient) return;
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_PROJECT, id);
  } catch {}
}

export function clearCache(): void {
  if (!isClient) return;

  try {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_KEYS.PREFIX)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(safeRemove);
    sessionStorage.removeItem(STORAGE_KEYS.SESSION_SYNCED);
  } catch {}
}
