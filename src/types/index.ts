import { Status, KanbanColumn, Priority } from "@prisma/client";

export type { Status, KanbanColumn, Priority };

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  text: string;
  tag: string | null;
  checked: boolean;
  order: number;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KanbanCard {
  id: string;
  text: string;
  column: KanbanColumn;
  priority: Priority | null;
  order: number;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  title: string;
  description: string | null;
  content: Record<string, unknown>[] | null;
  emoji: string;
  cover: string | null;
  status: Status;
  dueDate: Date | null;
  isFavorite: boolean;
  isSmallText: boolean;
  isFullWidth: boolean;
  isLocked: boolean;
  isPublished: boolean;
  publishedUrl: string | null;
  userId: string;
  assigneeId: string | null;
  assignee: User | null;
  tasks: Task[];
  kanbanCards: KanbanCard[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectInput {
  title: string;
  description?: string;
  emoji?: string;
  status?: Status;
  dueDate?: string;
  assigneeId?: string;
  isFavorite?: boolean;
}

export interface UpdateProjectInput {
  title?: string;
  description?: string;
  content?: Record<string, unknown>[];
  emoji?: string;
  cover?: string | null;
  status?: Status;
  dueDate?: string | null;
  assigneeId?: string | null;
  isFavorite?: boolean;
  isSmallText?: boolean;
  isFullWidth?: boolean;
  isLocked?: boolean;
  isPublished?: boolean;
  publishedUrl?: string | null;
}

export interface CreateTaskInput {
  text: string;
  tag?: string;
  projectId: string;
}

export interface UpdateTaskInput {
  text?: string;
  tag?: string;
  checked?: boolean;
  order?: number;
}

export interface CreateKanbanCardInput {
  text: string;
  column?: KanbanColumn;
  priority?: Priority;
  projectId: string;
}

export interface UpdateKanbanCardInput {
  text?: string;
  column?: KanbanColumn;
  priority?: Priority | null;
  order?: number;
}

export interface MoveKanbanCardInput {
  column: KanbanColumn;
  order?: number;
}

export const STATUS_CONFIG = {
  NOT_STARTED: {
    text: "មិនទាន់ចាប់ផ្តើម",
    className: "bg-zinc-100 text-zinc-600 border-zinc-200",
  },
  IN_PROGRESS: {
    text: "កំពុងដំណើរការ",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  COMPLETED: {
    text: "បានបញ្ចប់",
    className: "bg-green-100 text-green-800 border-green-200",
  },
} as const;

export const KANBAN_COLUMN_CONFIG = {
  TODO: {
    name: "To Do",
    color: "bg-zinc-400",
  },
  PROGRESS: {
    name: "In Progress",
    color: "bg-blue-500",
    pulse: true,
  },
  DONE: {
    name: "Done",
    color: "bg-green-500",
  },
} as const;

export const PRIORITY_CONFIG = {
  HIGH: {
    label: "H",
    className: "bg-red-100 text-red-600",
  },
  MEDIUM: {
    label: "M",
    className: "bg-blue-100 text-blue-600",
  },
  LOW: {
    label: "L",
    className: "bg-gray-100 text-gray-600",
  },
} as const;
