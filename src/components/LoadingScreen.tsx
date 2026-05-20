import Spinner from "./Spinner";

// Full-height centered loading screen. Shown while a page is being generated
// on the server for the first time (ISR fallback) — i.e. when there is no
// cached version to serve yet.
export default function LoadingScreen({ label = "Loading" }: { label?: string }) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-5">
      <Spinner size={64} />
      <p className="font-display text-sm uppercase tracking-[0.15em] text-brand-700">
        {label}
      </p>
    </div>
  );
}
