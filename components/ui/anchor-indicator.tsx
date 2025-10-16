import { type PurchaseIntentAnchor } from "@/types";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnchorIndicatorProps {
  anchor: PurchaseIntentAnchor;
  probability: number;
  className?: string;
  showLabel?: boolean;
}

export function AnchorIndicator({ anchor, probability, className, showLabel = true }: AnchorIndicatorProps) {
  const config = {
    low: {
      icon: TrendingDown,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
      label: "LOW INTENT",
      description: "Unlikely to Purchase",
      emoji: "🔴"
    },
    middle: {
      icon: Minus,
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/30",
      label: "MIDDLE INTENT",
      description: "Uncertain/Indifferent",
      emoji: "🟡"
    },
    high: {
      icon: TrendingUp,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
      label: "HIGH INTENT",
      description: "Strong Purchase Intent",
      emoji: "🟢"
    }
  };

  const { icon: Icon, color, bgColor, borderColor, label, description, emoji } = config[anchor];

  return (
    <div className={cn("flex items-center gap-4", className)}>
      {/* Visual Indicator */}
      <div className={cn(
        "flex items-center justify-center w-16 h-16 rounded-full",
        bgColor,
        borderColor,
        "border-2"
      )}>
        <Icon className={cn("w-8 h-8", color)} />
      </div>

      {/* Text Info */}
      {showLabel && (
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{emoji}</span>
            <h4 className={cn("text-lg font-bold", color)}>{label}</h4>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {description} <span className={cn("font-semibold", color)}>({probability}%)</span>
          </p>
        </div>
      )}
    </div>
  );
}

// Compact version for smaller spaces
export function AnchorBadge({ anchor, className }: { anchor: PurchaseIntentAnchor; className?: string }) {
  const config = {
    low: {
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-500/10",
      label: "LOW",
      emoji: "🔴"
    },
    middle: {
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-500/10",
      label: "MIDDLE",
      emoji: "🟡"
    },
    high: {
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-500/10",
      label: "HIGH",
      emoji: "🟢"
    }
  };

  const { color, bgColor, label, emoji } = config[anchor];

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold",
      bgColor,
      color,
      className
    )}>
      <span>{emoji}</span>
      {label}
    </span>
  );
}
