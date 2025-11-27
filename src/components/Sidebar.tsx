"use client";

import {
  Search,
  Inbox,
  Settings2,
  RotateCcw,
  ChevronsUpDown,
  X,
  Plus,
  LogOut,
} from "lucide-react";
import type { Project } from "@/types";

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSearch: () => void;
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
  onReset?: () => void;
  user?: User;
  onSignOut?: () => void;
}

export function Sidebar({
  isOpen,
  onClose,
  onOpenSearch,
  projects,
  selectedProjectId,
  onSelectProject,
  onCreateProject,
  onReset,
  user,
  onSignOut,
}: SidebarProps) {
  const favoriteProjects = projects.filter((p) => p.isFavorite);
  const otherProjects = projects.filter((p) => !p.isFavorite);

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-20 md:hidden transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={`w-64 bg-zinc-50 border-r border-zinc-200 flex flex-col flex-shrink-0 transition-transform duration-300 fixed md:relative z-30 h-full select-none ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-3 flex items-center justify-between">
          <div className="flex-1 flex items-center gap-2 p-2 text-left group">
            {user?.image ? (
              <img
                src={user.image}
                alt={user.name || "User"}
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 bg-orange-500 rounded-full text-[10px] flex items-center justify-center text-white font-semibold shadow-sm">
                {user?.name?.charAt(0) || "K"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-zinc-700">
                {user?.name || "Khmer Note"}
              </p>
              <p className="text-[10px] text-zinc-400 truncate">
                {user?.email || ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-2 text-zinc-500 hover:bg-zinc-200/50 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-3 pb-2 space-y-0.5">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-zinc-500 hover:bg-zinc-200/50 hover:text-zinc-900 rounded-md transition-colors text-sm group"
          >
            <Search className="w-4 h-4 group-hover:text-zinc-800" />
            <span>ស្វែងរក</span>
            <span className="ml-auto text-[10px] text-zinc-400 border border-zinc-200 px-1 rounded">
              ⌘K
            </span>
          </button>
          <button className="w-full flex items-center gap-2 px-2 py-1.5 text-zinc-500 hover:bg-zinc-200/50 hover:text-zinc-900 rounded-md transition-colors text-sm">
            <Inbox className="w-4 h-4" />
            <span>ប្រអប់សារ</span>
          </button>
          <button className="w-full flex items-center gap-2 px-2 py-1.5 text-zinc-500 hover:bg-zinc-200/50 hover:text-zinc-900 rounded-md transition-colors text-sm">
            <Settings2 className="w-4 h-4" />
            <span>ការកំណត់</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
          {/* Favorites */}
          {favoriteProjects.length > 0 && (
            <div>
              <h3 className="px-2 text-xs font-semibold text-zinc-400 mb-1 tracking-tight">
                ចំណូលចិត្ត
              </h3>
              <div className="space-y-0.5">
                {favoriteProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => onSelectProject(project.id)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                      selectedProjectId === project.id
                        ? "bg-zinc-200/60 text-zinc-900 font-medium"
                        : "text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900"
                    }`}
                  >
                    <span className="text-base">{project.emoji}</span>
                    <span className="truncate">{project.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* All Projects */}
          <div>
            <div className="flex items-center justify-between px-2 mb-1">
              <h3 className="text-xs font-semibold text-zinc-400 tracking-tight">
                គម្រោងទាំងអស់
              </h3>
              <button
                onClick={onCreateProject}
                className="p-1 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200/50 rounded transition-colors"
                title="បង្កើតគម្រោងថ្មី"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-0.5">
              {otherProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => onSelectProject(project.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                    selectedProjectId === project.id
                      ? "bg-zinc-200/60 text-zinc-900 font-medium"
                      : "text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900"
                  }`}
                >
                  <span className="text-base">{project.emoji}</span>
                  <span className="truncate">{project.title}</span>
                </button>
              ))}
              {projects.length === 0 && (
                <p className="text-xs text-zinc-400 px-2 py-2">
                  គ្មានគម្រោងទេ
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sign Out Button */}
        {onSignOut && (
          <div className="p-3 border-t border-zinc-200">
            <button
              onClick={onSignOut}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>ចាកចេញ</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
