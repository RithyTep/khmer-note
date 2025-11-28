# Changelog

All notable changes to Khmer Note will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- (New features will be listed here)

### Changed
- (Changes to existing features will be listed here)

### Fixed
- (Bug fixes will be listed here)

---

## [1.0.0] - 2024-11-28

### Added

#### Core Features
- **Rich Text Editor** - BlockNote-based editor with full formatting support
- **Project Management** - Create, edit, delete, and organize notes
- **Offline-First Architecture** - IndexedDB local storage with background sync
- **Dark Mode** - Full dark/light theme support with system preference detection

#### AI Assistant (Angkor AI)
- AI-powered chat assistant with Khmer language support
- Chat history with pagination
- Suggestion cards for quick actions (Write, Translate, Research, Brainstorm)
- Insert AI responses directly into editor
- Rate limiting (20 requests/minute)

#### Authentication
- OAuth support (Google, GitHub, Facebook, Twitter)
- Secure session management with NextAuth.js
- Protected API routes

#### User Interface
- Khmer-inspired Angkor design theme
- Responsive sidebar with favorites
- Project search functionality
- Cover image selector with Cambodia-themed gallery
- Emoji picker for project icons
- Toast notifications

#### Performance Optimizations
- Lazy loading for heavy components (EmojiPicker, ReactMarkdown)
- Image optimization with thumbnails and lazy loading
- Cursor-based pagination for API endpoints
- Memoized callbacks to prevent unnecessary re-renders

#### Security
- CSRF protection
- Rate limiting on sensitive endpoints
- Input validation with Zod
- Secure headers (CSP, HSTS)

### Technical Stack
- Next.js 16 with App Router
- TypeScript
- Prisma ORM with PostgreSQL
- TailwindCSS
- Vercel Blob for file uploads
- Groq AI for chat functionality

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | 2024-11-28 | Initial stable release |

---

## Upgrade Guide

### From Pre-release to 1.0.0

This is the initial stable release. No migration needed.

---

## Links

- [GitHub Repository](https://github.com/RithyTep/khmer-note)
- [Live Demo](https://khmer-note.vercel.app)
- [Contributing Guidelines](./CONTRIBUTING.md)
