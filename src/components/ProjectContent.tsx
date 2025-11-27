"use client";

import { useRef } from "react";
import { Menu, MoreHorizontal, Calendar, CircleDashed, Star } from "lucide-react";
import { useProject } from "@/hooks/useProject";
import { TaskList } from "./TaskList";
import { KanbanBoard } from "./KanbanBoard";
import { STATUS_CONFIG } from "@/types";

interface ProjectContentProps {
  projectId: string;
  onToggleSidebar: () => void;
  onShowToast: (message: string) => void;
}

export function ProjectContent({
  projectId,
  onToggleSidebar,
  onShowToast,
}: ProjectContentProps) {
  const {
    project,
    loading,
    updateProject,
    cycleStatus,
    addTask,
    toggleTask,
    deleteTask,
    addKanbanCard,
    updateKanbanCard,
    deleteKanbanCard,
    moveKanbanCard,
    resetKanban,
  } = useProject(projectId);

  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLDivElement>(null);

  // Debounced save for title and description
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTitleChange = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      const newTitle = titleRef.current?.innerText || "";
      if (newTitle && newTitle !== project?.title) {
        updateProject({ title: newTitle });
      }
    }, 500);
  };

  const handleDescChange = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      const newDesc = descRef.current?.innerText || "";
      if (newDesc !== project?.description) {
        updateProject({ description: newDesc });
      }
    }, 500);
  };

  // All handlers are now synchronous - no await!
  const handleStatusCycle = () => {
    cycleStatus();
    onShowToast("ស្ថានភាពបានផ្លាស់ប្តូរ");
  };

  const handleDateChange = (date: string) => {
    updateProject({ dueDate: date || null });
    onShowToast("កាលបរិច្ឆេទបានផ្លាស់ប្តូរ");
  };

  const handleToggleFavorite = () => {
    updateProject({ isFavorite: !project?.isFavorite });
    onShowToast(project?.isFavorite ? "បានដកចេញពីចំណូលចិត្ត" : "បានបន្ថែមទៅចំណូលចិត្ត");
  };

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center bg-white">
        <div className="text-zinc-400">កំពុងផ្ទុក...</div>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="flex-1 flex items-center justify-center bg-white">
        <div className="text-zinc-400">សូមជ្រើសរើសគម្រោង</div>
      </main>
    );
  }

  const statusConfig = STATUS_CONFIG[project.status];
  const formattedDate = project.dueDate
    ? new Date(project.dueDate).toLocaleDateString("km-KH", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "គ្មាន";

  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden bg-white relative">
      {/* Top Navigation */}
      <header className="h-12 border-b border-zinc-100 flex items-center justify-between px-4 flex-shrink-0 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <button
            onClick={onToggleSidebar}
            className="md:hidden mr-1 hover:bg-zinc-100 p-1 rounded text-zinc-700"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="hover:text-zinc-800 transition-colors cursor-pointer">
            គម្រោង
          </span>
          <span className="text-zinc-300">/</span>
          <span className="text-zinc-800 font-medium truncate max-w-[200px]">
            {project.title}
          </span>
        </div>
        <div className="flex items-center gap-1 sm:gap-3">
          <button
            onClick={handleToggleFavorite}
            className={`p-1.5 rounded transition-colors ${
              project.isFavorite
                ? "text-yellow-500 hover:text-yellow-600"
                : "text-zinc-400 hover:text-zinc-600"
            }`}
            title={project.isFavorite ? "ដកចេញពីចំណូលចិត្ត" : "បន្ថែមទៅចំណូលចិត្ត"}
          >
            <Star className={`w-4 h-4 ${project.isFavorite ? "fill-current" : ""}`} />
          </button>
          <span className="text-xs text-zinc-400 hidden sm:block">
            កែប្រែចុងក្រោយ{" "}
            <span>
              {new Date(project.updatedAt).toLocaleTimeString("km-KH", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </span>
          <button className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 rounded transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Page Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-12 md:py-16">
          {/* Title Area */}
          <div className="group relative mb-8">
            <div className="mb-4 inline-flex items-center justify-center w-16 h-16 text-4xl hover:bg-zinc-50 border border-transparent hover:border-zinc-200 rounded-lg cursor-pointer transition-all select-none">
              {project.emoji}
            </div>
            <h1
              ref={titleRef}
              className="text-4xl font-bold tracking-tight text-zinc-900 mb-2 outline-none placeholder:text-zinc-300 border-none bg-transparent w-full"
              contentEditable
              suppressContentEditableWarning
              spellCheck={false}
              onInput={handleTitleChange}
            >
              {project.title}
            </h1>
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-[120px_1fr] gap-y-2 gap-x-4 mb-10 text-sm">
            {/* Status */}
            <div className="flex items-center gap-2 text-zinc-500 h-7">
              <CircleDashed className="w-4 h-4" />
              <span>ស្ថានភាព</span>
            </div>
            <div className="flex items-center h-7">
              <button
                onClick={handleStatusCycle}
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border hover:opacity-80 transition-opacity select-none ${statusConfig.className}`}
              >
                {statusConfig.text}
              </button>
            </div>

            {/* Due Date */}
            <div className="flex items-center gap-2 text-zinc-500 h-7">
              <Calendar className="w-4 h-4" />
              <span>កាលបរិច្ឆេទ</span>
            </div>
            <div className="flex items-center h-7 relative group w-fit">
              <div className="flex items-center text-zinc-700 hover:bg-zinc-100 py-1 px-1.5 rounded -ml-1.5 cursor-pointer transition-colors z-0 pointer-events-none">
                <span>{formattedDate}</span>
              </div>
              <input
                type="date"
                value={
                  project.dueDate
                    ? new Date(project.dueDate).toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) => handleDateChange(e.target.value)}
                className="absolute inset-0 opacity-0 z-10 cursor-pointer w-full"
              />
            </div>
          </div>

          <hr className="border-zinc-200 mb-8" />

          {/* Content Area */}
          <div className="space-y-6 text-base leading-7 text-zinc-800">
            {/* Editable Description */}
            <div className="group relative pl-3 border-l-2 border-transparent hover:border-zinc-200 transition-colors">
              <h2 className="text-xl font-semibold tracking-tight mb-2">
                គោលបំណង
              </h2>
              <div
                ref={descRef}
                contentEditable
                suppressContentEditableWarning
                className="text-zinc-600 outline-none min-h-[1.5em]"
                onInput={handleDescChange}
                data-placeholder="សរសេរការពិពណ៌នាអំពីគម្រោងនៅទីនេះ..."
              >
                {project.description || ""}
              </div>
            </div>

            {/* Tasks - all callbacks are now sync */}
            <TaskList
              tasks={project.tasks}
              onAddTask={(text) => {
                addTask({ text });
                onShowToast("កិច្ចការថ្មីបានបង្កើត");
              }}
              onToggleTask={(taskId) => {
                toggleTask(taskId);
              }}
              onDeleteTask={(taskId) => {
                deleteTask(taskId);
                onShowToast("បានលុបកិច្ចការ");
              }}
            />

            {/* Kanban Board - all callbacks are now sync */}
            <KanbanBoard
              cards={project.kanbanCards}
              onAddCard={(column, text) => {
                addKanbanCard({ text, column });
              }}
              onUpdateCard={(cardId, text) => {
                updateKanbanCard(cardId, { text });
              }}
              onDeleteCard={(cardId) => {
                deleteKanbanCard(cardId);
              }}
              onMoveCard={(cardId, direction) => {
                moveKanbanCard(cardId, direction);
                onShowToast("កាតត្រូវបានផ្លាស់ទី");
              }}
              onResetBoard={() => {
                resetKanban();
                onShowToast("បានកំណត់ Kanban ឡើងវិញ");
              }}
            />
          </div>

          <div className="h-32" />
        </div>
      </div>
    </main>
  );
}
