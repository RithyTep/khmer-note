# Code Style & Conventions

Universal Next.js Full-Stack Development Standards

---

## 1. TypeScript Standards

### Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2017",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

**Core Rules:**
- Strict mode enabled
- Path aliases: `@/*` maps to `./src/*`
- No `any` types (use `unknown` if type is truly unknown)
- **No comments in code** - code should be self-documenting

### No Comments Policy

```typescript
// ❌ Bad: Unnecessary comments
// Get the user's name
const userName = user.name

// Check if project exists
if (!project) return null

// Loop through all projects
projects.forEach(p => process(p))

// ✅ Good: Self-documenting code (no comments needed)
const userName = user.name

if (!project) return null

projects.forEach(p => process(p))

// ✅ Exception: Complex business logic that isn't obvious
// Rate limit: 100 requests per minute per IP, with 5-minute block after 3 violations
const RATE_LIMIT_CONFIG = { requests: 100, window: 60, blockAfter: 3 }

// ✅ Exception: TODO/FIXME for tracked issues
// TODO: Implement pagination (Issue #123)
// FIXME: Race condition when rapid saves occur

// ❌ Bad: Commented-out code (delete it, git has history)
// const oldImplementation = () => { ... }

// ❌ Bad: Redundant JSDoc for obvious functions
/**
 * Deletes a project
 * @param id - The project ID
 */
function deleteProject(id: string) { }

// ✅ Good: Just write clear code
function deleteProject(id: string) { }
```

### Type Definitions

```typescript
// ✅ Good: Explicit interfaces
interface ProjectProps {
  id: string
  title: string
  onUpdate: (data: UpdateProjectInput) => void
}

// ✅ Good: Use type for unions/intersections
type Status = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
type ProjectWithTasks = Project & { tasks: Task[] }

// ❌ Bad: Inline object types in function params
function update(data: { title: string; content: string }) {}

// ✅ Good: Named interface
function update(data: UpdateProjectInput) {}
```

### Default Model Values

```typescript
// ✅ Good: Define defaults at model/schema level (generic pattern)
const DEFAULT_USER: User = {
  id: '',
  name: '',
  email: '',
  avatar: '/default-avatar.png',
  role: 'USER',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  language: 'en',
  notifications: true,
  timezone: 'UTC',
}

// ✅ Good: Factory function for creating with defaults
function createWithDefaults<T>(defaults: T, input: Partial<T>): T {
  return { ...defaults, ...input }
}

const newUser = createWithDefaults(DEFAULT_USER, { name: 'John', email: 'john@example.com' })

// ✅ Good: Prisma schema defaults (example models)
model User {
  id        String   @id @default(cuid())
  name      String   @default("")
  email     String   @unique
  avatar    String   @default("/default-avatar.png")
  role      Role     @default(USER)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id          String   @id @default(cuid())
  title       String   @default("Untitled")
  content     String   @default("")
  slug        String   @default("")
  isPublished Boolean  @default(false)
  viewCount   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Product {
  id          String   @id @default(cuid())
  name        String   @default("")
  description String   @default("")
  price       Decimal  @default(0)
  stock       Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ✅ Good: Zod schema with defaults (reusable patterns)
const baseEntitySchema = z.object({
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
})

const createUserSchema = baseEntitySchema.extend({
  name: z.string().min(1).max(100).default(''),
  email: z.string().email(),
  avatar: z.string().default('/default-avatar.png'),
  role: z.enum(['USER', 'ADMIN', 'MODERATOR']).default('USER'),
  isActive: z.boolean().default(true),
})

const createPostSchema = baseEntitySchema.extend({
  title: z.string().min(1).max(200).default('Untitled'),
  content: z.string().default(''),
  isPublished: z.boolean().default(false),
})

// ✅ Good: Component props with defaults
interface CardProps<T> {
  data: T
  showActions?: boolean
  isEditable?: boolean
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

const defaultCardProps = {
  showActions: true,
  isEditable: false,
  onEdit: () => {},
  onDelete: () => {},
}

export function Card<T extends { id: string }>(props: CardProps<T>) {
  const { data, showActions, isEditable, onEdit, onDelete } = { ...defaultCardProps, ...props }
}

// ❌ Bad: Scattered null checks throughout code
const name = user?.name ?? ''
const avatar = user?.avatar || '/default-avatar.png'
if (!post.content) post.content = ''
```

---

## 2. File Structure & Naming

### Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API routes (REST endpoints)
│   │   ├── users/          # /api/users/*
│   │   ├── posts/          # /api/posts/*
│   │   ├── products/       # /api/products/*
│   │   ├── auth/           # /api/auth/*
│   │   └── upload/         # /api/upload
│   ├── [slug]/             # Dynamic pages
│   ├── dashboard/          # Dashboard pages
│   ├── login/              # Auth pages
│   ├── page.tsx            # Home page (server component)
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Global styles
├── components/             # React components
│   ├── ui/                 # Reusable UI components
│   ├── forms/              # Form components
│   ├── layouts/            # Layout components
│   └── features/           # Feature-specific components
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities, configs, helpers
│   ├── prisma.ts           # Prisma client singleton
│   ├── auth.ts             # Auth configuration
│   ├── cache.ts            # Server-side caching
│   ├── cache-client.ts     # Client-side caching
│   ├── api-response.ts     # HTTP response helpers
│   ├── ownership.ts        # Authorization helpers
│   ├── validation.ts       # Zod schemas
│   ├── rate-limit.ts       # Rate limiting
│   ├── utils.ts            # General utilities
│   └── constants.ts        # App constants & defaults
├── types/                  # TypeScript type definitions
│   ├── index.ts            # Shared types
│   ├── api.ts              # API types
│   └── database.ts         # Database types
└── config/                 # Configuration files
    ├── site.ts             # Site metadata
    └── nav.ts              # Navigation config
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files (routes) | kebab-case | `api/projects/[id]/route.ts` |
| Files (components) | PascalCase | `ProjectContent.tsx` |
| Files (hooks) | camelCase with `use` | `useProject.ts` |
| Files (utilities) | kebab-case | `api-response.ts` |
| React Components | PascalCase | `ProjectContent` |
| Functions | camelCase | `handleSubmit`, `fetchProjects` |
| Constants | UPPER_SNAKE_CASE | `RATE_LIMITS`, `API_HEADERS` |
| Interfaces | PascalCase | `ProjectProps`, `UpdateInput` |
| Types | PascalCase | `Status`, `KanbanColumn` |
| Enums | PascalCase (UPPER values) | `Status.NOT_STARTED` |
| Database tables | snake_case | `kanban_cards` |
| CSS classes | kebab-case | `project-content` |

---

## 3. React Component Patterns

### Component Structure

```typescript
// 1. Imports (external → internal → types → styles)
'use client'

import { useState, useCallback } from 'react'
import { Edit, Trash } from 'lucide-react'

import { useProject } from '@/hooks/useProject'
import type { Project } from '@/types'

// 2. Types/Interfaces
interface ProjectCardProps {
  project: Project
  onDelete: (id: string) => void
}

// 3. Component
export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  // 3a. Hooks (useState, useEffect, custom hooks)
  const [isEditing, setIsEditing] = useState(false)
  const { updateProject } = useProject(project.id)

  // 3b. Handlers (useCallback for passed-down functions)
  const handleDelete = useCallback(() => {
    onDelete(project.id)
  }, [project.id, onDelete])

  // 3c. Render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

### Client vs Server Components

```typescript
// Server Component (default) - NO 'use client'
// ✅ Use for: data fetching, auth checks, static content
export default async function Page() {
  const session = await auth()
  if (!session) redirect('/login')
  return <ClientComponent user={session.user} />
}

// Client Component - WITH 'use client'
// ✅ Use for: interactivity, hooks, browser APIs
'use client'

export function ClientComponent({ user }: { user: User }) {
  const [state, setState] = useState()
  return <button onClick={() => setState(!state)}>Toggle</button>
}
```

### Memoization Rules

```typescript
// ✅ Memoize: Components receiving object/array props
const ProjectItem = memo(function ProjectItem({ project }: Props) {
  return <div>{project.title}</div>
})

// ✅ Memoize: Callbacks passed to children
const handleClick = useCallback(() => {
  doSomething(id)
}, [id])

// ✅ Memoize: Expensive computations
const sortedProjects = useMemo(
  () => projects.sort((a, b) => a.title.localeCompare(b.title)),
  [projects]
)

// ❌ Don't memoize: Simple components, primitive props
```

### Event Handling

```typescript
// ✅ Good: Stop propagation when needed
const handleMenuClick = (e: React.MouseEvent) => {
  e.stopPropagation()
  setMenuOpen(true)
}

// ✅ Good: Prevent default for forms
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault()
  submitForm()
}
```

---

## 4. API Route Patterns

### Standard Route Structure

```typescript
import { NextRequest } from 'next/server'
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/request-guard'
import { validateRequestBody } from '@/lib/validation'
import {
  successResponse,
  createdResponse,
  badRequestResponse,
  internalErrorResponse
} from '@/lib/api-response'
import { verifyOwnership } from '@/lib/ownership'
import { revalidateCache } from '@/lib/cache'
import { prisma } from '@/lib/prisma'
import { createEntitySchema } from '@/lib/validation'

export async function POST(request: NextRequest) {
  // 1. Auth + Rate Limit Guard
  const guard = await requireAuthAndRateLimit(
    request,
    'POST /api/resource',
    RATE_LIMITS.write
  )
  if (!guard.success) return guard.response

  try {
    // 2. Validate Request Body
    const validation = await validateRequestBody(request, createEntitySchema)
    if (!validation.success) {
      return badRequestResponse(validation.error)
    }

    // 3. Authorization (if needed)
    // const isOwner = await verifyOwnership(resourceId, guard.user.id)
    // if (!isOwner) return forbiddenResponse()

    // 4. Database Operation
    const entity = await prisma.entity.create({
      data: {
        ...validation.data,
        userId: guard.user.id,
      },
    })

    // 5. Cache Invalidation
    revalidateCache('entities')

    // 6. Response
    return createdResponse(entity)
  } catch (error) {
    return internalErrorResponse('create', 'entity', error)
  }
}
```

### HTTP Status Codes

| Code | Helper | Usage |
|------|--------|-------|
| 200 | `successResponse(data)` | GET, PATCH, DELETE success |
| 201 | `createdResponse(data)` | POST success (resource created) |
| 400 | `badRequestResponse(msg)` | Validation errors |
| 401 | `unauthorizedResponse()` | Not authenticated |
| 403 | `forbiddenResponse()` | Not authorized (ownership) |
| 404 | `notFoundResponse(resource)` | Resource doesn't exist |
| 429 | (rate limiter) | Too many requests |
| 500 | `internalErrorResponse()` | Server errors |

---

## 5. Security Best Practices

### Authentication

```typescript
// ✅ Always check auth at route level
const guard = await requireAuthAndRateLimit(request, endpoint, rateLimit)
if (!guard.success) return guard.response

// ✅ Access user ID from guard
const userId = guard.user.id
```

### Authorization (Ownership)

```typescript
// ✅ Always verify ownership before mutations
const isOwner = await verifyOwnership(resourceId, userId, 'post')
if (!isOwner) return forbiddenResponse()

// ✅ Generic ownership verification helper
async function verifyOwnership(
  resourceId: string,
  userId: string,
  resourceType: 'post' | 'product' | 'comment' | 'order'
): Promise<boolean> {
  const resource = await prisma[resourceType].findUnique({
    where: { id: resourceId },
    select: { userId: true },
  })
  return resource?.userId === userId
}

// ✅ For nested resources, check parent ownership
const { comment, isOwner } = await verifyCommentOwnership(commentId, userId)
if (!isOwner) return forbiddenResponse()
```

### Input Validation

```typescript
// ✅ Use Zod schemas with sanitization (generic patterns)
function sanitizeString(str: string): string {
  return str.replace(/[<>"']/g, '')
}

const sanitizedString = (maxLength: number) =>
  z.string().max(maxLength).transform(sanitizeString)

const sanitizedOptionalString = (maxLength: number) =>
  z.string().max(maxLength).optional().transform(val => val ? sanitizeString(val) : val)

// ✅ Reusable validation schemas
const createUserSchema = z.object({
  name: sanitizedString(100),
  email: z.string().email().max(255),
  bio: sanitizedOptionalString(500),
})

const createPostSchema = z.object({
  title: sanitizedString(200),
  content: z.string().max(100000),
  tags: z.array(z.string().max(50)).max(10).default([]),
})

const createProductSchema = z.object({
  name: sanitizedString(200),
  description: sanitizedOptionalString(2000),
  price: z.number().min(0).max(999999),
  stock: z.number().int().min(0).default(0),
})

// ✅ Pagination schema (reusable)
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})
```

### Rate Limiting

```typescript
// ✅ Apply appropriate limits per operation type
RATE_LIMITS.read   // 120 req/60s - GET operations
RATE_LIMITS.write  // 30 req/60s  - POST/PATCH
RATE_LIMITS.heavy  // 10 req/60s  - DELETE, expensive ops
```

---

## 6. Database Patterns (Prisma)

### Query Patterns

```typescript
// ✅ Select only needed fields for lists
const users = await prisma.user.findMany({
  where: { isActive: true },
  select: {
    id: true,
    name: true,
    email: true,
    avatar: true,
    createdAt: true,
  },
  orderBy: { createdAt: 'desc' },
  take: 20,
  skip: 0,
})

// ✅ Include relations when needed
const post = await prisma.post.findUnique({
  where: { id },
  include: {
    author: { select: { id: true, name: true, avatar: true } },
    comments: { orderBy: { createdAt: 'desc' }, take: 10 },
    tags: true,
  },
})

// ✅ Use transactions for multi-table operations
await prisma.$transaction([
  prisma.comment.deleteMany({ where: { postId } }),
  prisma.post.delete({ where: { id: postId } }),
])

// ✅ Batch operations with transactions
await prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data: orderData })
  await tx.orderItem.createMany({ data: items.map(item => ({ ...item, orderId: order.id })) })
  await tx.product.updateMany({
    where: { id: { in: items.map(i => i.productId) } },
    data: { stock: { decrement: 1 } },
  })
  return order
})
```

### Common Includes (DRY)

```typescript
// lib/prisma-includes.ts
export const postWithRelations = {
  author: { select: { id: true, name: true, avatar: true } },
  comments: { orderBy: { createdAt: 'desc' }, take: 10 },
  tags: true,
} as const

export const orderWithRelations = {
  items: { include: { product: true } },
  user: { select: { id: true, name: true, email: true } },
} as const

export const productWithRelations = {
  category: true,
  reviews: { orderBy: { createdAt: 'desc' }, take: 5 },
} as const
```

---

## 7. Caching Strategy

### Server-Side Cache

```typescript
// ✅ Use cache tags for granular invalidation
import { cacheTag, cacheLife } from 'next/cache'

async function getUsersCached(filters: UserFilters) {
  'use cache'
  cacheTag('users', `users-${JSON.stringify(filters)}`)
  cacheLife('minutes')

  return prisma.user.findMany({ where: filters })
}

async function getPostsCached(authorId: string) {
  'use cache'
  cacheTag('posts', `author-posts-${authorId}`)
  cacheLife('minutes')

  return prisma.post.findMany({ where: { authorId } })
}

// ✅ Invalidate specific tags
import { revalidateTag } from 'next/cache'

function revalidateCache(tag: string) {
  revalidateTag(tag)
}

// Usage after mutations
revalidateCache('users')
revalidateCache('posts')
revalidateCache(`author-posts-${authorId}`)
```

### Client-Side Cache

```typescript
// ✅ Generic cache helper
const CACHE_PREFIX = 'app-cache'

export function getCached<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  const cached = localStorage.getItem(`${CACHE_PREFIX}-${key}`)
  if (!cached) return null
  
  const { data, expiry } = JSON.parse(cached)
  if (expiry && Date.now() > expiry) {
    localStorage.removeItem(`${CACHE_PREFIX}-${key}`)
    return null
  }
  return data
}

export function setCache<T>(key: string, data: T, ttlMs?: number): void {
  if (typeof window === 'undefined') return
  const item = {
    data,
    expiry: ttlMs ? Date.now() + ttlMs : null,
  }
  localStorage.setItem(`${CACHE_PREFIX}-${key}`, JSON.stringify(item))
}

export function clearCache(key: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(`${CACHE_PREFIX}-${key}`)
}

// ✅ Implement sync intervals
const SYNC_INTERVAL_MS = 5 * 60 * 1000

export function needsSync(key: string): boolean {
  const lastSync = localStorage.getItem(`${CACHE_PREFIX}-${key}-sync`)
  if (!lastSync) return true
  return Date.now() - parseInt(lastSync) > SYNC_INTERVAL_MS
}

export function markSynced(key: string): void {
  localStorage.setItem(`${CACHE_PREFIX}-${key}-sync`, Date.now().toString())
}
```

---

## 8. Error Handling

### API Routes

```typescript
// ✅ Structured error responses
try {
  // operation
} catch (error) {
  console.error(`Failed to ${action} ${resource}:`, error)
  return internalErrorResponse(action, resource, error)
}

// ✅ Specific error messages
return badRequestResponse('Title is required')
return notFoundResponse('Project')
```

### Client-Side

```typescript
// ✅ Handle errors gracefully with fallbacks
const { data, error, loading } = useEntity(id)

if (loading) return <Skeleton />
if (error) return <ErrorState message={error.message} />
if (!data) return <NotFound />

// ✅ Generic hook pattern with error handling
function useEntity<T>(id: string, endpoint: string) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      try {
        const res = await api.get(`/api/${endpoint}/${id}`)
        setData(res.data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id, endpoint])

  return { data, error, loading }
}

// ✅ Try-catch for async operations
const handleSave = async () => {
  try {
    await updateEntity(data)
    showToast('Saved successfully')
  } catch (error) {
    console.error('Save failed:', error)
    showToast('Failed to save', 'error')
  }
}
```

---

## 9. Performance Guidelines

### Code Splitting

```typescript
// ✅ Lazy load heavy components
import dynamic from 'next/dynamic'

const Editor = dynamic(() => import('@/components/Editor'), {
  ssr: false,
  loading: () => <EditorSkeleton />,
})

// ✅ Use Suspense boundaries
<Suspense fallback={<Loading />}>
  <AsyncComponent />
</Suspense>
```

### Debouncing

```typescript
// ✅ Debounce expensive operations
const debouncedSave = useRef(
  debounce((data: UpdateInput) => {
    updateEntity(data)
  }, 1000)
).current

// ✅ Cleanup on unmount
useEffect(() => {
  return () => debouncedSave.cancel()
}, [debouncedSave])

// ✅ Generic debounce hook
function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  return useMemo(
    () => debounce((...args: Parameters<T>) => callbackRef.current(...args), delay),
    [delay]
  )
}
```

### Optimistic Updates

```typescript
// ✅ Update UI immediately, sync in background (generic pattern)
function useOptimisticUpdate<T extends { id: string }>(
  items: T[],
  setItems: (items: T[]) => void,
  endpoint: string
) {
  const update = useCallback(
    (id: string, updates: Partial<T>) => {
      setItems(items.map(item => (item.id === id ? { ...item, ...updates } : item)))

      api.patch(`/api/${endpoint}/${id}`, updates).catch(error => {
        console.error('Sync failed:', error)
        // Optionally revert on failure
      })
    },
    [items, setItems, endpoint]
  )

  const remove = useCallback(
    (id: string) => {
      setItems(items.filter(item => item.id !== id))

      api.delete(`/api/${endpoint}/${id}`).catch(error => {
        console.error('Delete failed:', error)
      })
    },
    [items, setItems, endpoint]
  )

  return { update, remove }
}

// Usage
const { update, remove } = useOptimisticUpdate(posts, setPosts, 'posts')

const handleToggleLike = (id: string, currentLiked: boolean) => {
  update(id, { isLiked: !currentLiked, likeCount: currentLiked ? -1 : 1 })
}
```

---

## 10. UI/UX Standards

### Tailwind CSS

```typescript
// ✅ Use consistent color palette
// Light: zinc-50 (bg), zinc-900 (text)
// Dark: zinc-900 (bg), zinc-100 (text)
// Accent: blue-500

// ✅ Responsive design (mobile-first)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// ✅ Dark mode with class strategy
<div className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
```

### Accessibility

```typescript
// ✅ Use semantic HTML
<button> for actions
<a> for navigation
<nav>, <main>, <article>, <aside>

// ✅ ARIA labels for icons
<button aria-label="Delete project">
  <Trash className="h-4 w-4" />
</button>

// ✅ Keyboard support
onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
```

### Loading States

```typescript
// ✅ Always show loading indicators
{loading ? <Skeleton /> : <Content />}

// ✅ Use skeleton components that match content shape
function ProjectSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-4 bg-zinc-200 rounded w-3/4" />
      <div className="h-4 bg-zinc-200 rounded w-1/2" />
    </div>
  )
}
```

---

## 11. Git Conventions

### Commit Messages

```
<type>: <description>

Types:
- feat:     New feature
- fix:      Bug fix
- refactor: Code refactoring
- style:    Formatting, no code change
- docs:     Documentation
- test:     Adding tests
- chore:    Maintenance tasks

Examples:
feat: Add AI chat history sidebar
fix: Resolve race condition in project save
refactor: Extract validation schemas to lib/validation.ts
```

### Branch Naming

```
feature/add-ai-chat
fix/project-save-race-condition
refactor/validation-schemas
```

---

## 12. Code Review Checklist

### Before Submitting PR

- [ ] TypeScript compiles without errors
- [ ] ESLint passes (`pnpm lint`)
- [ ] No `console.log` left (except error handlers)
- [ ] No hardcoded secrets or credentials
- [ ] Responsive design tested
- [ ] Dark mode tested
- [ ] Auth/ownership checks in place
- [ ] Input validation with Zod
- [ ] Proper error handling
- [ ] Cache invalidation after mutations
- [ ] Loading states for async operations

---

## Quick Reference Card

### File Naming

| Type | Pattern | Example |
|------|---------|---------|
| Component | `PascalCase.tsx` | `ProjectCard.tsx` |
| Hook | `useCamelCase.ts` | `useProject.ts` |
| Utility | `kebab-case.ts` | `api-response.ts` |
| Route | `kebab-case/route.ts` | `projects/[id]/route.ts` |

### Import Order

1. External packages (`react`, `next`, etc.)
2. Internal modules (`@/lib/*`, `@/hooks/*`)
3. Types (`import type { ... }`)
4. Styles (if applicable)

### Response Helpers

```typescript
successResponse(data)      // 200
createdResponse(data)      // 201
badRequestResponse(msg)    // 400
unauthorizedResponse()     // 401
forbiddenResponse()        // 403
notFoundResponse(resource) // 404
internalErrorResponse()    // 500
```

### Default Values Strategy

| Layer | How to Apply |
|-------|--------------|
| Database | Prisma `@default()` |
| Validation | Zod `.default()` |
| TypeScript | `DEFAULT_MODEL` constants |
| Components | `defaultProps` object spread |

---

*Last Updated: 2025*
*Version: 2.0 - Universal Edition*