"use client";

import { useEffect, useRef, useState } from "react";
import { Search, FileText, Users } from "lucide-react";
import type { Project } from "@/types";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onSelectProject: (projectId: string) => void;
}

export function SearchModal({
  isOpen,
  onClose,
  projects,
  onSelectProject,
}: SearchModalProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const filteredProjects = projects.filter((p) =>
    p.title.toLowerCase().includes(query.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-start justify-center pt-[20vh]"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-zinc-200 overflow-hidden animate-modal mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-zinc-100 gap-3">
          <Search className="w-5 h-5 text-zinc-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="ស្វែងរកឯកសារ កិច្ចការ ឬក្រុម..."
            className="flex-1 text-sm outline-none placeholder:text-zinc-400 h-6"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className="text-[10px] bg-zinc-100 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-200">
            ESC
          </span>
        </div>
        <div className="py-2 text-sm max-h-64 overflow-y-auto">
          <div className="px-4 py-2 text-xs font-semibold text-zinc-400">
            {query ? "លទ្ធផលស្វែងរក" : "លទ្ធផលថ្មីៗ"}
          </div>
          {filteredProjects.length === 0 ? (
            <div className="px-4 py-4 text-zinc-400 text-center">
              រកមិនឃើញ
            </div>
          ) : (
            filteredProjects.map((project) => (
              <button
                key={project.id}
                className="w-full text-left px-4 py-2 hover:bg-zinc-50 flex items-center gap-3 group"
                onClick={() => {
                  onSelectProject(project.id);
                  onClose();
                  setQuery("");
                }}
              >
                <FileText className="w-4 h-4 text-zinc-400 group-hover:text-zinc-700" />
                <span className="truncate">{project.title}</span>
                {project.isFavorite && (
                  <span className="text-yellow-500 text-xs">★</span>
                )}
              </button>
            ))
          )}
        </div>
        <div className="bg-zinc-50 px-4 py-2 border-t border-zinc-100 text-xs text-zinc-400 flex justify-between">
          <span>ស្វែងរកកម្រិតខ្ពស់</span>
          <span>Khmer Note</span>
        </div>
      </div>
    </div>
  );
}
