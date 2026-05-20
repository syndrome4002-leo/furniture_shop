import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Spinner from "./Spinner";

// A circular loading screen shown during route transitions. Pages render from
// the localStorage cache instantly, so this overlay only ever appears for the
// brief moment a not-yet-loaded route's JS chunk is fetched — the 120ms delay
// below keeps it from flashing on the common instant navigation.
export default function RouteLoader() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearTimer = () => {
      if (showTimer.current) clearTimeout(showTimer.current);
      showTimer.current = null;
    };

    const start = () => {
      clearTimer();
      // Small delay so instant navigations don't flash the overlay.
      showTimer.current = setTimeout(() => setVisible(true), 120);
    };

    const finish = () => {
      clearTimer();
      setVisible(false);
    };

    router.events.on("routeChangeStart", start);
    router.events.on("routeChangeComplete", finish);
    router.events.on("routeChangeError", finish);
    return () => {
      router.events.off("routeChangeStart", start);
      router.events.off("routeChangeComplete", finish);
      router.events.off("routeChangeError", finish);
      clearTimer();
    };
  }, [router]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-hidden={!visible}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-5 bg-brand-50/80 backdrop-blur-sm"
      style={{
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 300ms ease",
      }}
    >
      <Spinner size={64} />
      <p className="font-display text-sm tracking-[0.15em] uppercase text-brand-700">
        Loading
      </p>
    </div>
  );
}
