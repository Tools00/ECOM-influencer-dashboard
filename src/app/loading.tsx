import { SkeletonBlock } from "@/components/SkeletonBlock";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
        <SkeletonBlock className="h-4 w-24" />
        <SkeletonBlock className="h-7 w-48 rounded-full" />
      </div>

      <main className="flex-1 overflow-y-auto bg-gray-50 px-6 py-6 space-y-6">
        {/* KPI Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-28 rounded-2xl" />
          ))}
        </section>

        {/* Charts */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <SkeletonBlock className="lg:col-span-2 h-64 rounded-2xl" />
          <SkeletonBlock className="h-64 rounded-2xl" />
        </section>

        {/* Table + Attribution */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <SkeletonBlock className="xl:col-span-2 h-72 rounded-2xl" />
          <div className="space-y-5">
            <SkeletonBlock className="h-36 rounded-2xl" />
            <SkeletonBlock className="h-32 rounded-2xl" />
          </div>
        </section>
      </main>
    </div>
  );
}
