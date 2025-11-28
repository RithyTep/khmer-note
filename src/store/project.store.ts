"use client";

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { Project, Task, KanbanCard } from "@/types";
import type { Status, KanbanColumn, Priority } from "@prisma/client";
import {
  getAllProjects,
  getProject,
  saveProject,
  deleteProject as deleteProjectFromDB,
  generateTempId,
  getLastProjectId as getLastProjectIdFromDB,
  setLastProjectId as setLastProjectIdToDB,
} from "@/lib/local-db";
import { DEFAULT_VALUES } from "@/lib/constants";

interface ProjectState {
  // State
  projects: Project[];
  currentProjectId: string | null;
  currentProject: Project | null;
  isLoading: boolean;
  syncStatus: "idle" | "syncing" | "success" | "error";
  lastSyncAt: string | null;
  error: string | null;

  // Project actions
  loadProjects: () => Promise<void>;
  loadProject: (id: string) => Promise<void>;
  createProject: (title: string, userId: string, content?: Record<string, unknown>[]) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  duplicateProject: (id: string, userId: string) => Promise<Project | null>;
  toggleFavorite: (id: string) => Promise<void>;
  cycleStatus: (id: string) => Promise<void>;

  // Selection
  setCurrentProjectId: (id: string | null) => void;
  getLastProjectId: () => Promise<string | null>;
  setLastProjectId: (id: string) => Promise<void>;

  // Task actions
  addTask: (projectId: string, text: string, tag?: string) => Promise<Task | null>;
  updateTask: (projectId: string, taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (projectId: string, taskId: string) => Promise<void>;
  toggleTask: (projectId: string, taskId: string) => Promise<void>;

  // Kanban actions
  addKanbanCard: (projectId: string, text: string, column?: KanbanColumn, priority?: Priority) => Promise<KanbanCard | null>;
  updateKanbanCard: (projectId: string, cardId: string, updates: Partial<KanbanCard>) => Promise<void>;
  deleteKanbanCard: (projectId: string, cardId: string) => Promise<void>;
  moveKanbanCard: (projectId: string, cardId: string, column: KanbanColumn, order?: number) => Promise<void>;

  // Sync
  setSyncStatus: (status: "idle" | "syncing" | "success" | "error") => void;
  setProjects: (projects: Project[]) => void;
  replaceProject: (tempId: string, serverProject: Project) => Promise<void>;
}

const STATUS_CYCLE: Status[] = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"];

export const useProjectStore = create<ProjectState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        projects: [],
        currentProjectId: null,
        currentProject: null,
        isLoading: false,
        syncStatus: "idle",
        lastSyncAt: null,
        error: null,

        // Load all projects from local DB
        loadProjects: async () => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const projects = await getAllProjects();
            set((state) => {
              state.projects = projects;
              state.isLoading = false;
            });
          } catch (err) {
            set((state) => {
              state.error = err instanceof Error ? err.message : "Failed to load projects";
              state.isLoading = false;
            });
          }
        },

        // Load single project
        loadProject: async (id: string) => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const project = await getProject(id);
            set((state) => {
              state.currentProject = project;
              state.currentProjectId = id;
              state.isLoading = false;
            });
          } catch (err) {
            set((state) => {
              state.error = err instanceof Error ? err.message : "Failed to load project";
              state.isLoading = false;
            });
          }
        },

        // Create new project
        createProject: async (title: string, userId: string, content?: Record<string, unknown>[]) => {
          const newProject: Project = {
            id: generateTempId(),
            title,
            description: null,
            content: content ?? null,
            emoji: DEFAULT_VALUES.EMOJI,
            cover: null,
            status: "NOT_STARTED",
            dueDate: null,
            isFavorite: false,
            userId,
            assigneeId: null,
            assignee: null,
            tasks: [],
            kanbanCards: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          set((state) => {
            state.projects.unshift(newProject);
          });

          await saveProject(newProject);
          await setLastProjectIdToDB(newProject.id);

          return newProject;
        },

        // Update project
        updateProject: async (id: string, data: Partial<Project>) => {
          const { projects, currentProject } = get();
          const projectIndex = projects.findIndex((p) => p.id === id);

          if (projectIndex === -1) return;

          const updated: Project = {
            ...projects[projectIndex],
            ...data,
            updatedAt: new Date(),
          };

          set((state) => {
            state.projects[projectIndex] = updated;
            if (state.currentProject?.id === id) {
              state.currentProject = updated;
            }
          });

          await saveProject(updated);
        },

        // Delete project
        deleteProject: async (id: string) => {
          set((state) => {
            state.projects = state.projects.filter((p) => p.id !== id);
            if (state.currentProject?.id === id) {
              state.currentProject = null;
              state.currentProjectId = null;
            }
          });

          await deleteProjectFromDB(id);
        },

        // Duplicate project
        duplicateProject: async (id: string, userId: string) => {
          const original = await getProject(id);
          if (!original) return null;

          const duplicated: Project = {
            ...original,
            id: generateTempId(),
            title: `${original.title} (ច្បាប់ចម្លង)`,
            createdAt: new Date(),
            updatedAt: new Date(),
            tasks: original.tasks.map((t) => ({ ...t, id: generateTempId() })),
            kanbanCards: original.kanbanCards.map((c) => ({ ...c, id: generateTempId() })),
          };

          set((state) => {
            state.projects.unshift(duplicated);
          });

          await saveProject(duplicated);
          return duplicated;
        },

        // Toggle favorite
        toggleFavorite: async (id: string) => {
          const { projects } = get();
          const project = projects.find((p) => p.id === id);
          if (!project) return;

          const updated = {
            ...project,
            isFavorite: !project.isFavorite,
            updatedAt: new Date(),
          };

          set((state) => {
            const idx = state.projects.findIndex((p) => p.id === id);
            if (idx !== -1) state.projects[idx] = updated;
            if (state.currentProject?.id === id) {
              state.currentProject = updated;
            }
          });

          await saveProject(updated);
        },

        // Cycle status
        cycleStatus: async (id: string) => {
          const { projects } = get();
          const project = projects.find((p) => p.id === id);
          if (!project) return;

          const currentIdx = STATUS_CYCLE.indexOf(project.status);
          const nextStatus = STATUS_CYCLE[(currentIdx + 1) % STATUS_CYCLE.length];

          await get().updateProject(id, { status: nextStatus });
        },

        // Selection
        setCurrentProjectId: (id: string | null) => {
          set((state) => {
            state.currentProjectId = id;
            if (id) {
              const project = state.projects.find((p) => p.id === id);
              state.currentProject = project ?? null;
            } else {
              state.currentProject = null;
            }
          });

          // Update URL
          if (typeof window !== "undefined") {
            const url = id ? `/p/${id}` : "/";
            window.history.pushState(null, "", url);
          }

          // Persist last project ID
          if (id) {
            setLastProjectIdToDB(id);
          }
        },

        getLastProjectId: async () => {
          return getLastProjectIdFromDB();
        },

        setLastProjectId: async (id: string) => {
          await setLastProjectIdToDB(id);
        },

        // Task actions
        addTask: async (projectId: string, text: string, tag?: string) => {
          const { projects } = get();
          const project = projects.find((p) => p.id === projectId);
          if (!project) return null;

          const maxOrder = project.tasks.length > 0
            ? Math.max(...project.tasks.map((t) => t.order))
            : -1;

          const newTask: Task = {
            id: generateTempId(),
            text,
            tag: tag ?? "New",
            checked: false,
            order: maxOrder + 1,
            projectId,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const updated = {
            ...project,
            tasks: [...project.tasks, newTask],
            updatedAt: new Date(),
          };

          set((state) => {
            const idx = state.projects.findIndex((p) => p.id === projectId);
            if (idx !== -1) state.projects[idx] = updated;
            if (state.currentProject?.id === projectId) {
              state.currentProject = updated;
            }
          });

          await saveProject(updated);
          return newTask;
        },

        updateTask: async (projectId: string, taskId: string, updates: Partial<Task>) => {
          const { projects } = get();
          const project = projects.find((p) => p.id === projectId);
          if (!project) return;

          const taskIndex = project.tasks.findIndex((t) => t.id === taskId);
          if (taskIndex === -1) return;

          const updatedTasks = [...project.tasks];
          updatedTasks[taskIndex] = {
            ...updatedTasks[taskIndex],
            ...updates,
            updatedAt: new Date(),
          };

          const updated = {
            ...project,
            tasks: updatedTasks,
            updatedAt: new Date(),
          };

          set((state) => {
            const idx = state.projects.findIndex((p) => p.id === projectId);
            if (idx !== -1) state.projects[idx] = updated;
            if (state.currentProject?.id === projectId) {
              state.currentProject = updated;
            }
          });

          await saveProject(updated);
        },

        deleteTask: async (projectId: string, taskId: string) => {
          const { projects } = get();
          const project = projects.find((p) => p.id === projectId);
          if (!project) return;

          const updated = {
            ...project,
            tasks: project.tasks.filter((t) => t.id !== taskId),
            updatedAt: new Date(),
          };

          set((state) => {
            const idx = state.projects.findIndex((p) => p.id === projectId);
            if (idx !== -1) state.projects[idx] = updated;
            if (state.currentProject?.id === projectId) {
              state.currentProject = updated;
            }
          });

          await saveProject(updated);
        },

        toggleTask: async (projectId: string, taskId: string) => {
          const { projects } = get();
          const project = projects.find((p) => p.id === projectId);
          if (!project) return;

          const task = project.tasks.find((t) => t.id === taskId);
          if (task) {
            await get().updateTask(projectId, taskId, { checked: !task.checked });
          }
        },

        // Kanban actions
        addKanbanCard: async (projectId: string, text: string, column: KanbanColumn = "TODO", priority?: Priority) => {
          const { projects } = get();
          const project = projects.find((p) => p.id === projectId);
          if (!project) return null;

          const cardsInColumn = project.kanbanCards.filter((c) => c.column === column);
          const maxOrder = cardsInColumn.length > 0
            ? Math.max(...cardsInColumn.map((c) => c.order))
            : -1;

          const newCard: KanbanCard = {
            id: generateTempId(),
            text,
            column,
            priority: priority ?? null,
            order: maxOrder + 1,
            projectId,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const updated = {
            ...project,
            kanbanCards: [...project.kanbanCards, newCard],
            updatedAt: new Date(),
          };

          set((state) => {
            const idx = state.projects.findIndex((p) => p.id === projectId);
            if (idx !== -1) state.projects[idx] = updated;
            if (state.currentProject?.id === projectId) {
              state.currentProject = updated;
            }
          });

          await saveProject(updated);
          return newCard;
        },

        updateKanbanCard: async (projectId: string, cardId: string, updates: Partial<KanbanCard>) => {
          const { projects } = get();
          const project = projects.find((p) => p.id === projectId);
          if (!project) return;

          const cardIndex = project.kanbanCards.findIndex((c) => c.id === cardId);
          if (cardIndex === -1) return;

          const updatedCards = [...project.kanbanCards];
          updatedCards[cardIndex] = {
            ...updatedCards[cardIndex],
            ...updates,
            updatedAt: new Date(),
          };

          const updated = {
            ...project,
            kanbanCards: updatedCards,
            updatedAt: new Date(),
          };

          set((state) => {
            const idx = state.projects.findIndex((p) => p.id === projectId);
            if (idx !== -1) state.projects[idx] = updated;
            if (state.currentProject?.id === projectId) {
              state.currentProject = updated;
            }
          });

          await saveProject(updated);
        },

        deleteKanbanCard: async (projectId: string, cardId: string) => {
          const { projects } = get();
          const project = projects.find((p) => p.id === projectId);
          if (!project) return;

          const updated = {
            ...project,
            kanbanCards: project.kanbanCards.filter((c) => c.id !== cardId),
            updatedAt: new Date(),
          };

          set((state) => {
            const idx = state.projects.findIndex((p) => p.id === projectId);
            if (idx !== -1) state.projects[idx] = updated;
            if (state.currentProject?.id === projectId) {
              state.currentProject = updated;
            }
          });

          await saveProject(updated);
        },

        moveKanbanCard: async (projectId: string, cardId: string, column: KanbanColumn, order?: number) => {
          await get().updateKanbanCard(projectId, cardId, { column, order });
        },

        // Sync helpers
        setSyncStatus: (status) => {
          set((state) => {
            state.syncStatus = status;
            if (status === "success") {
              state.lastSyncAt = new Date().toISOString();
            }
          });
        },

        setProjects: (projects) => {
          set((state) => {
            state.projects = projects;
          });
        },

        replaceProject: async (tempId, serverProject) => {
          const { currentProjectId, projects } = get();
          const localProject = projects.find((p) => p.id === tempId);

          const mergedProject: Project = {
            ...serverProject,
            title: localProject?.title ?? serverProject.title,
            content: localProject?.content ?? serverProject.content,
            description: localProject?.description ?? serverProject.description,
            tasks: localProject?.tasks ?? serverProject.tasks ?? [],
            kanbanCards: localProject?.kanbanCards ?? serverProject.kanbanCards ?? [],
            assignee: null,
          };

          set((state) => {
            const index = state.projects.findIndex((p) => p.id === tempId);
            if (index !== -1) {
              state.projects[index] = mergedProject;
            }
            if (currentProjectId === tempId) {
              state.currentProjectId = serverProject.id;
              state.currentProject = mergedProject;
            }
          });

          await deleteProjectFromDB(tempId);
          await saveProject(mergedProject);
          if (currentProjectId === tempId) {
            await setLastProjectIdToDB(serverProject.id);
          }
        },
      })),
      {
        name: "khmer-note-project-store",
        partialize: (state) => ({
          currentProjectId: state.currentProjectId,
          lastSyncAt: state.lastSyncAt,
        }),
      }
    ),
    { name: "ProjectStore" }
  )
);

// Selector hooks for optimized re-renders
export const useProjects = () => useProjectStore((state) => state.projects);
export const useCurrentProject = () => useProjectStore((state) => state.currentProject);
export const useProjectLoading = () => useProjectStore((state) => state.isLoading);
export const useSyncStatus = () => useProjectStore((state) => state.syncStatus);
