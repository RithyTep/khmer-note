"use client";

import { useCallback, memo, lazy, Suspense, useEffect, useRef } from "react";
import { signOut } from "next-auth/react";
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
import { getCachedProject } from "@/lib/cache-client";
import { UI_TEXT, DEFAULT_VALUES } from "@/lib/constants";
import { ProjectContentSkeleton } from "@/components/Skeleton";

const SearchModal = lazy(() => import("@/components/SearchModal").then(mod => ({ default: mod.SearchModal })));
const ProjectContent = lazy(() => import("@/components/ProjectContent").then(mod => ({ default: mod.ProjectContent })));

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
  const { HOME } = UI_TEXT;

  return (
    <main className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-zinc-900">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-zinc-700 dark:text-zinc-200 mb-4">
          {HOME.WELCOME}
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6">{HOME.CREATE_FIRST_NOTE}</p>
        <button
          onClick={onCreateProject}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {HOME.CREATE_NEW_NOTE}
        </button>
      </div>
    </main>
  );
});

const SelectProjectPrompt = memo(function SelectProjectPrompt() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-zinc-900">
      <div className="text-zinc-400">{UI_TEXT.HOME.SELECT_NOTE}</div>
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
  const { TOAST } = UI_TEXT;

  const handleCreateProject = useCallback(async () => {
    const tempProject = await createProject(DEFAULT_VALUES.NEW_PROJECT_TITLE, user.id);
    setCurrentProjectId(tempProject.id);
    showToast(TOAST.PROJECT_CREATED);

    createMutation.mutate(
      { title: tempProject.title, emoji: tempProject.emoji },
      {
        onSuccess: (serverProject) => {
          replaceProject(tempProject.id, {
            ...serverProject,
            content: serverProject.content as Record<string, unknown>[] | null,
            assignee: null,
          });
        },
      }
    );
  }, [createProject, user.id, setCurrentProjectId, showToast, TOAST, createMutation, replaceProject]);

  const handleDuplicateProject = useCallback(
    async (projectId: string) => {
      const project = getCachedProject(projectId) || projects.find((p) => p.id === projectId);
      if (!project) return;

      const title = `${project.title} ${DEFAULT_VALUES.DUPLICATE_SUFFIX}`;
      const content = project.content as Record<string, unknown>[] | undefined;

      const tempProject = await createProject(title, user.id, content);
      setCurrentProjectId(tempProject.id);
      showToast(TOAST.PROJECT_DUPLICATED);

      createMutation.mutate(
        { title, emoji: project.emoji, content },
        {
          onSuccess: (serverProject) => {
            replaceProject(tempProject.id, {
              ...serverProject,
              content: serverProject.content as Record<string, unknown>[] | null,
              assignee: null,
            });
          },
        }
      );
    },
    [projects, createProject, user.id, setCurrentProjectId, showToast, TOAST, createMutation, replaceProject]
  );

  const handleRenameProject = useCallback(
    (projectId: string) => {
      setCurrentProjectId(projectId);
      showToast(TOAST.CLICK_TO_RENAME);
    },
    [setCurrentProjectId, showToast, TOAST]
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

      showToast(TOAST.PROJECT_DELETED);
    },
    [deleteProject, currentProjectId, projects, setCurrentProjectId, deleteMutation, showToast, TOAST]
  );

  const handleFavorite = useCallback(
    async (projectId: string) => {
      await toggleFavorite(projectId);
      const project = projects.find((p) => p.id === projectId);
      showToast(project?.isFavorite ? TOAST.REMOVED_FROM_FAVORITES : TOAST.ADDED_TO_FAVORITES);
    },
    [toggleFavorite, projects, showToast, TOAST]
  );

  const handleSearchSelect = useCallback(
    (id: string) => {
      setCurrentProjectId(id);
      setSearchOpen(false);
    },
    [setCurrentProjectId, setSearchOpen]
  );

  const handleSignOut = useCallback(() => {
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
    <div className="flex w-full h-full overflow-hidden">
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
