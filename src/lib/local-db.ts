"use client";

import type { Project, Task, KanbanCard } from "@/types";

const DB_NAME = "camnova-db";
const DB_VERSION = 1;
const STORES = {
  projects: "projects",
  pendingChanges: "pending-changes",
  metadata: "metadata",
} as const;

type PendingChange = {
  id: string;
  type: "create" | "update" | "delete";
  entityType: "project" | "task" | "kanbanCard";
  entityId: string;
  projectId: string;
  data: unknown;
  timestamp: number;
};

type Metadata = {
  key: string;
  value: unknown;
};

let db: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (db) return Promise.resolve(db);
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not available"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      if (!database.objectStoreNames.contains(STORES.projects)) {
        const projectStore = database.createObjectStore(STORES.projects, { keyPath: "id" });
        projectStore.createIndex("userId", "userId", { unique: false });
        projectStore.createIndex("updatedAt", "updatedAt", { unique: false });
        projectStore.createIndex("isFavorite", "isFavorite", { unique: false });
      }

      if (!database.objectStoreNames.contains(STORES.pendingChanges)) {
        const changesStore = database.createObjectStore(STORES.pendingChanges, { keyPath: "id" });
        changesStore.createIndex("timestamp", "timestamp", { unique: false });
        changesStore.createIndex("projectId", "projectId", { unique: false });
      }

      if (!database.objectStoreNames.contains(STORES.metadata)) {
        database.createObjectStore(STORES.metadata, { keyPath: "key" });
      }
    };
  });

  return dbPromise;
}

export async function getAllProjects(): Promise<Project[]> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.projects, "readonly");
    const store = transaction.objectStore(STORES.projects);
    const request = store.getAll();

    request.onsuccess = () => {
      const projects = request.result || [];
      // Sort by updatedAt descending
      projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      resolve(projects);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getProject(id: string): Promise<Project | null> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.projects, "readonly");
    const store = transaction.objectStore(STORES.projects);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function saveProject(project: Project): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.projects, "readwrite");
    const store = transaction.objectStore(STORES.projects);
    const request = store.put(project);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function saveProjects(projects: Project[]): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.projects, "readwrite");
    const store = transaction.objectStore(STORES.projects);

    let completed = 0;
    const total = projects.length;

    if (total === 0) {
      resolve();
      return;
    }

    projects.forEach((project) => {
      const request = store.put(project);
      request.onsuccess = () => {
        completed++;
        if (completed === total) resolve();
      };
      request.onerror = () => reject(request.error);
    });
  });
}

export async function deleteProject(id: string): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.projects, "readwrite");
    const store = transaction.objectStore(STORES.projects);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearProjects(): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.projects, "readwrite");
    const store = transaction.objectStore(STORES.projects);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function addPendingChange(change: Omit<PendingChange, "id" | "timestamp">): Promise<void> {
  const database = await openDB();
  const fullChange: PendingChange = {
    ...change,
    id: `change-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    timestamp: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.pendingChanges, "readwrite");
    const store = transaction.objectStore(STORES.pendingChanges);
    const request = store.put(fullChange);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getPendingChanges(): Promise<PendingChange[]> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.pendingChanges, "readonly");
    const store = transaction.objectStore(STORES.pendingChanges);
    const index = store.index("timestamp");
    const request = index.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function clearPendingChanges(): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.pendingChanges, "readwrite");
    const store = transaction.objectStore(STORES.pendingChanges);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function hasPendingChanges(): Promise<boolean> {
  const changes = await getPendingChanges();
  return changes.length > 0;
}

export async function getMetadata<T>(key: string): Promise<T | null> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.metadata, "readonly");
    const store = transaction.objectStore(STORES.metadata);
    const request = store.get(key);

    request.onsuccess = () => {
      const result = request.result as Metadata | undefined;
      resolve(result ? (result.value as T) : null);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function setMetadata(key: string, value: unknown): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.metadata, "readwrite");
    const store = transaction.objectStore(STORES.metadata);
    const request = store.put({ key, value });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getLastSyncTime(): Promise<number | null> {
  return getMetadata<number>("lastSyncTime");
}

export async function setLastSyncTime(time: number): Promise<void> {
  return setMetadata("lastSyncTime", time);
}

export async function getLastProjectId(): Promise<string | null> {
  return getMetadata<string>("lastProjectId");
}

export async function setLastProjectId(id: string): Promise<void> {
  return setMetadata("lastProjectId", id);
}

export function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function isTempId(id: string): boolean {
  return id.startsWith("temp-");
}

export async function updateProjectTask(projectId: string, taskId: string, updates: Partial<Task>): Promise<void> {
  const project = await getProject(projectId);
  if (!project) return;

  const taskIndex = project.tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) return;

  project.tasks[taskIndex] = { ...project.tasks[taskIndex], ...updates, updatedAt: new Date() };
  project.updatedAt = new Date();

  await saveProject(project);
}

export async function addProjectTask(projectId: string, task: Task): Promise<void> {
  const project = await getProject(projectId);
  if (!project) return;

  project.tasks.push(task);
  project.updatedAt = new Date();

  await saveProject(project);
}

export async function deleteProjectTask(projectId: string, taskId: string): Promise<void> {
  const project = await getProject(projectId);
  if (!project) return;

  project.tasks = project.tasks.filter(t => t.id !== taskId);
  project.updatedAt = new Date();

  await saveProject(project);
}

export async function updateProjectKanbanCard(projectId: string, cardId: string, updates: Partial<KanbanCard>): Promise<void> {
  const project = await getProject(projectId);
  if (!project) return;

  const cardIndex = project.kanbanCards.findIndex(c => c.id === cardId);
  if (cardIndex === -1) return;

  project.kanbanCards[cardIndex] = { ...project.kanbanCards[cardIndex], ...updates, updatedAt: new Date() };
  project.updatedAt = new Date();

  await saveProject(project);
}

export async function addProjectKanbanCard(projectId: string, card: KanbanCard): Promise<void> {
  const project = await getProject(projectId);
  if (!project) return;

  project.kanbanCards.push(card);
  project.updatedAt = new Date();

  await saveProject(project);
}

export async function deleteProjectKanbanCard(projectId: string, cardId: string): Promise<void> {
  const project = await getProject(projectId);
  if (!project) return;

  project.kanbanCards = project.kanbanCards.filter(c => c.id !== cardId);
  project.updatedAt = new Date();

  await saveProject(project);
}
