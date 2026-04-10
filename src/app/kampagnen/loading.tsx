import { SkeletonBlock } from "@/components/SkeletonBlock";

export default function KampagnenLoading() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="h-14 bg-white border-b border-gray-100 flex items-center px-6 shrink-0">
        <SkeletonBlock className="h-4 w-24" />
      </div>

      <main className="flex-1 overflow-y-auto bg-gray-50 px-6 py-6 space-y-5">
        <SkeletonBlock className="h-3 w-32" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      </main>
    </div>
  );
}
