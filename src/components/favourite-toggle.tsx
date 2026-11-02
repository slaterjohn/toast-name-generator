import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Toggle button. The label stays constant ("Favourite") and the state is
 * conveyed through aria-pressed, as recommended for toggle buttons.
 */
export function FavouriteToggle({
  pressed,
  onToggle,
  disabled,
}: {
  pressed: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      aria-pressed={pressed}
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "h-11 min-w-32 rounded-full border-control bg-card px-5 text-ink hover:bg-paper-deep",
        pressed && "border-oxblood text-oxblood",
      )}
    >
      <Star aria-hidden="true" className={cn(pressed && "fill-current")} />
      Favourite
    </Button>
  );
}
