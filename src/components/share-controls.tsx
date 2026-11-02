"use client";

import { Download, Share2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { GeneratedName } from "@/lib/names";
import { copyText } from "@/lib/clipboard";
import { shareUrl } from "@/lib/names/share";

interface Props {
  name: GeneratedName | null;
  label: string;
  onFeedback: (message: string) => void;
}

/**
 * Share a link to the displayed name, or download it as an image. Links
 * encode only the generated name (`?n=cyril.kettle`), never anything typed
 * into the form. Nothing happens until the person presses a button.
 */
export function ShareControls({ name, label, onFeedback }: Props) {
  const [busy, setBusy] = useState(false);

  async function handleShare() {
    if (!name) return;
    const url = shareUrl(name, window.location.href);
    if (typeof navigator.share === "function" && window.matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share({ title: "Toast Name Generator", text: name.display, url });
        return;
      } catch (error) {
        if ((error as DOMException)?.name === "AbortError") return;
        // fall through to copying the link
      }
    }
    const ok = await copyText(url);
    onFeedback(ok ? "Link copied to the clipboard." : `Couldn't copy the link. Here it is: ${url}`);
  }

  async function handleDownload() {
    if (!name || busy) return;
    setBusy(true);
    try {
      const { downloadNameCard } = await import("@/lib/name-card");
      await downloadNameCard(name.display, label);
      onFeedback("Name card downloaded.");
    } catch {
      onFeedback("Couldn't create the name card in this browser.");
    } finally {
      setBusy(false);
    }
  }

  const classes =
    "h-11 rounded-full px-4 text-ink-soft hover:bg-paper-deep hover:text-ink";

  return (
    <div className="flex flex-wrap justify-center gap-1">
      <Button type="button" variant="ghost" className={classes} onClick={handleShare} disabled={!name}>
        <Share2 aria-hidden="true" />
        Share link
      </Button>
      <Button
        type="button"
        variant="ghost"
        className={classes}
        onClick={handleDownload}
        disabled={!name || busy}
        aria-busy={busy || undefined}
      >
        <Download aria-hidden="true" />
        {busy ? "Preparing card…" : "Download card"}
      </Button>
    </div>
  );
}
