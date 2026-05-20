import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";

// A circular loading screen shown during route transitions. Every page fetches
// from Shopware/Strapi in getServerSideProps, so navigations can take a moment
// — this overlay gives the user immediate feedback instead of a frozen page.
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
      {/* Dual-ring circular spinner */}
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 rounded-full border-4 border-brand-100" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-brand-700 border-r-brand-500" />
      </div>
      <p className="font-display text-sm tracking-[0.15em] uppercase text-brand-700">
        Loading
      </p>
    </div>
  );
}
