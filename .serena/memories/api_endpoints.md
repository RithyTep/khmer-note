# API Endpoints Reference

## Projects API
| Method | Endpoint | Rate Limit | Description |
|--------|----------|------------|-------------|
| GET | `/api/projects` | read (120/60s) | List user's projects |
| POST | `/api/projects` | write (30/60s) | Create new project |
| GET | `/api/projects/[id]` | read | Get single project |
| PATCH | `/api/projects/[id]` | write | Update project |
| DELETE | `/api/projects/[id]` | heavy (10/60s) | Delete project |

## Tasks API
| Method | Endpoint | Rate Limit | Description |
|--------|----------|------------|-------------|
| GET | `/api/tasks?projectId=` | read | List tasks |
| POST | `/api/tasks` | write | Create task |
| GET | `/api/tasks/[id]` | read | Get single task |
| PATCH | `/api/tasks/[id]` | write | Update task |
| DELETE | `/api/tasks/[id]` | write | Delete task |

## Kanban API
| Method | Endpoint | Rate Limit | Description |
|--------|----------|------------|-------------|
| GET | `/api/kanban?projectId=` | read | List kanban cards |
| POST | `/api/kanban` | write | Create card |
| GET | `/api/kanban/[id]` | read | Get single card |
| PATCH | `/api/kanban/[id]` | write | Update card |
| DELETE | `/api/kanban/[id]` | write | Delete card |

## AI API
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai` | Generate AI response |
| GET | `/api/ai/chats` | List chat history |
| GET | `/api/ai/chats/[id]` | Get chat with messages |
| DELETE | `/api/ai/chats/[id]` | Delete chat |

## Upload API
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload?filename=` | Upload file to Vercel Blob |

## API Pattern
All routes follow this pattern:
```typescript
const guard = await requireAuthAndRateLimit(request, endpoint, RATE_LIMITS.write);
if (!guard.success) return guard.response;
// guard.user.id available for queries
```
