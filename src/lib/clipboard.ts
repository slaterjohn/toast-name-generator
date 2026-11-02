/**
 * Copy text to the clipboard. Uses the async Clipboard API where available
 * (secure contexts), otherwise a hidden-textarea fallback for plain-HTTP
 * hosts such as a LAN or tailnet IP. Resolves to true on success.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy path
  }
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.opacity = "0";
    el.style.pointerEvents = "none";
    document.body.appendChild(el);
    const previous = document.activeElement as HTMLElement | null;
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    previous?.focus?.({ preventScroll: true });
    return ok;
  } catch {
    return false;
  }
}
