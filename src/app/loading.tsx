export default function Loading() {
  return (
    <div className="flex-1 flex h-full w-full items-center justify-center bg-white dark:bg-zinc-900">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 dark:border-zinc-700 border-t-blue-600 dark:border-t-blue-500" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">កំពុងផ្ទុក...</p>
      </div>
    </div>
  );
}
