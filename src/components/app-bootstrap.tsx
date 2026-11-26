"use client";

import { useEffect } from "react";
import { initAnalytics, track } from "@/lib/analytics";

/**
 * Runs once after the page loads: registers the service worker (production
 * builds only) and starts analytics when the browser is idle, so neither
 * competes with the first paint.
 */
export function AppBootstrap() {
  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1500));
    const handle = idle(() => {
      void initAnalytics();
      if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
        navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
      }
    });
    const onInstalled = () => track("app_installed");
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("appinstalled", onInstalled);
      if (typeof handle === "number" && window.cancelIdleCallback)
        window.cancelIdleCallback(handle);
    };
  }, []);
  return null;
}
