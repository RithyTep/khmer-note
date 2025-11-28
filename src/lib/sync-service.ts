"use client";

import type { Project } from "@/types";
import { getAllProjects, saveProject as saveToLocal, getProject } from "./local-db";
import { API_HEADERS } from "./constants";

type SyncStatus = "idle" | "syncing" | "success" | "error";
type SyncListener = (status: SyncStatus, message?: string) => void;

const listeners: Set<SyncListener> = new Set();
let currentStatus: SyncStatus = "idle";

// Debounce timers per project
const debounceTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
const DEBOUNCE_MS = 2000; // 2 seconds

// Notify all listeners of status change
function notifyListeners(status: SyncStatus, message?: string) {
  currentStatus = status;
  listeners.forEach((listener) => listener(status, message));
}

// Add a sync status listener
export function addSyncListener(listener: SyncListener): () => void {
  listeners.add(listener);
  listener(currentStatus);
  return () => listeners.delete(listener);
}

// Get current sync status
export function getSyncStatus(): SyncStatus {
  return currentStatus;
}

// Check online status
export function isOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

// Sync single project to server (debounced)
export function syncProject(project: Project): void {
  // Clear existing timer for this project
  const existingTimer = debounceTimers.get(project.id);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  // Set new debounce timer
  const timer = setTimeout(async () => {
    debounceTimers.delete(project.id);
    await pushProjectToServer(project);
  }, DEBOUNCE_MS);

  debounceTimers.set(project.id, timer);
}

// Push single project to server immediately
async function pushProjectToServer(project: Project): Promise<boolean> {
  if (!isOnline()) {
    notifyListeners("idle", "Offline - saved locally");
    return false;
  }

  notifyListeners("syncing");

  try {
    const response = await fetch("/api/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [API_HEADERS.CLIENT_KEY]: API_HEADERS.CLIENT_VALUE,
      },
      body: JSON.stringify({ projects: [project] }),
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

// Fetch all projects from server (on app load)
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

// Initial sync on app load - fetch from server, merge with local
export async function initialSync(): Promise<Project[]> {
  notifyListeners("syncing");

  try {
    const [serverProjects, localProjects] = await Promise.all([
      fetchFromServer(),
      getAllProjects(),
    ]);

    // If offline or fetch failed, use local
    if (!serverProjects) {
      notifyListeners("idle", "Using local data");
      return localProjects;
    }

    // Simple merge: server wins for same ID, keep local-only projects
    const projectMap = new Map<string, Project>();

    // Add server projects
    for (const p of serverProjects) {
      projectMap.set(p.id, p);
    }

    // Add local-only projects (temp IDs or newer)
    for (const p of localProjects) {
      if (p.id.startsWith("temp-") || !projectMap.has(p.id)) {
        projectMap.set(p.id, p);
      }
    }

    const merged = Array.from(projectMap.values());
    notifyListeners("success", "Synced");
    return merged;
  } catch (error) {
    console.error("Initial sync error:", error);
    notifyListeners("error", "Sync failed");
    return getAllProjects();
  }
}

// Force sync (push all local changes)
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

// Listen for online event to sync
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    console.log("Back online, syncing...");
    forceSync();
  });
}
