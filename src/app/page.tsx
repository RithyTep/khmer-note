"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { SearchModal } from "@/components/SearchModal";
import { ProjectContent } from "@/components/ProjectContent";
import { Toast } from "@/components/Toast";
import { useProjects } from "@/hooks/useProject";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { projects, loading, createProject, refetch } = useProjects();

  // Select first project by default
  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleCreateProject = useCallback(async () => {
    try {
      const project = await createProject("គម្រោងថ្មី");
      setSelectedProjectId(project.id);
      setToastMessage("គម្រោងថ្មីបានបង្កើត");
    } catch {
      setToastMessage("បរាជ័យក្នុងការបង្កើតគម្រោង");
    }
  }, [createProject]);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-zinc-400">កំពុងផ្ទុក...</div>
      </div>
    );
  }

  return (
    <>
      {/* Search Modal */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        projects={projects}
        onSelectProject={(id) => {
          setSelectedProjectId(id);
          setSearchOpen(false);
        }}
      />

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenSearch={() => setSearchOpen(true)}
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
        onCreateProject={handleCreateProject}
      />

      {/* Main Content */}
      {selectedProjectId ? (
        <ProjectContent
          projectId={selectedProjectId}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onShowToast={showToast}
        />
      ) : (
        <main className="flex-1 flex flex-col items-center justify-center bg-white">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-zinc-700 mb-4">
              សូមស្វាគមន៍មកកាន់ Khmer Note
            </h2>
            <p className="text-zinc-500 mb-6">
              សូមជ្រើសរើសគម្រោងពីបញ្ជីខាងឆ្វេង ឬបង្កើតគម្រោងថ្មី
            </p>
            <button
              onClick={handleCreateProject}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              បង្កើតគម្រោងថ្មី
            </button>
          </div>
        </main>
      )}

      {/* Toast */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </>
  );
}
