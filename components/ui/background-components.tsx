"use client";

import { cn } from "@/lib/utils";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { useTheme } from "next-themes";

export const BackgroundGlow = ({ children, className }: { children?: React.ReactNode; className?: string }) => {
  const { resolvedTheme } = useTheme();

  return (
    <div className={cn("min-h-screen w-full relative bg-white dark:bg-black", className)}>
      {/* Soft Yellow Glow */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at center, #FFF991 0%, transparent 70%)
          `,
          opacity: 0.6,
          mixBlendMode: "multiply",
        }}
      />
      {/* Animated Grid Pattern */}
      <AnimatedGridPattern
        numSquares={50}
        maxOpacity={resolvedTheme === 'dark' ? 0.075 : 0.15}
        duration={3}
        repeatDelay={1}
        className={cn(
          "absolute inset-0 z-[1]",
          "skew-y-12",
        )}
      />
      {/* Your Content/Components */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
