"use client";

import { useState, useCallback, useMemo, memo, lazy, Suspense, useEffect } from "react";
import { signOut } from "next-auth/react";
import { Sidebar } from "@/components/Sidebar";
import { Toast } from "@/components/Toast";
import { useProjects } from "@/hooks/useProject";
import { useProjectSelection } from "@/hooks/useProjectSelection";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const { projects, loading, createProject, refetch } = useProjects();
  const { selectedId, selectProject, handleDelete, handleToggleFavorite, isReady } =
    useProjectSelection({ projects, onRefetch: refetch, initialProjectId });

  useKeyboardShortcut("k", () => setSearchOpen(true), { meta: true });

  useEffect(() => {
    if (!selectedId) {
      document.title = "Camnova";
    }
  }, [selectedId]);

  const showToast = useCallback((message: string) => setToast(message), []);
  const { TOAST } = UI_TEXT;

  const handleCreateProject = useCallback(async () => {
    const project = await createProject(DEFAULT_VALUES.NEW_PROJECT_TITLE, user.id);
    selectProject(project.id);
    showToast(TOAST.PROJECT_CREATED);
  }, [createProject, user.id, selectProject, showToast, TOAST]);

  const handleDuplicateProject = useCallback(
    async (projectId: string) => {
      const project = getCachedProject(projectId) || projects.find((p) => p.id === projectId);
      if (!project) return;

      const newProject = await createProject(
        `${project.title} ${DEFAULT_VALUES.DUPLICATE_SUFFIX}`,
        user.id,
        project.content as Record<string, unknown>[] | undefined
      );
      selectProject(newProject.id);
      showToast(TOAST.PROJECT_DUPLICATED);
    },
    [projects, createProject, user.id, selectProject, showToast, TOAST]
  );

  const handleRenameProject = useCallback(
    (projectId: string) => {
      selectProject(projectId);
      showToast(TOAST.CLICK_TO_RENAME);
    },
    [selectProject, showToast, TOAST]
  );

  const handleDeleteProject = useCallback(
    (projectId: string) => {
      handleDelete(projectId);
      showToast(TOAST.PROJECT_DELETED);
    },
    [handleDelete, showToast, TOAST]
  );

  const handleFavorite = useCallback(
    async (projectId: string) => {
      const newValue = await handleToggleFavorite(projectId);
      showToast(newValue ? TOAST.ADDED_TO_FAVORITES : TOAST.REMOVED_FROM_FAVORITES);
    },
    [handleToggleFavorite, showToast, TOAST]
  );

  const handleSearchSelect = useCallback(
    (id: string) => {
      selectProject(id);
      setSearchOpen(false);
    },
    [selectProject]
  );

  const handleSignOut = useCallback(() => {
    signOut({ callbackUrl: "/login" });
  }, []);

  const toggleSidebar = useCallback(() => setSidebarOpen((prev) => !prev), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const closeToast = useCallback(() => setToast(null), []);

  const renderMainContent = () => {
    if (selectedId) {
      return (
        <Suspense fallback={<ProjectContentSkeleton />}>
          <ProjectContent
            projectId={selectedId}
            onToggleSidebar={toggleSidebar}
            onShowToast={showToast}
          />
        </Suspense>
      );
    }

    if (!isReady || loading) {
      return <ProjectContentSkeleton />;
    }

    if (projects.length === 0) {
      return <EmptyState onCreateProject={handleCreateProject} />;
    }

    return <SelectProjectPrompt />;
  };

  return (
    <>
      {searchOpen && (
        <Suspense fallback={<SearchModalFallback />}>
          <SearchModal
            isOpen={searchOpen}
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
        selectedProjectId={selectedId}
        onSelectProject={selectProject}
        onCreateProject={handleCreateProject}
        onToggleFavorite={handleFavorite}
        onDuplicateProject={handleDuplicateProject}
        onRenameProject={handleRenameProject}
        onDeleteProject={handleDeleteProject}
        user={user}
        onSignOut={handleSignOut}
      />

      {renderMainContent()}

      <Toast message={toast} onClose={closeToast} />
    </>
  );
}
