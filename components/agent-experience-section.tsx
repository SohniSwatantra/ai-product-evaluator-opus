"use client";

import { Bot, CheckCircle2, AlertCircle, XCircle, Info } from "lucide-react";
import type { AgentExperience } from "@/types";
import { AXScoreGauge } from "@/components/charts/ax-score-gauge";
import { cn } from "@/lib/utils";

interface AgentExperienceSectionProps {
  agentExperience: AgentExperience;
}

export function AgentExperienceSection({ agentExperience }: AgentExperienceSectionProps) {
  const { axScore, anps, factors, agentAccessibility, recommendations } = agentExperience;

  const getFactorIcon = (status: string) => {
    switch (status) {
      case "excellent":
        return <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case "good":
        return <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
      case "needs-improvement":
        return <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />;
    }
  };

  const getFactorColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/20";
      case "good":
        return "border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/20";
      case "needs-improvement":
        return "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/20";
      default:
        return "border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20";
    }
  };

  return (
    <div className="p-8 rounded-2xl border-2 border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/20 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <Bot className="w-8 h-8 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-2xl font-semibold text-black dark:text-white mb-2">
            Agent Experience (AX)
          </h3>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-purple-100 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-800">
            <Info className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-purple-900 dark:text-purple-200">
              <strong>What is AX?</strong> Agent Experience measures how easily AI agents (like ChatGPT, Claude, Perplexity) can access, read, and understand your website. Good AX means agents can quickly grasp what your product does, who it's for, and how to get information—leading to better AI-powered recommendations and visibility.
            </p>
          </div>
        </div>
      </div>

      {/* AX Score Gauges */}
      <div className="mb-8">
        <AXScoreGauge axScore={axScore} anps={anps} />
      </div>

      {/* Factor Breakdown */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-black dark:text-white mb-4">
          7-Factor Agent Experience Analysis
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {factors.map((factor) => (
            <div
              key={factor.name}
              className={cn(
                "p-4 rounded-xl border-2 transition-all",
                getFactorColor(factor.status)
              )}
            >
              <div className="flex items-start gap-3 mb-2">
                {getFactorIcon(factor.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="font-semibold text-black dark:text-white text-sm">
                      {factor.name}
                    </h5>
                    <span className="text-sm font-bold text-black dark:text-white whitespace-nowrap">
                      {factor.score}/100
                    </span>
                  </div>
                  <p className="text-xs text-neutral-700 dark:text-neutral-300 mt-1">
                    {factor.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Agent Accessibility Analysis */}
      <div className="mb-8 p-6 rounded-xl bg-white dark:bg-neutral-900 border border-purple-200 dark:border-purple-800">
        <h4 className="text-lg font-semibold text-black dark:text-white mb-3">
          Agent Accessibility Analysis
        </h4>
        <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
          {agentAccessibility}
        </p>
      </div>

      {/* Recommendations */}
      <div className="p-6 rounded-xl bg-white dark:bg-neutral-900 border border-purple-200 dark:border-purple-800">
        <h4 className="text-lg font-semibold text-black dark:text-white mb-4">
          Recommendations to Improve Agent Experience
        </h4>
        <ul className="space-y-3">
          {Array.isArray(recommendations) ? (
            recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">
                  {index + 1}
                </div>
                <p className="text-neutral-700 dark:text-neutral-300">{recommendation}</p>
              </li>
            ))
          ) : (
            <li className="text-neutral-600 dark:text-neutral-400 italic">No recommendations available</li>
          )}
        </ul>
      </div>

      {/* Footer Note */}
      <div className="mt-6 p-4 rounded-lg bg-purple-100 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-800">
        <p className="text-xs text-purple-900 dark:text-purple-200">
          <strong>Why AX Matters:</strong> Based on Netlify CEO Matt Biilmann's Agent Net Promoter Score (ANPS) concept. As AI agents become primary information gatekeepers, optimizing for agent experience will be as critical as traditional SEO. Websites with high AX scores will be more likely recommended by AI assistants to users.
        </p>
      </div>
    </div>
  );
}
