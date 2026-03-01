export default function NewsfeedLoading() {
  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header skeleton */}
      <div className="mb-5">
        <div className="h-7 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-md animate-pulse mb-2" />
        <div className="h-4 w-72 bg-zinc-100 dark:bg-zinc-800/60 rounded animate-pulse" />
      </div>

      {/* Filter bar skeleton */}
      <div className="flex gap-2 mb-6">
        {[40, 36, 36, 36, 40, 40, 44].map((w, i) => (
          <div key={i} className={`h-6 w-${w === 36 ? 9 : w === 40 ? 10 : 11} bg-zinc-100 dark:bg-zinc-800 rounded-full animate-pulse`} style={{ width: `${w}px` }} />
        ))}
      </div>

      {/* News card skeletons */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 mt-1.5 shrink-0 animate-pulse" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-4 w-10 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                  <div className="h-4 w-16 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                </div>
                <div className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-2" />
                <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse mb-1" />
                <div className="h-3 w-2/3 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
              </div>
              <div className="h-3 w-16 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
