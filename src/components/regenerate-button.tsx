import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RegenerateButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <Button
      type="button"
      size="lg"
      onClick={onClick}
      disabled={disabled}
      className="h-12 min-w-48 rounded-full px-8 text-base font-semibold tracking-wide shadow-[0_1px_0_rgb(0_0_0/0.15)] hover:bg-oxblood-hover active:translate-y-px"
    >
      <RefreshCw aria-hidden="true" className="size-4" />
      Regenerate
    </Button>
  );
}
