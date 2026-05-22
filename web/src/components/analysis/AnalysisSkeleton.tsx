export function AnalysisSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      {/* Insight card skeleton */}
      <div className="bull-panel p-5">
        <div className="h-2.5 w-16 animate-pulse rounded-full bg-white/[0.07]" />
        <div className="mt-3 h-5 w-3/4 animate-pulse rounded-full bg-white/[0.06]" />
        <div className="mt-4 space-y-2">
          <div className="h-3 w-full animate-pulse rounded-full bg-white/[0.05]" style={{ animationDelay: '80ms' }} />
          <div className="h-3 w-5/6 animate-pulse rounded-full bg-white/[0.05]" style={{ animationDelay: '140ms' }} />
          <div className="h-3 w-4/6 animate-pulse rounded-full bg-white/[0.05]" style={{ animationDelay: '200ms' }} />
        </div>
      </div>

      {/* Chart skeleton */}
      <div className="bull-panel p-5">
        <div className="h-2.5 w-20 animate-pulse rounded-full bg-white/[0.07]" />
        <div className="mt-4 h-[160px] rounded-[1.75rem] border border-white/[0.06] bg-black/15 flex items-end gap-1 px-4 pb-4 pt-6">
          {[40, 60, 45, 70, 55, 80, 65, 75, 60, 85, 70, 90].map((h, i) => (
            <div
              key={i}
              className="flex-1 animate-pulse rounded-sm bg-white/[0.06]"
              style={{ height: `${h}%`, animationDelay: `${i * 40}ms` }}
            />
          ))}
        </div>
      </div>

      {/* Signal list skeleton */}
      <div className="bull-panel p-5">
        <div className="h-2.5 w-24 animate-pulse rounded-full bg-white/[0.07]" />
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-white/[0.1]" />
              <div className="h-3 flex-1 animate-pulse rounded-full bg-white/[0.05]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
