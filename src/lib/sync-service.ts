"use client";

import type { Project } from "@/types";
import {
  getAllProjects,
  saveProjects,
  clearProjects,
  getLastSyncTime,
  setLastSyncTime,
  getPendingChanges,
  clearPendingChanges,
  hasPendingChanges,
} from "./local-db";
import { API_HEADERS, TIMING } from "./constants";

type SyncStatus = "idle" | "syncing" | "success" | "error";
type SyncListener = (status: SyncStatus, message?: string) => void;

const listeners: Set<SyncListener> = new Set();
let syncInterval: ReturnType<typeof setInterval> | null = null;
let currentStatus: SyncStatus = "idle";

// Notify all listeners of status change
function notifyListeners(status: SyncStatus, message?: string) {
  currentStatus = status;
  listeners.forEach((listener) => listener(status, message));
}

// Add a sync status listener
export function addSyncListener(listener: SyncListener): () => void {
  listeners.add(listener);
  // Immediately notify with current status
  listener(currentStatus);
  return () => listeners.delete(listener);
}

// Get current sync status
export function getSyncStatus(): SyncStatus {
  return currentStatus;
}

// Check if sync is needed (30 minutes since last sync)
export async function needsSync(): Promise<boolean> {
  const lastSync = await getLastSyncTime();
  if (!lastSync) return true;
  return Date.now() - lastSync > TIMING.SYNC_INTERVAL_MS;
}

// Fetch projects from server
async function fetchFromServer(since?: string): Promise<{ projects: Project[]; syncedAt: string } | null> {
  try {
    const url = since ? `/api/sync?since=${encodeURIComponent(since)}` : "/api/sync";
    const response = await fetch(url, {
      headers: {
        [API_HEADERS.CLIENT_KEY]: API_HEADERS.CLIENT_VALUE,
      },
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("Failed to fetch from server:", error);
    return null;
  }
}

// Push local changes to server
async function pushToServer(projects: Project[]): Promise<{ projects: Project[]; syncedAt: string } | null> {
  try {
    const response = await fetch("/api/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [API_HEADERS.CLIENT_KEY]: API_HEADERS.CLIENT_VALUE,
      },
      body: JSON.stringify({ projects }),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("Failed to push to server:", error);
    return null;
  }
}

// Merge server projects with local projects (local wins for conflicts)
async function mergeProjects(serverProjects: Project[], localProjects: Project[]): Promise<Project[]> {
  const projectMap = new Map<string, Project>();

  // Add server projects first
  for (const project of serverProjects) {
    projectMap.set(project.id, project);
  }

  // Override with local projects (local-first approach)
  for (const project of localProjects) {
    const serverProject = projectMap.get(project.id);

    // If local project is newer or doesn't exist on server, use local
    if (!serverProject || new Date(project.updatedAt) >= new Date(serverProject.updatedAt)) {
      projectMap.set(project.id, project);
    }

    // Keep temp IDs (new local projects not yet synced)
    if (project.id.startsWith("temp-")) {
      projectMap.set(project.id, project);
    }
  }

  return Array.from(projectMap.values());
}

// Main sync function
export async function sync(force = false): Promise<boolean> {
  // Don't sync if already syncing
  if (currentStatus === "syncing") return false;

  // Don't sync if offline
  if (!isOnline()) {
    notifyListeners("idle", "Offline mode");
    return false;
  }

  // Check if sync is needed (unless forced)
  if (!force && !(await needsSync()) && !(await hasPendingChanges())) {
    return true;
  }

  notifyListeners("syncing");

  try {
    // Get local projects
    const localProjects = await getAllProjects();
    const lastSync = await getLastSyncTime();

    // Filter projects that were updated since last sync (for pushing)
    const changedProjects = lastSync
      ? localProjects.filter((p) => new Date(p.updatedAt).getTime() > lastSync)
      : localProjects;

    // If we have local changes, push them first
    if (changedProjects.length > 0) {
      const pushResult = await pushToServer(changedProjects);
      if (pushResult) {
        // Merge server response with local data (keep local changes that may have happened during sync)
        const currentLocal = await getAllProjects();
        const merged = await mergeProjects(pushResult.projects, currentLocal);
        // Only save if we have data to save (never clear without replacement)
        if (merged.length > 0) {
          await clearProjects();
          await saveProjects(merged);
        }
        await setLastSyncTime(new Date(pushResult.syncedAt).getTime());
        await clearPendingChanges();
        notifyListeners("success", "Synced successfully");
        return true;
      }
      // Push failed - keep local data, don't clear anything
      notifyListeners("error", "Sync failed - changes saved locally");
      return false;
    } else {
      // No local changes, fetch from server and merge
      const fetchResult = await fetchFromServer();
      if (fetchResult) {
        // Merge with local (in case user made changes during fetch)
        const currentLocal = await getAllProjects();
        const merged = await mergeProjects(fetchResult.projects, currentLocal);
        // Only save if we have data to save (never clear without replacement)
        if (merged.length > 0) {
          await clearProjects();
          await saveProjects(merged);
        }
        await setLastSyncTime(new Date(fetchResult.syncedAt).getTime());
        notifyListeners("success", "Synced successfully");
        return true;
      }
      // Fetch failed - keep local data as is
      notifyListeners("error", "Sync failed - using local data");
      return false;
    }
  } catch (error) {
    console.error("Sync error:", error);
    notifyListeners("error", "Sync failed - using local data");
    return false;
  }
}

// Initial sync (fetch from server and merge with local)
export async function initialSync(): Promise<boolean> {
  // Don't sync if offline
  if (!isOnline()) {
    notifyListeners("idle", "Offline mode - using local data");
    return false;
  }

  notifyListeners("syncing");

  try {
    const localProjects = await getAllProjects();
    const result = await fetchFromServer();

    if (result) {
      // Merge server data with any existing local data
      const merged = await mergeProjects(result.projects, localProjects);
      // Only clear and save if we have data (never delete local data without replacement)
      if (merged.length > 0) {
        await clearProjects();
        await saveProjects(merged);
      } else if (localProjects.length > 0) {
        // Keep local data if merge resulted in empty but we had local data
        notifyListeners("success", "Using local data");
        return true;
      }
      await setLastSyncTime(new Date(result.syncedAt).getTime());
      notifyListeners("success", "Initial sync complete");
      return true;
    }

    // Server fetch failed - keep local data
    if (localProjects.length > 0) {
      notifyListeners("idle", "Using local data");
      return true; // Return true since we have usable data
    }

    notifyListeners("error", "Initial sync failed");
    return false;
  } catch (error) {
    console.error("Initial sync error:", error);
    notifyListeners("error", "Initial sync failed - using local data");
    return false;
  }
}

// Start automatic sync interval (30 minutes)
export function startSyncInterval(): void {
  if (syncInterval) return;

  syncInterval = setInterval(() => {
    sync();
  }, TIMING.SYNC_INTERVAL_MS);

  // Also sync on visibility change (when user comes back to tab)
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        sync();
      }
    });
  }
}

// Stop automatic sync interval
export function stopSyncInterval(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

// Force sync before logout or important actions
export async function forceSyncBeforeAction(): Promise<boolean> {
  return sync(true);
}

// Check online status
export function isOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

// Listen for online/offline events
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    console.log("Back online, syncing...");
    sync(true);
  });

  window.addEventListener("offline", () => {
    console.log("Went offline");
    notifyListeners("idle", "Offline mode");
  });
}
