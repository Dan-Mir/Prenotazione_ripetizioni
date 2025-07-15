// TimeSlot.tsx
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface TimeSlotProps {
  time: string;
  isAvailable: boolean;
  isSelected: boolean;
  onClick: () => void;
}

export function TimeSlot({ time, isAvailable, isSelected, onClick }: TimeSlotProps) {
  return (
    <Button
      variant="outline"
      className={cn(
        "w-full transition-all duration-200",
        isAvailable ? "hover:scale-105" : "opacity-50 cursor-not-allowed",
        isSelected && "bg-primary text-primary-foreground hover:bg-primary"
      )}
      disabled={!isAvailable}
      onClick={onClick}
      title={!isAvailable ? "This time slot is unavailable" : ""}
    >
      {time}
    </Button>
  );
}
