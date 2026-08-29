/**
 * Suspense fallback shown while a lazy owner-tab chunk loads.
 * Mirrors the dashboard card layout (heading + stat cards + content panel),
 * following the LocationPickerModal lazy-map precedent.
 */
export default function TabSkeleton() {
  return (
    <div className="max-w-[1440px] mx-auto w-full" data-testid="tab-skeleton">
      <div className="animate-pulse space-y-5">
        <div className="h-7 w-56 rounded-lg bg-gray-200" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-gray-100 border border-gray-200" />
          ))}
        </div>
        <div className="h-72 rounded-2xl bg-gray-100 border border-gray-200" />
      </div>
    </div>
  );
}
