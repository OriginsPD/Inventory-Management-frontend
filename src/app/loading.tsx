import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-10 w-[300px]" />
          <Skeleton className="h-5 w-[450px]" />
        </div>
        <Skeleton className="h-12 w-[180px] rounded-xl" />
      </div>

      {/* Grid Layout Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-[500px] w-full rounded-2xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-[240px] w-full rounded-2xl" />
          <Skeleton className="h-[240px] w-full rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
