"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { copyText } from "@/lib/clipboard";

export type CopyOutcome = "copied" | "failed";

interface Props {
  text: string | null;
  onResult: (outcome: CopyOutcome, text: string) => void;
  /** Icon-only variant for compact lists. The accessible name is still set. */
  compact?: boolean;
  label?: string;
}

export function CopyNameButton({ text, onResult, compact, label = "Copy name" }: Props) {
  const [justCopied, setJustCopied] = useState(false);

  async function handleClick() {
    if (!text) return;
    const ok = await copyText(text);
    onResult(ok ? "copied" : "failed", text);
    if (ok) {
      setJustCopied(true);
      window.setTimeout(() => setJustCopied(false), 1500);
    }
  }

  const Icon = justCopied ? Check : Copy;

  if (compact) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleClick}
        disabled={!text}
        aria-label={label}
        className="size-11 text-ink-soft hover:text-ink"
      >
        <Icon aria-hidden="true" />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      disabled={!text}
      className="h-11 min-w-32 rounded-full border-control bg-card px-5 text-ink hover:bg-paper-deep"
    >
      <Icon aria-hidden="true" />
      {label}
    </Button>
  );
}
