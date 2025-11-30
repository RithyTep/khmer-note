"use client";

import { useCallback, memo, lazy, Suspense, useEffect, useRef } from "react";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Sidebar } from "@/components/Sidebar";
import { Toast } from "@/components/Toast";
import {
  useProjectStore,
  useProjects,
  useSyncStatus,
  useUIStore,
  useSidebarState,
} from "@/store";
import { useProjectSync } from "@/hooks/useProjectSync";
import { trpc } from "@/lib/trpc";
import { useKeyboardShortcut } from "@/hooks/useClickOutside";
import { getCachedProject, clearCache } from "@/lib/cache-client";
import { clearDatabase } from "@/lib/local-db";
import { ProjectContentSkeleton } from "@/components/Skeleton";
import type { Project } from "@/types";

const SearchModal = lazy(() => import("@/components/SearchModal").then(mod => ({ default: mod.SearchModal })));
const ProjectContent = lazy(() => import("@/components/ProjectContent").then(mod => ({ default: mod.ProjectContent })));

// Helper to safely normalize content coming from the server
function normalizeProjectContent(raw: unknown): Record<string, unknown>[] | null {
  if (Array.isArray(raw)) {
    return raw as Record<string, unknown>[];
  }
  return null;
}

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface HomeClientProps {
  user: User;
  initialProjectId?: string;
}

const EmptyState = memo(function EmptyState({ onCreateProject }: { onCreateProject: () => void }) {
  const t = useTranslations("home");

  return (
    <main className="flex-1 flex flex-col items-center justify-center bg-zinc-50 text-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
      <div className="text-center max-w-md px-6 py-8 rounded-xl border border-zinc-200/80 bg-white shadow-[0_0_30px_rgba(15,23,42,0.08)] dark:border-zinc-800/60 dark:bg-zinc-900/60 dark:shadow-[0_0_40px_rgba(0,0,0,0.6)]">
        <div className="w-full h-24 mb-6 rounded-lg border border-zinc-200/80 bg-gradient-to-r from-zinc-50 via-slate-50 to-indigo-100/40 flex items-center justify-center overflow-hidden relative dark:border-zinc-800/60 dark:from-zinc-900 dark:via-zinc-900 dark:to-indigo-950/20">
          <div className="opacity-[0.08] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] absolute inset-0 dark:opacity-10" />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-8 h-8 text-zinc-400 dark:text-zinc-700"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="16" y="16" width="6" height="6" rx="1" />
            <rect x="2" y="16" width="6" height="6" rx="1" />
            <rect x="9" y="2" width="6" height="6" rx="1" />
            <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
            <path d="M12 12V8" />
          </svg>
        </div>

        <h2 className="text-2xl font-medium tracking-tight text-zinc-900 mb-3 dark:text-zinc-100">
          {t("welcome")}
        </h2>
        <p className="text-sm text-zinc-500 mb-6 dark:text-zinc-500">
          {t("createFirstNote")}
        </p>
        <button
          onClick={onCreateProject}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-xs font-medium text-white tracking-wide shadow-[0_0_16px_rgba(79,70,229,0.45)] transition-colors"
        >
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-indigo-400/20 border border-indigo-400/60 text-[10px]">
            +
          </span>
          <span>{t("createNewNote")}</span>
        </button>
      </div>
    </main>
  );
});

const SelectProjectPrompt = memo(function SelectProjectPrompt() {
  const t = useTranslations("home");
  return (
    <main className="flex-1 flex flex-col items-center justify-center bg-zinc-50 text-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
      <div className="text-center px-4 py-6 rounded-lg border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900/60">
        <p className="text-sm text-zinc-500 mb-2 dark:text-zinc-500">{t("selectNote")}</p>
        <p className="text-[11px] text-zinc-400 font-mono dark:text-zinc-600">
          ⌘K · Search notes
        </p>
      </div>
    </main>
  );
});

function SearchModalFallback() {
  return null;
}

export function HomeClient({ user, initialProjectId }: HomeClientProps) {
  const projects = useProjects();
  const syncStatus = useSyncStatus();
  const { isOpen: sidebarOpen, toggle: toggleSidebar, close: closeSidebar } = useSidebarState();
  const { isSearchOpen, setSearchOpen, toast, setToast, clearToast } = useUIStore();
  const t = useTranslations("toast");
  const tDefaults = useTranslations("defaults");

  const {
    currentProjectId,
    setCurrentProjectId,
    createProject,
    deleteProject,
    toggleFavorite,
    replaceProject,
    isLoading,
    loadProjects,
  } = useProjectStore();

  const { initialSync } = useProjectSync();
  const createMutation = trpc.project.create.useMutation();
  const deleteMutation = trpc.project.delete.useMutation();

  const initializedRef = useRef(false);

  useEffect(() => {
    if (initialProjectId && !currentProjectId) {
      setCurrentProjectId(initialProjectId);
    }
  }, [initialProjectId, currentProjectId, setCurrentProjectId]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Clean up any temp projects that may have persisted
    useProjectStore.setState((state) => ({
      projects: state.projects.filter(p => !p.id.startsWith("temp-")),
    }));

    loadProjects();
    initialSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useKeyboardShortcut("k", () => setSearchOpen(true), { meta: true });

  useEffect(() => {
    if (!currentProjectId) {
      document.title = "Camnova";
    }
  }, [currentProjectId]);

  const showToast = useCallback((message: string) => setToast(message), [setToast]);

  const handleCreateProject = useCallback(async () => {
    // Create project on server first, then add to store
    const title = tDefaults("newProjectTitle");
    const emoji = "📝";

    createMutation.mutate(
      { title, emoji },
      {
        onSuccess: (serverProject) => {
          const normalizedProject: Project = {
            ...serverProject,
            content: normalizeProjectContent(serverProject.content),
            assignee: null,
            tasks: [],
            kanbanCards: [],
            isSmallText: false,
            isFullWidth: false,
            isLocked: false,
            isPublished: false,
            publishedUrl: null,
          };
          
          // Add the server project directly to the store
          useProjectStore.setState((state) => ({
            projects: [normalizedProject, ...state.projects.filter(p => !p.id.startsWith("temp-"))],
          }));
          
          setCurrentProjectId(serverProject.id);
          showToast(t("projectCreated"));
        },
        onError: () => {
          showToast("Failed to create project");
        },
      }
    );
  }, [setCurrentProjectId, showToast, t, tDefaults, createMutation]);

  const handleDuplicateProject = useCallback(
    async (projectId: string) => {
      const project = getCachedProject(projectId) || projects.find((p) => p.id === projectId);
      if (!project) return;

      const title = `${project.title} ${tDefaults("duplicateSuffix")}`;
      const content = normalizeProjectContent(project.content);

      createMutation.mutate(
        { title, emoji: project.emoji, content: content ?? undefined },
        {
          onSuccess: (serverProject) => {
            const normalizedProject: Project = {
              ...serverProject,
              content: normalizeProjectContent(serverProject.content),
              assignee: null,
              tasks: [],
              kanbanCards: [],
              isSmallText: false,
              isFullWidth: false,
              isLocked: false,
              isPublished: false,
              publishedUrl: null,
            };
            
            useProjectStore.setState((state) => ({
              projects: [normalizedProject, ...state.projects.filter(p => !p.id.startsWith("temp-"))],
            }));
            
            setCurrentProjectId(serverProject.id);
            showToast(t("projectDuplicated"));
          },
          onError: () => {
            showToast("Failed to duplicate project");
          },
        }
      );
    },
    [projects, setCurrentProjectId, showToast, t, tDefaults, createMutation]
  );

  const handleRenameProject = useCallback(
    (projectId: string) => {
      setCurrentProjectId(projectId);
      showToast(t("clickToRename"));
    },
    [setCurrentProjectId, showToast, t]
  );

  const handleDeleteProject = useCallback(
    async (projectId: string) => {
      await deleteProject(projectId);

      if (currentProjectId === projectId) {
        const remaining = projects.filter((p) => p.id !== projectId);
        if (remaining.length > 0) {
          setCurrentProjectId(remaining[0].id);
        } else {
          setCurrentProjectId(null);
        }
      }

      if (!projectId.startsWith("temp-")) {
        deleteMutation.mutate({ id: projectId });
      }

      showToast(t("projectDeleted"));
    },
    [deleteProject, currentProjectId, projects, setCurrentProjectId, deleteMutation, showToast, t]
  );

  const handleFavorite = useCallback(
    async (projectId: string) => {
      await toggleFavorite(projectId);
      const project = projects.find((p) => p.id === projectId);
      showToast(project?.isFavorite ? t("removedFromFavorites") : t("addedToFavorites"));
    },
    [toggleFavorite, projects, showToast, t]
  );

  const handleSearchSelect = useCallback(
    (id: string) => {
      setCurrentProjectId(id);
      setSearchOpen(false);
    },
    [setCurrentProjectId, setSearchOpen]
  );

  const handleSignOut = useCallback(async () => {
    try {
      // Clear localStorage cache
      clearCache();
      
      // Clear IndexedDB
      await clearDatabase();
      
      // Clear zustand stores
      useProjectStore.persist.clearStorage();
      useUIStore.persist.clearStorage();
      
      // Reset store states
      useProjectStore.setState({
        projects: [],
        currentProjectId: null,
        currentProject: null,
        isLoading: false,
        syncStatus: "idle",
        lastSyncAt: null,
        error: null,
      });
      
      useUIStore.setState({
        isAIAssistantOpen: false,
        isSearchOpen: false,
        toast: null,
      });
    } catch (error) {
      console.error("Error clearing data on sign out:", error);
    }
    
    // Sign out regardless of cache clearing success
    signOut({ callbackUrl: "/login" });
  }, []);

  const openSearch = useCallback(() => setSearchOpen(true), [setSearchOpen]);
  const closeSearch = useCallback(() => setSearchOpen(false), [setSearchOpen]);

  const renderMainContent = () => {
    if (currentProjectId) {
      return (
        <Suspense fallback={<ProjectContentSkeleton />}>
          <ProjectContent
            projectId={currentProjectId}
            onToggleSidebar={toggleSidebar}
            onShowToast={showToast}
            user={user}
          />
        </Suspense>
      );
    }

    if (isLoading) {
      return <ProjectContentSkeleton />;
    }

    if (projects.length === 0) {
      return <EmptyState onCreateProject={handleCreateProject} />;
    }

    return <SelectProjectPrompt />;
  };

  return (
    <div className="flex w-full h-full min-h-screen overflow-hidden bg-zinc-50 text-zinc-700 font-sans dark:bg-zinc-950 dark:text-zinc-400">
      {isSearchOpen && (
        <Suspense fallback={<SearchModalFallback />}>
          <SearchModal
            isOpen={isSearchOpen}
            onClose={closeSearch}
            projects={projects}
            onSelectProject={handleSearchSelect}
          />
        </Suspense>
      )}

      <Sidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        onOpenSearch={openSearch}
        projects={projects}
        selectedProjectId={currentProjectId}
        onSelectProject={setCurrentProjectId}
        onCreateProject={handleCreateProject}
        onToggleFavorite={handleFavorite}
        onDuplicateProject={handleDuplicateProject}
        onRenameProject={handleRenameProject}
        onDeleteProject={handleDeleteProject}
        user={user}
        onSignOut={handleSignOut}
      />

      {renderMainContent()}

      <Toast message={toast} onClose={clearToast} />
    </div>
  );
}
