# Database Schema Reference

## Authentication Models (NextAuth)

### Account (`accounts`)
```prisma
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}
```

### Session (`sessions`)
```prisma
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### VerificationToken (`verification_tokens`)
```prisma
model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}
```

## Core Models

### User (`users`)
```prisma
model User {
  id               String    @id @default(cuid())
  name             String?
  email            String?   @unique
  emailVerified    DateTime?
  image            String?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  accounts         Account[]
  sessions         Session[]
  projects         Project[]              // Owned projects
  assignedProjects Project[] @relation("AssignedProjects")
  aiChats          AiChat[]
}
```

### Project (`projects`)
```prisma
model Project {
  id          String       @id @default(cuid())
  title       String
  description String?
  content     Json?        // BlockNote editor content (array of blocks)
  emoji       String       @default("📝")
  cover       String?      // Cover image URL or gradient
  status      Status       @default(NOT_STARTED)
  dueDate     DateTime?
  isFavorite  Boolean      @default(false)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  userId      String                      // Owner FK
  owner       User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  assigneeId  String?                     // Optional assignee FK
  assignee    User?        @relation("AssignedProjects", fields: [assigneeId], references: [id])
  tasks       Task[]                      // Cascade delete
  kanbanCards KanbanCard[]                // Cascade delete
  @@index([userId])
}
```

### Task (`tasks`)
```prisma
model Task {
  id        String   @id @default(cuid())
  text      String
  tag       String?                       // Optional tag (no default)
  checked   Boolean  @default(false)
  order     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
}
```

### KanbanCard (`kanban_cards`)
```prisma
model KanbanCard {
  id        String       @id @default(cuid())
  text      String
  column    KanbanColumn @default(TODO)
  priority  Priority?
  order     Int          @default(0)
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt
  projectId String
  project   Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
}
```

### AiChat (`ai_chats`)
```prisma
model AiChat {
  id        String      @id @default(cuid())
  title     String                        // Required title
  userId    String
  user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages  AiMessage[]
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
}
```

### AiMessage (`ai_messages`)
```prisma
model AiMessage {
  id        String   @id @default(cuid())
  role      String                        // "user" | "assistant"
  content   String   @db.Text             // Large text support
  chatId    String
  chat      AiChat   @relation(fields: [chatId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}
```

## Enums
```prisma
enum Status       { NOT_STARTED, IN_PROGRESS, COMPLETED }
enum KanbanColumn { TODO, PROGRESS, DONE }
enum Priority     { HIGH, MEDIUM, LOW }
```

## Key Relationships
- User → Projects (1:N via `owner`)
- User → AssignedProjects (1:N via `assignee`)
- Project → Tasks (1:N, cascade delete)
- Project → KanbanCards (1:N, cascade delete)
- User → AiChats → AiMessages (1:N:N, cascade delete)

## Table Mappings
| Model | Table Name |
|-------|------------|
| Account | `accounts` |
| Session | `sessions` |
| VerificationToken | `verification_tokens` |
| User | `users` |
| Project | `projects` |
| Task | `tasks` |
| KanbanCard | `kanban_cards` |
| AiChat | `ai_chats` |
| AiMessage | `ai_messages` |