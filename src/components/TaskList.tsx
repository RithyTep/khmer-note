"use client";

import { useState, KeyboardEvent } from "react";
import { Plus, Trash2, Check } from "lucide-react";
import type { Task } from "@/types";

interface TaskListProps {
  tasks: Task[];
  onAddTask: (text: string) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

export function TaskList({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
}: TaskListProps) {
  const [newTaskText, setNewTaskText] = useState("");

  const completedCount = tasks.filter((t) => t.checked).length;

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newTaskText.trim()) {
      onAddTask(newTaskText.trim());
      setNewTaskText("");
    }
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-800">
          កិច្ចការត្រូវធ្វើ
        </h2>
        <span className="text-xs text-zinc-400 font-medium px-2 py-0.5 bg-zinc-100 rounded-full">
          {completedCount}/{tasks.length}
        </span>
      </div>

      <div className="space-y-0.5 mb-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="group flex items-start gap-3 py-1.5 hover:bg-zinc-50 -mx-2 px-2 rounded cursor-pointer animate-fade-in transition-all duration-200"
          >
            <div
              className="custom-checkbox flex items-center mt-1 relative"
              onClick={() => onToggleTask(task.id)}
            >
              <div
                className={`w-4 h-4 border rounded flex items-center justify-center transition-colors cursor-pointer ${
                  task.checked
                    ? "border-blue-600 bg-blue-600"
                    : "border-zinc-300 hover:border-zinc-400"
                }`}
              >
                {task.checked && <Check className="w-3 h-3 text-white" />}
              </div>
            </div>
            <div
              className="flex-1 min-w-0 flex items-center gap-2 flex-wrap"
              onClick={() => onToggleTask(task.id)}
            >
              <span
                className={`text-sm transition-colors select-none ${
                  task.checked ? "text-zinc-400 line-through" : "text-zinc-800"
                }`}
              >
                {task.text}
              </span>
              {task.tag && (
                <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-zinc-100 text-zinc-500">
                  {task.tag}
                </span>
              )}
            </div>
            <button
              onClick={() => onDeleteTask(task.id)}
              className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-500 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div
        className="flex items-center gap-3 py-2 px-2 -mx-2 hover:bg-zinc-50 rounded group cursor-text"
        onClick={() =>
          document.getElementById("new-task-input")?.focus()
        }
      >
        <Plus className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
        <input
          id="new-task-input"
          type="text"
          placeholder="បន្ថែមការងារថ្មី..."
          className="bg-transparent border-none outline-none text-sm w-full placeholder:text-zinc-400 text-zinc-800"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          onKeyPress={handleKeyPress}
        />
      </div>
    </div>
  );
}
