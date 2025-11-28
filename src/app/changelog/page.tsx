"use client";

import {
  Sparkles,
  Bot,
  Shield,
  Zap,
  Globe,
  Moon,
  Image,
  Search,
  Database,
  Lock,
  ArrowLeft,
  Github,
  ExternalLink,
  Tag,
  Calendar,
  CheckCircle2,
  Rocket,
  Code2,
  Palette,
} from "lucide-react";
import Link from "next/link";

interface VersionRelease {
  version: string;
  date: string;
  title: string;
  description: string;
  isLatest?: boolean;
  features: {
    category: string;
    icon: typeof Sparkles;
    items: string[];
  }[];
  technical?: string[];
}

const RELEASES: VersionRelease[] = [
  {
    version: "1.2.0",
    date: "2025-11-29",
    title: "tRPC Migration & Enhanced Security",
    description: "Migrated to tRPC for type-safe APIs, tightened security against curl replay attacks, and fixed sync issues.",
    isLatest: true,
    features: [
      {
        category: "tRPC Migration",
        icon: Code2,
        items: [
          "Type-safe API with tRPC v11",
          "Automatic request batching",
          "React Query integration for caching",
          "SuperJSON transformer for Date serialization",
        ],
      },
      {
        category: "Security Hardening",
        icon: Shield,
        items: [
          "5-second token window (prevents curl replay)",
          "Client header validation (x-camnova-client)",
          "Sec-Fetch headers verification",
          "Origin/Referer validation",
        ],
      },
      {
        category: "Bug Fixes",
        icon: Zap,
        items: [
          "Fixed sidebar delete not persisting",
          "Fixed Prisma undefined values in JSON",
          "Fixed CSP WebSocket for development HMR",
        ],
      },
    ],
  },
  {
    version: "1.1.0",
    date: "2025-01-28",
    title: "Security & Performance Update",
    description: "Major security hardening, faster sync system, and improved mobile experience.",
    features: [
      {
        category: "Security Enhancements",
        icon: Shield,
        items: [
          "IP-based rate limiting (200 req/min per IP)",
          "CSRF/Origin validation for mutating requests",
          "Payload size validation (500KB max)",
          "Auto-blocks IPs after 5 rate limit violations",
          "Security headers (X-Content-Type-Options, etc.)",
        ],
      },
      {
        category: "Sync Improvements",
        icon: Zap,
        items: [
          "5-second debounce instead of 30 minutes",
          "Partial sync (PATCH) - only changed fields",
          "Reduced payload from ~38KB to ~100 bytes",
          "Synced projects saved to IndexedDB immediately",
        ],
      },
      {
        category: "Mobile UX",
        icon: Globe,
        items: [
          "Smaller AI chat window on mobile",
          "Bottom-right positioning for AI button",
          "Single-tap tabs interaction",
          "Better user profile display",
        ],
      },
      {
        category: "Native App",
        icon: Rocket,
        items: [
          "Capacitor iOS setup",
          "Initial native app configuration",
        ],
      },
    ],
  },
  {
    version: "1.0.0",
    date: "2024-11-28",
    title: "Initial Stable Release",
    description: "The first stable release of Camnova with full-featured note-taking, AI assistant, and offline support.",
    features: [
      {
        category: "AI Assistant (Angkor AI)",
        icon: Bot,
        items: [
          "AI-powered chat with Khmer language support",
          "Chat history with pagination",
          "Quick action suggestions (Write, Translate, Research, Brainstorm)",
          "Insert AI responses directly into editor",
          "Rate limiting for fair usage (20 req/min)",
        ],
      },
      {
        category: "Rich Text Editor",
        icon: Code2,
        items: [
          "BlockNote-based editor with full formatting",
          "Markdown support",
          "Code blocks with syntax highlighting",
          "Lists, headings, and text styling",
          "Real-time auto-save",
        ],
      },
      {
        category: "Offline-First Architecture",
        icon: Database,
        items: [
          "IndexedDB local storage",
          "Background sync every 30 minutes",
          "Works without internet connection",
          "Automatic conflict resolution",
        ],
      },
      {
        category: "Authentication",
        icon: Lock,
        items: [
          "Google OAuth",
          "GitHub OAuth",
          "Facebook OAuth",
          "Twitter/X OAuth",
          "Secure session management",
        ],
      },
      {
        category: "User Interface",
        icon: Palette,
        items: [
          "Khmer-inspired Angkor design theme",
          "Dark/Light mode with system preference",
          "Responsive sidebar with favorites",
          "Cambodia-themed cover gallery",
          "Emoji picker for project icons",
          "Toast notifications",
        ],
      },
      {
        category: "Performance",
        icon: Zap,
        items: [
          "Lazy loading for heavy components",
          "Image optimization with thumbnails",
          "Cursor-based API pagination",
          "Memoized React callbacks",
          "Code splitting",
        ],
      },
      {
        category: "Security",
        icon: Shield,
        items: [
          "CSRF protection",
          "Rate limiting on sensitive endpoints",
          "Input validation with Zod",
          "Secure headers (CSP, HSTS)",
          "Protected API routes",
        ],
      },
    ],
    technical: [
      "Next.js 16 with App Router",
      "TypeScript for type safety",
      "Prisma ORM with PostgreSQL",
      "TailwindCSS for styling",
      "Vercel Blob for file uploads",
      "Groq AI for chat functionality",
    ],
  },
];

const UPCOMING_FEATURES = [
  "Collaborative editing",
  "Export to PDF/Word",
  "Mobile app (React Native)",
  "Custom themes",
  "Folder organization",
  "Tags and labels",
  "Voice notes",
  "Image annotations",
];

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="w-full px-4 sm:px-8 lg:px-12 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">ត្រឡប់ទៅកំណត់ត្រា</span>
            </Link>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/RithyTep/khmer-note"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                <Github className="w-4 h-4" />
                <span className="hidden sm:inline">GitHub</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-b from-amber-50 to-white dark:from-amber-950/20 dark:to-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
        <div className="w-full px-4 sm:px-8 lg:px-12 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-sm font-medium mb-6">
            <Tag className="w-4 h-4" />
            Version {RELEASES[0].version}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
            Changelog
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            ប្រវត្តិកំណែនិងការផ្លាស់ប្តូរទាំងអស់របស់ Camnova
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="w-full px-4 sm:px-8 lg:px-12 py-12">
        {/* Releases */}
        <div className="space-y-16">
          {RELEASES.map((release) => (
            <article key={release.version} className="relative">
              {/* Version Header */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                    v{release.version}
                  </span>
                  {release.isLatest && (
                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
                      LATEST
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(release.date).toLocaleDateString('km-KH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Release Title & Description */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
                  {release.title}
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400">
                  {release.description}
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {release.features.map((category) => (
                  <div
                    key={category.category}
                    className="p-5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                        <category.icon className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                      </div>
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {category.category}
                      </h3>
                    </div>
                    <ul className="space-y-2">
                      {category.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Technical Stack */}
              {release.technical && (
                <div className="mt-8 p-5 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
                    <Code2 className="w-5 h-5" />
                    Technical Stack
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {release.technical.map((tech, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-sm rounded-full border border-zinc-200 dark:border-zinc-700"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>

        {/* Upcoming Features */}
        <section className="mt-16 p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-2xl border border-amber-200 dark:border-amber-800/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-500 rounded-lg">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              មុខងារនាពេលអនាគត
            </h2>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            Coming soon in future releases:
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {UPCOMING_FEATURES.map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Footer Links */}
        <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <a
              href="https://github.com/RithyTep/khmer-note/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-500 transition-colors"
            >
              <Github className="w-4 h-4" />
              View all releases on GitHub
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://github.com/RithyTep/khmer-note/blob/main/CONTRIBUTING.md"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-500 transition-colors"
            >
              Contributing Guidelines
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8">
        <div className="w-full px-4 sm:px-8 lg:px-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
          <p>© 2025 Camnova. Built with ❤️ in Cambodia.</p>
        </div>
      </footer>
    </div>
  );
}
