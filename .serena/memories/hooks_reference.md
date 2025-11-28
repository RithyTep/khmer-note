# Custom Hooks Reference

## useProjects (`src/hooks/useProject.ts`)
Manages all projects (CRUD operations).

```typescript
const { projects, loading, refetch, createProject, deleteProject } = useProjects()

// Features:
// - Loads cached projects immediately
// - Syncs with server (5-minute interval)
// - Creates temp IDs for instant feedback
// - Auto-replaces temp IDs with real IDs
```

## useProject (`src/hooks/useProject.ts`)
Fetch and update a single project.

```typescript
const { project, loading, error, refetch, updateProject, cycleStatus } = useProject(projectId)

// Features:
// - Caches fetched project IDs
// - Falls back to localStorage
// - Debounced updates
// - cycleStatus: NOT_STARTED → IN_PROGRESS → COMPLETED
```

## useProjectSelection (`src/hooks/useProjectSelection.ts`)
Manage project selection and URL sync.

```typescript
const { selectedId, selectProject, handleDelete, handleToggleFavorite, isReady } = useProjectSelection(projects)

// Features:
// - Initializes from URL (/p/[id]) or localStorage
// - Syncs to URL history
// - Handles deletion (auto-selects next)
// - Browser back/forward support
```

## useClickOutside (`src/hooks/useClickOutside.ts`)
Close menus when clicking outside.

```typescript
useClickOutside([menuRef, buttonRef], closeMenu, isOpen)
```

## useEscapeKey (`src/hooks/useClickOutside.ts`)
Close on Escape key press.

```typescript
useEscapeKey(closeMenu, isOpen)
```

## useKeyboardShortcut (`src/hooks/useClickOutside.ts`)
Register keyboard shortcuts.

```typescript
useKeyboardShortcut("k", openSearch, { meta: true }) // Cmd+K
```

## Usage Patterns

### Debounced Save
```typescript
const debouncedUpdate = useRef(
  debounce((data) => updateProject(data), 1000)
).current

const handleTitleChange = (title: string) => {
  setLocalTitle(title)
  debouncedUpdate({ title })
}
```

### Optimistic Update
```typescript
const handleToggleFavorite = (id: string) => {
  const project = projects.find(p => p.id === id)
  const newValue = !project.isFavorite
  
  // Update cache immediately
  updateCachedProject(id, { isFavorite: newValue })
  
  // Sync in background
  api.patch(`/api/projects/${id}`, { isFavorite: newValue })
  
  return newValue
}
```
