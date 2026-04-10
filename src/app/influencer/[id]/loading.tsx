import { SkeletonBlock } from "@/components/SkeletonBlock";

export default function InfluencerDetailLoading() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="h-14 bg-white border-b border-gray-100 flex items-center gap-4 px-6 shrink-0">
        <SkeletonBlock className="h-3 w-24" />
        <SkeletonBlock className="h-3 w-3 rounded-full" />
        <SkeletonBlock className="h-4 w-32" />
      </div>

      <main className="flex-1 overflow-y-auto bg-gray-50 px-6 py-6 space-y-5">
        <SkeletonBlock className="h-28 rounded-2xl" />

        {/* KPI Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-24 rounded-2xl" />
          ))}
        </section>

        {/* Charts */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SkeletonBlock className="h-56 rounded-2xl" />
          <SkeletonBlock className="h-56 rounded-2xl" />
        </section>

        {/* Orders table */}
        <SkeletonBlock className="h-64 rounded-2xl" />
      </main>
    </div>
  );
}
