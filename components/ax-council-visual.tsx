"use client";

import { motion } from "framer-motion";
import { User, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { getProviderColor, getProviderFromModel } from "@/lib/ax-evaluator";
import type { AXCouncilResult } from "@/types";

interface AXCouncilVisualProps {
  councilResult: AXCouncilResult;
}

interface CouncilMemberProps {
  displayName: string;
  modelId: string;
  axScore: number | null;
  isLeader?: boolean;
  index: number;
}

function CouncilMember({ displayName, modelId, axScore, isLeader = false, index }: CouncilMemberProps) {
  const provider = isLeader ? 'council' : getProviderFromModel(modelId, displayName);
  const color = getProviderColor(provider);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="flex flex-col items-center"
    >
      {/* Score badge - floating above head */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: index * 0.1 + 0.2, type: "spring", stiffness: 200 }}
        className={cn(
          "mb-2 px-3 py-1 rounded-full shadow-lg font-bold text-lg",
          isLeader
            ? "bg-gradient-to-r from-amber-400 to-orange-500 text-white"
            : "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
        )}
        style={isLeader ? {} : { boxShadow: `0 4px 14px ${color}40` }}
      >
        {axScore !== null && axScore !== undefined ? axScore : "?"}
      </motion.div>

      {/* Avatar */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        className={cn(
          "rounded-full flex items-center justify-center border-4 transition-all",
          isLeader ? "w-24 h-24 md:w-28 md:h-28" : "w-16 h-16 md:w-20 md:h-20"
        )}
        style={{
          backgroundColor: `${color}20`,
          borderColor: color,
          boxShadow: `0 0 20px ${color}40`
        }}
      >
        {isLeader ? (
          <Crown
            className="w-10 h-10 md:w-12 md:h-12"
            style={{ color }}
          />
        ) : (
          <User
            className="w-8 h-8 md:w-10 md:h-10"
            style={{ color }}
          />
        )}
      </motion.div>

      {/* Name */}
      <span
        className={cn(
          "mt-2 text-center font-medium",
          isLeader
            ? "text-sm md:text-base text-amber-600 dark:text-amber-400"
            : "text-xs md:text-sm text-neutral-700 dark:text-neutral-300"
        )}
      >
        {displayName}
      </span>
    </motion.div>
  );
}

export function AXCouncilVisual({ councilResult }: AXCouncilVisualProps) {
  const { final_ax_score, model_scores } = councilResult;

  // Ensure we have model scores to display
  if (!model_scores || model_scores.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 p-4 sm:p-6 rounded-2xl bg-gradient-to-b from-neutral-900 to-neutral-950 dark:from-neutral-950 dark:to-black border border-neutral-800">
      {/* Header */}
      <div className="text-center mb-6">
        <h4 className="text-xl md:text-2xl font-bold text-white mb-1">
          AX Council
        </h4>
        <p className="text-xs md:text-sm text-neutral-400">
          Your Local Multi-Model AI Advisory Board
        </p>
      </div>

      {/* Council Layout - Desktop */}
      <div className="hidden md:block">
        {/* AX Council Leader at TOP - overseeing all models */}
        <div className="flex justify-center mb-8">
          <CouncilMember
            displayName="AX Council"
            modelId="council"
            axScore={final_ax_score}
            isLeader
            index={0}
          />
        </div>

        {/* All 5 models in a row below */}
        <div className="flex justify-center items-center gap-6 lg:gap-8">
          {model_scores.map((score, idx) => (
            <CouncilMember
              key={score.model_id}
              displayName={score.display_name}
              modelId={score.model_id}
              axScore={score.ax_score}
              index={idx + 1}
            />
          ))}
        </div>
      </div>

      {/* Council Layout - Mobile */}
      <div className="md:hidden">
        {/* Leader at top for mobile */}
        <div className="flex justify-center mb-6">
          <CouncilMember
            displayName="AX Council"
            modelId="council"
            axScore={final_ax_score}
            isLeader
            index={0}
          />
        </div>

        {/* Models in 2-column grid */}
        <div className="grid grid-cols-2 gap-4">
          {model_scores.map((score, idx) => (
            <div key={score.model_id} className="flex justify-center">
              <CouncilMember
                displayName={score.display_name}
                modelId={score.model_id}
                axScore={score.ax_score}
                index={idx + 1}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Decorative table line (desktop only) */}
      <div className="hidden md:block relative mt-4">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
      </div>
    </div>
  );
}
