import { SkeletonBlock } from "@/components/SkeletonBlock";

export default function InfluencerListLoading() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
        <SkeletonBlock className="h-4 w-20" />
        <SkeletonBlock className="h-7 w-28 rounded-lg" />
      </div>

      <main className="flex-1 overflow-y-auto bg-gray-50 px-6 py-6">
        <SkeletonBlock className="h-3 w-40 mb-5" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      </main>
    </div>
  );
}
