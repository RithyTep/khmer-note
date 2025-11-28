# Caching Strategy

## Two-Tier Caching System

### Tier 1: Server Cache (`src/lib/cache.ts`)
Next.js 16 cache directives with tag-based invalidation.

```typescript
// Cached functions
getProjectsCached(userId)      // Tags: "projects", `user-projects-${userId}`
getProjectByIdCached(id)       // Tags: "projects", `project-${id}`
getTasksByProjectCached(id)    // Tags: "tasks", `tasks-${projectId}`
getKanbanCardsByProjectCached(id) // Tags: "kanban", `kanban-${projectId}`
```

### Tier 2: Client Cache (`src/lib/cache-client.ts`)
localStorage for instant UI responsiveness.

```typescript
// Cache keys
"khmer-note-projects-cache"    // All projects
"khmer-note-project-{id}"      // Individual project
"khmer-note-last-project"      // Last selected project
"khmer-note-last-sync"         // Sync timestamp
"khmer-note-session-synced"    // Session flag (sessionStorage)
```

## Cache Invalidation (`src/lib/revalidate.ts`)

```typescript
// Invalidation functions
revalidateProjects()           // Clears all project tags
revalidateProject(id)          // Clears specific project
revalidateTasks(projectId)     // Clears tasks + parent project
revalidateKanban(projectId)    // Clears kanban + parent project
```

## Sync Strategy
```typescript
const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

needsSync()    // Returns true if > 5 minutes since last sync
markSynced()   // Sets session sync flag
```

## Optimistic Updates Pattern
```typescript
// 1. Update local state immediately
setProject(updated)
setCachedProject(updated)

// 2. Sync with server in background
api.patch(`/api/projects/${id}`, data).catch(console.error)

// 3. Server revalidates cache tags
revalidateProject(id)
```

## Performance Benefits
- Instant UI feedback (localStorage)
- Reduced API calls (sync interval)
- Granular invalidation (tag-based)
- Session-aware syncing (prevents duplicate fetches)
