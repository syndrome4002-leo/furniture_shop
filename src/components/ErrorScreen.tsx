// Full-height centered error state. Shown only when a page has a cold cache
// *and* the first fetch failed — i.e. there is genuinely nothing to render. A
// background revalidation failure on a warm cache is silent; the cached page
// stays visible.
export default function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-display text-lg">Something went wrong</p>
      <p className="max-w-md text-sm text-brand-700">{message}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-md bg-brand-900 px-5 py-2.5 text-sm font-medium text-brand-50 hover:bg-brand-700"
      >
        Try again
      </button>
    </div>
  );
}
