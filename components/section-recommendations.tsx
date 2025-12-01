"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Lightbulb, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SectionRecommendation } from "@/types";

interface SectionRecommendationsProps {
  sections: SectionRecommendation[];
}

export function SectionRecommendations({ sections }: SectionRecommendationsProps) {
  if (!sections || sections.length === 0) {
    return null;
  }

  return (
    <div className="p-8 rounded-2xl border-2 border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/20 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-6">
        <Lightbulb className="w-7 h-7 text-purple-600 dark:text-purple-400" />
        <h3 className="text-2xl font-semibold text-black dark:text-white">
          Section-by-Section Analysis
        </h3>
      </div>

      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
        Detailed breakdown of each website section with targeted recommendations and visual context.
      </p>

      <div className="space-y-4">
        {sections.map((section, index) => (
          <SectionCard key={index} section={section} />
        ))}
      </div>

      <div className="mt-6 p-4 rounded-lg bg-white dark:bg-neutral-900 border border-purple-200 dark:border-purple-800">
        <p className="text-sm text-purple-900 dark:text-purple-200">
          <span className="font-semibold">💡 Pro Tip:</span> Focus on high-impact changes first. These recommendations are specifically tailored to improve conversion for your target demographic.
        </p>
      </div>
    </div>
  );
}

interface SectionCardProps {
  section: SectionRecommendation;
}

function SectionCard({ section }: SectionCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Determine color scheme based on score
  const getScoreColor = (score: number) => {
    if (score >= 70) return {
      text: "text-green-600 dark:text-green-400",
      bg: "bg-green-500/10",
      border: "border-green-200 dark:border-green-800",
      icon: "text-green-600 dark:text-green-400"
    };
    if (score >= 40) return {
      text: "text-yellow-600 dark:text-yellow-400",
      bg: "bg-yellow-500/10",
      border: "border-yellow-200 dark:border-yellow-800",
      icon: "text-yellow-600 dark:text-yellow-400"
    };
    return {
      text: "text-red-600 dark:text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-200 dark:border-red-800",
      icon: "text-red-600 dark:text-red-400"
    };
  };

  // Determine impact badge styling
  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case "high":
        return {
          text: "HIGH IMPACT",
          className: "bg-red-500/20 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700"
        };
      case "medium":
        return {
          text: "MEDIUM IMPACT",
          className: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700"
        };
      case "low":
        return {
          text: "LOW IMPACT",
          className: "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700"
        };
      default:
        return {
          text: "IMPACT",
          className: "bg-neutral-500/20 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700"
        };
    }
  };

  const scoreColors = getScoreColor(section.score);
  const impactBadge = getImpactBadge(section.impact);

  return (
    <div className={cn(
      "rounded-xl border-2 bg-white dark:bg-neutral-900 overflow-hidden transition-all",
      scoreColors.border
    )}>
      {/* Header - Always Visible */}
      <div
        className="p-5 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            {/* Score Badge */}
            <div className={cn(
              "px-4 py-2 rounded-lg text-center flex-shrink-0",
              scoreColors.bg
            )}>
              <div className={cn("text-2xl font-bold", scoreColors.text)}>
                {section.score}
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Score</div>
            </div>

            {/* Section Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-lg font-semibold text-black dark:text-white">
                  {section.section}
                </h4>
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-bold uppercase border",
                  impactBadge.className
                )}>
                  {impactBadge.text}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                <span className="flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {section.issues.length} issues
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  {section.recommendations.length} recommendations
                </span>
              </div>
            </div>
          </div>

          {/* Expand/Collapse Icon */}
          <button className="flex-shrink-0 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-neutral-200 dark:border-neutral-800">
          <div className="p-5 space-y-5">
            {/* Issues Found */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                <AlertCircle className={cn("w-4 h-4", scoreColors.icon)} />
                Issues Found
              </div>
              <ul className="space-y-2">
                {section.issues.map((issue, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                    <span className={cn("mt-1 flex-shrink-0", scoreColors.text)}>●</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Recommended Actions
              </div>
              <ul className="space-y-2">
                {section.recommendations.map((recommendation, idx) => (
                  <li key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <p className="text-sm text-neutral-800 dark:text-neutral-200">{recommendation}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
