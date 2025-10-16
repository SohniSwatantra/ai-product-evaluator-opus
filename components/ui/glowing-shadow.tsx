"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface GlowingShadowProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  shadowIntensity?: "low" | "medium" | "high";
}

export function GlowingShadow({
  children,
  className,
  glowColor = "rgba(0, 0, 0, 0.2)",
  shadowIntensity = "medium",
}: GlowingShadowProps) {
  return (
    <div className={cn("relative", className)}>
      {/* Glowing shadow layer */}
      <div
        className="absolute inset-0 rounded-2xl blur-2xl opacity-30 animate-pulse"
        style={{
          background: glowColor,
          zIndex: -1,
        }}
      />
      {/* Content wrapper */}
      <div className="relative">
        {children}
      </div>
    </div>
  );
}
