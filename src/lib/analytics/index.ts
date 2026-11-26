/**
 * Privacy-friendly product analytics with PostHog.
 *
 * - Off unless NEXT_PUBLIC_POSTHOG_KEY is set at build time, so local
 *   development, tests and forks send nothing.
 * - Loaded lazily after the page is idle, from our own bundle (the
 *   "no-external" build never fetches extra scripts from PostHog).
 * - Memory-only persistence: no cookies or localStorage, so there is nothing
 *   to consent to. Each visit counts as a new anonymous visitor.
 * - No session recording, surveys or autocapture of page content. Events
 *   carry only generated names and the kind of action, never anything typed
 *   into the "Find your own Toast name" box.
 */

type Props = Record<string, string | number | boolean | null | undefined>;

export type AnalyticsEvent =
  | "name_regenerated"
  | "personal_name_revealed"
  | "personal_name_repeat"
  | "name_copied"
  | "name_favourited"
  | "name_unfavourited"
  | "name_shared"
  | "name_card_downloaded"
  | "shared_name_opened"
  | "favourites_opened"
  | "app_installed";

type Client = { capture: (event: string, props?: Props) => void };

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";

let client: Client | null = null;
let loading: Promise<void> | null = null;
const queue: Array<[AnalyticsEvent, Props | undefined]> = [];

export const analyticsEnabled = KEY.length > 0;

/** Start PostHog once the browser is idle. Safe to call more than once. */
export function initAnalytics(): Promise<void> {
  if (!analyticsEnabled || typeof window === "undefined") return Promise.resolve();
  if (
    navigator.doNotTrack === "1" ||
    (navigator as { globalPrivacyControl?: boolean }).globalPrivacyControl
  ) {
    return Promise.resolve();
  }
  loading ??= import("posthog-js/no-external").then(({ default: posthog }) => {
    posthog.init(KEY, {
      api_host: HOST,
      defaults: "2025-11-30",
      persistence: "memory",
      person_profiles: "identified_only",
      autocapture: false,
      capture_pageview: true,
      capture_pageleave: true,
      capture_dead_clicks: false,
      capture_heatmaps: false,
      disable_session_recording: true,
      disable_surveys: true,
      disable_external_dependency_loading: true,
      advanced_disable_flags: true,
      // Plain JSON payloads are tiny here and easy to audit.
      disable_compression: true,
      mask_all_text: true,
      mask_all_element_attributes: true,
      // Never send the share parameter's raw query string along with page URLs.
      sanitize_properties: (properties) => {
        for (const key of ["$current_url", "$referrer"]) {
          const value = properties[key];
          if (typeof value === "string") properties[key] = stripQuery(value);
        }
        return properties;
      },
    });
    client = posthog;
    for (const [event, props] of queue.splice(0)) posthog.capture(event, props);
  });
  return loading.catch(() => undefined);
}

function stripQuery(url: string): string {
  try {
    const u = new URL(url);
    if (u.origin === window.location.origin) u.search = "";
    return u.toString();
  } catch {
    return url;
  }
}

/** Record a product event. Queued until PostHog has loaded; a no-op when disabled. */
export function track(event: AnalyticsEvent, props?: Props) {
  if (!analyticsEnabled) return;
  if (client) client.capture(event, props);
  else if (queue.length < 50) queue.push([event, props]);
}
