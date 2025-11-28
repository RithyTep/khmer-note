"use client";

import type { Project } from "@/types";
import { getAllProjects, saveProjects, clearProjects } from "./local-db";
import { API_HEADERS } from "./constants";

type SyncStatus = "idle" | "syncing" | "success" | "error";
type SyncListener = (status: SyncStatus, message?: string) => void;

type PartialProjectUpdate = {
  id: string;
  updatedAt: Date;
} & Partial<Omit<Project, "id" | "updatedAt">>;

const listeners: Set<SyncListener> = new Set();
let currentStatus: SyncStatus = "idle";

const debounceTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
const pendingChanges: Map<string, PartialProjectUpdate> = new Map();
const DEBOUNCE_MS = 5000;

function notifyListeners(status: SyncStatus, message?: string) {
  currentStatus = status;
  listeners.forEach((listener) => listener(status, message));
}

export function addSyncListener(listener: SyncListener): () => void {
  listeners.add(listener);
  listener(currentStatus);
  return () => listeners.delete(listener);
}

export function getSyncStatus(): SyncStatus {
  return currentStatus;
}

export function isOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

export function syncProjectFields(projectId: string, changedFields: Partial<Project>): void {
  const existing = pendingChanges.get(projectId) || { id: projectId, updatedAt: new Date() };
  pendingChanges.set(projectId, {
    ...existing,
    ...changedFields,
    updatedAt: new Date(),
  });

  const existingTimer = debounceTimers.get(projectId);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  const timer = setTimeout(async () => {
    debounceTimers.delete(projectId);
    const changes = pendingChanges.get(projectId);
    pendingChanges.delete(projectId);
    if (changes) {
      await pushPartialToServer(changes);
    }
  }, DEBOUNCE_MS);

  debounceTimers.set(projectId, timer);
}

export function syncProject(project: Project): void {
  syncProjectFields(project.id, project);
}

async function pushPartialToServer(update: PartialProjectUpdate): Promise<boolean> {
  if (!isOnline()) {
    notifyListeners("idle", "Offline - saved locally");
    return false;
  }

  notifyListeners("syncing");

  try {
    const response = await fetch("/api/sync", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        [API_HEADERS.CLIENT_KEY]: API_HEADERS.CLIENT_VALUE,
      },
      body: JSON.stringify(update),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    notifyListeners("success", "Saved");
    return true;
  } catch (error) {
    console.error("Sync failed:", error);
    notifyListeners("error", "Sync failed - saved locally");
    return false;
  }
}

export async function fetchFromServer(): Promise<Project[] | null> {
  if (!isOnline()) {
    return null;
  }

  try {
    const response = await fetch("/api/sync", {
      headers: {
        [API_HEADERS.CLIENT_KEY]: API_HEADERS.CLIENT_VALUE,
      },
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();
    return data.projects || [];
  } catch (error) {
    console.error("Fetch failed:", error);
    return null;
  }
}

export async function initialSync(): Promise<Project[]> {
  notifyListeners("syncing");

  try {
    const [serverProjects, localProjects] = await Promise.all([
      fetchFromServer(),
      getAllProjects(),
    ]);

    if (!serverProjects) {
      notifyListeners("idle", "Using local data");
      return localProjects;
    }

    const projectMap = new Map<string, Project>();

    for (const p of serverProjects) {
      projectMap.set(p.id, p);
    }

    for (const p of localProjects) {
      if (p.id.startsWith("temp-") || !projectMap.has(p.id)) {
        projectMap.set(p.id, p);
      }
    }

    const merged = Array.from(projectMap.values());

    if (merged.length > 0) {
      await clearProjects();
      await saveProjects(merged);
    }

    notifyListeners("success", "Synced");
    return merged;
  } catch (error) {
    console.error("Initial sync error:", error);
    notifyListeners("error", "Sync failed");
    return getAllProjects();
  }
}

export async function forceSync(): Promise<boolean> {
  if (!isOnline()) {
    notifyListeners("idle", "Offline");
    return false;
  }

  notifyListeners("syncing");

  try {
    const localProjects = await getAllProjects();

    const response = await fetch("/api/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [API_HEADERS.CLIENT_KEY]: API_HEADERS.CLIENT_VALUE,
      },
      body: JSON.stringify({ projects: localProjects }),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    notifyListeners("success", "Synced");
    return true;
  } catch (error) {
    console.error("Force sync failed:", error);
    notifyListeners("error", "Sync failed");
    return false;
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    forceSync();
  });
}
