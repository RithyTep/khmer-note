# Khmer Note (កម្មវិធីចំណាំខ្មែរ)

## Purpose
A full-stack note-taking application with Khmer language support. Allows users to create projects/notes with rich text editing, task lists, and kanban boards.

## Key Features
- Project/Note Management with BlockNote rich text editor
- Task Lists (checklist items with tags)
- Kanban Board (TODO, In Progress, Done columns)
- User Authentication (Google OAuth via NextAuth.js)
- Favorites system
- Search functionality (⌘K / Ctrl+K)
- Khmer language UI

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Frontend**: React 19
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL
- **ORM**: Prisma 6.x
- **Authentication**: NextAuth.js v5 (beta) with Prisma Adapter
- **Rich Text Editor**: BlockNote
- **UI Components**: Mantine, Lucide React icons
- **Package Manager**: pnpm

## Database Models
- `User` - NextAuth user with OAuth accounts
- `Project` - Main document/note entity (title, content, emoji, status, dueDate, isFavorite)
- `Task` - Checklist items belonging to projects
- `KanbanCard` - Kanban board cards with columns and priorities

## Enums
- `Status`: NOT_STARTED, IN_PROGRESS, COMPLETED
- `KanbanColumn`: TODO, PROGRESS, DONE
- `Priority`: HIGH, MEDIUM, LOW
