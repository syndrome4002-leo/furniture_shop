// Placeholder grid shown while the product catalogue is being loaded
// (from the localStorage cache, or fetched as a fallback).
export default function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      aria-hidden
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg overflow-hidden border border-brand-100 bg-white"
        >
          <div className="aspect-square bg-brand-100 animate-pulse" />
          <div className="p-4 space-y-2">
            <div className="h-3 w-1/3 rounded bg-brand-100 animate-pulse" />
            <div className="h-4 w-3/4 rounded bg-brand-100 animate-pulse" />
            <div className="h-3 w-1/4 rounded bg-brand-100 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
