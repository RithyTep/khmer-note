# Component Architecture

## Component Hierarchy
```
RootLayout (Server)
└── AuthProvider (Client)
    └── ThemeProvider (Client)
        └── HomeClient (Main Orchestrator)
            ├── Sidebar
            │   ├── UserAvatar
            │   ├── MenuItem (Search, Inbox, Settings)
            │   ├── ProjectList
            │   │   └── ProjectItem + ProjectItemMenu
            │   └── SignOut Button
            ├── SearchModal (Lazy)
            ├── ProjectContent (Lazy + Suspense)
            │   ├── Header (breadcrumb, favorite, timestamp)
            │   ├── CoverSelector (tabs: gallery, gradient, color, link, upload)
            │   ├── Emoji Picker
            │   ├── Title (contentEditable)
            │   ├── LazyEditor → Editor (BlockNote)
            │   └── AIAssistant (slide-out panel)
            └── Toast
```

## Key Components

### HomeClient (`src/components/HomeClient.tsx`)
- Main state orchestrator
- Manages sidebar, search, toast visibility
- Uses `useProjects()`, `useProjectSelection()` hooks

### ProjectContent (`src/components/ProjectContent.tsx`)
- Project editing view
- Debounced saves (1000ms) for title and content
- Cover image management
- AI assistant toggle

### Editor (`src/components/Editor.tsx`)
- BlockNote integration
- Custom slash menu with Khmer labels
- Alert blocks (info, success, warning, error, tip)
- 140+ lines custom CSS for styling

### Sidebar (`src/components/Sidebar.tsx`)
- Project navigation
- Favorites section
- User profile + theme toggle
- Mobile responsive (modal on small screens)

## Performance Patterns
- `dynamic()` imports with `ssr: false` for heavy components
- `React.memo()` on frequently re-rendered components
- Suspense boundaries with skeleton fallbacks
- Debounced API calls to reduce network traffic
