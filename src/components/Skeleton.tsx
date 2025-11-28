"use client";

export function EditorSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-3/4"></div>
      <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-full"></div>
      <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-5/6"></div>
      <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-2/3"></div>
      <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-full"></div>
      <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-4/5"></div>
    </div>
  );
}

export function ProjectContentSkeleton() {
  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-zinc-900 relative">
      <header className="h-12 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between px-4 flex-shrink-0 bg-white dark:bg-zinc-900">
        <div className="flex items-center gap-2">
          <div className="h-4 w-20 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse"></div>
          <span className="text-zinc-300 dark:text-zinc-700">/</span>
          <div className="h-4 w-32 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse"></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse"></div>
          <div className="h-4 w-24 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse hidden sm:block"></div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-12 md:py-16">
          <div className="group relative mb-8">
            <div className="mb-4 w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse"></div>
            <div className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded w-1/2 animate-pulse"></div>
          </div>

          <EditorSkeleton />
        </div>
      </div>
    </main>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="w-60 h-full bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 p-4 space-y-4">
      <div className="h-8 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse"></div>
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-8 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  );
}
