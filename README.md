# Khmer Note (កម្មវិធីចំណាំខ្មែរ)

A full-stack note-taking application with Khmer language support, built with Next.js, Prisma, and PostgreSQL.

## Features

- **Project Management**: Create and manage multiple projects
- **Task Lists**: Add, toggle, and delete tasks with tags
- **Kanban Board**: Visual workflow with TODO, In Progress, and Done columns
- **User Assignment**: Assign projects to team members
- **Status Tracking**: Track project status (Not Started, In Progress, Completed)
- **Favorites**: Mark projects as favorites for quick access
- **Search**: Quick search across all projects (⌘K / Ctrl+K)
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Icons**: Lucide React

## Prerequisites

- Node.js 18+
- PostgreSQL database
- pnpm (recommended) or npm

## Getting Started

### 1. Clone and Install

```bash
cd khmer-note
pnpm install
```

### 2. Configure Database

Create a `.env` file (copy from `.env.example`):

```bash
cp .env.example .env
```

Update the `DATABASE_URL` in `.env` with your PostgreSQL connection string:

```
DATABASE_URL="postgresql://username:password@localhost:5432/khmer_note?schema=public"
```

### 3. Setup Database

Generate Prisma client and push the schema:

```bash
pnpm db:generate
pnpm db:push
```

### 4. Seed Database (Optional)

Add sample data:

```bash
pnpm db:seed
```

### 5. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:push` | Push schema to database |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm db:seed` | Seed database with sample data |

## API Endpoints

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create a project
- `GET /api/projects/[id]` - Get a project
- `PATCH /api/projects/[id]` - Update a project
- `DELETE /api/projects/[id]` - Delete a project

### Tasks
- `GET /api/tasks?projectId=xxx` - List tasks for a project
- `POST /api/tasks` - Create a task
- `PATCH /api/tasks/[id]` - Update a task
- `DELETE /api/tasks/[id]` - Delete a task

### Kanban Cards
- `GET /api/kanban?projectId=xxx` - List kanban cards
- `POST /api/kanban` - Create a kanban card
- `PATCH /api/kanban/[id]` - Update a kanban card
- `DELETE /api/kanban/[id]` - Delete a kanban card
- `DELETE /api/kanban?projectId=xxx` - Reset kanban board

### Users
- `GET /api/users` - List all users
- `POST /api/users` - Create a user

## Database Schema

```prisma
model User {
  id        String    @id @default(cuid())
  name      String
  avatar    String
  projects  Project[]
}

model Project {
  id          String       @id @default(cuid())
  title       String
  description String?
  emoji       String       @default("💻")
  status      Status       @default(IN_PROGRESS)
  dueDate     DateTime?
  isFavorite  Boolean      @default(false)
  assignee    User?
  tasks       Task[]
  kanbanCards KanbanCard[]
}

model Task {
  id        String  @id @default(cuid())
  text      String
  tag       String?
  checked   Boolean @default(false)
  order     Int     @default(0)
  project   Project
}

model KanbanCard {
  id       String       @id @default(cuid())
  text     String
  column   KanbanColumn @default(TODO)
  priority Priority?
  order    Int          @default(0)
  project  Project
}
```

## License

MIT
