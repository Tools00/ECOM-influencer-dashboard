import { SkeletonBlock } from "@/components/SkeletonBlock";

export default function Loading() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
        <SkeletonBlock className="h-4 w-36" />
        <div className="flex gap-2">
          <SkeletonBlock className="h-7 w-40 rounded-lg" />
          <SkeletonBlock className="h-7 w-28 rounded-lg" />
          <SkeletonBlock className="h-7 w-32 rounded-lg" />
          <SkeletonBlock className="h-7 w-16 rounded-lg" />
        </div>
      </header>
      <main className="flex-1 bg-gray-50 px-6 py-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <SkeletonBlock className="h-28 rounded-xl" />
        <SkeletonBlock className="h-72 rounded-xl" />
      </main>
    </div>
  );
}
