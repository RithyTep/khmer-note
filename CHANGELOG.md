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

## [1.1.0] - 2025-01-28

### Added

#### Security Enhancements
- **IP-based Rate Limiting** - Pre-authentication flood protection (200 req/min per IP)
- **CSRF/Origin Validation** - Validates request origins for mutating requests
- **Payload Size Validation** - 500KB max for sync requests to prevent abuse
- **Suspicious Activity Tracking** - Auto-blocks IPs after 5 rate limit violations
- **Security Headers** - X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy

#### Native App Support
- **Capacitor iOS Setup** - Initial configuration for native iOS app

#### User Interface
- **Changelog Page** - Full-screen changelog with version history
- **Changelog Link in Header** - Quick access to version history

### Changed

#### Sync System Improvements
- **Faster Sync** - Reduced debounce from 30 minutes to 5 seconds
- **Partial Sync (PATCH)** - Only sync changed fields instead of full project (~38KB → ~100 bytes)
- **Local DB Persistence** - Synced projects now saved to IndexedDB immediately

#### Mobile UX
- **Smaller AI Chat** - Compact chat window on mobile devices
- **Bottom-Right Positioning** - AI chat button moved to bottom-right corner
- **Single-Tap Tabs** - Improved tab interaction on touch devices
- **User Profile** - Better profile display on mobile

#### Branding
- **App Renamed** - Changed from "Khmer Note" to "Camnova"

### Fixed
- Fixed synced projects not saving to local DB after initial sync
- Fixed AI chat positioning on mobile devices

### Code Quality
- Removed all comments and unused code
- Removed unused imports across hooks and API routes
- Cleaned up components, hooks, lib, and API routes

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
| 1.1.0 | 2025-01-28 | Security hardening, sync improvements, mobile UX |
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
