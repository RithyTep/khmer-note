# Camnova (កម្មវិធីចំណាំខ្មែរ)

A modern note-taking application with Khmer language support, AI assistant, and offline-first architecture.

[![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)](https://github.com/RithyTep/khmer-note/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

**Live Demo:** [camnova.rithytep.online](https://camnova.rithytep.online)

## Features

### Core
- **Rich Text Editor** - BlockNote-based editor with full formatting support
- **Project Management** - Create, edit, delete, and organize notes
- **Offline-First** - IndexedDB local storage with background sync
- **Dark Mode** - Full dark/light theme with system preference detection

### AI Assistant (Angkor AI)
- AI-powered chat with Khmer language support
- Quick actions: Write, Translate, Summarize, Brainstorm
- Insert AI responses directly into editor
- Chat history with pagination

### Authentication
- OAuth support (Google, GitHub, Facebook, Twitter)
- Secure session management with NextAuth.js

### User Interface
- Khmer-inspired Angkor design theme
- Responsive sidebar with favorites
- Project search (⌘K / Ctrl+K)
- Cover image gallery with Cambodia themes
- Emoji picker for project icons

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: TailwindCSS
- **Storage**: Vercel Blob for file uploads
- **AI**: Groq API (Llama 3.3 70B)
- **Auth**: NextAuth.js v5

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- pnpm (recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/RithyTep/khmer-note.git
cd khmer-note

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env
```

### Environment Variables

```env
DATABASE_URL="postgresql://username:password@localhost:5432/camnova"
AUTH_SECRET="your-auth-secret"
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"
GROQ_API_KEY="your-groq-api-key"
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"
```

### Database Setup

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# (Optional) Seed sample data
pnpm db:seed
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:push` | Push schema to database |
| `pnpm db:studio` | Open Prisma Studio |

## API Endpoints

### Sync API
- `GET /api/sync` - Fetch all projects
- `POST /api/sync` - Full sync (all projects)
- `PATCH /api/sync` - Partial sync (changed fields only)

### AI API
- `POST /api/ai` - Generate AI response
- `GET /api/ai/chats` - List chat history
- `GET /api/ai/chats/[id]` - Get chat messages
- `DELETE /api/ai/chats/[id]` - Delete chat

### Upload API
- `POST /api/upload` - Upload file to Vercel Blob

## Security Features (v1.1.0)

- IP-based rate limiting (200 req/min per IP)
- CSRF/Origin validation for mutating requests
- Payload size validation (500KB max)
- Suspicious activity auto-blocking
- Security headers (X-Content-Type-Options, X-Frame-Options, etc.)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Built with ❤️ in Cambodia
