interface SkeletonProps {
  className?: string
  rounded?: string
}

export function Skeleton({ className = 'h-4 w-full', rounded = 'rounded-md' }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={`${rounded} ${className} bg-surface-800 relative overflow-hidden`}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-surface-700/60 to-transparent" />
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-surface-800 border border-surface-700 rounded-2xl p-4 flex flex-col gap-2">
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-3 w-full" />
    </div>
  )
}

export function SkeletonChart({ height = 'h-40' }: { height?: string }) {
  return (
    <div className={`${height} bg-surface-800 border border-surface-700 rounded-2xl relative overflow-hidden`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-surface-700/60 to-transparent" />
    </div>
  )
}
