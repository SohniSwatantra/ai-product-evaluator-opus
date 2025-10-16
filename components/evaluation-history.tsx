"use client";

import { useState, useEffect } from "react";
import { type ProductEvaluation } from "@/types";
import { Clock, TrendingUp, Target, ExternalLink, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnchorBadge } from "@/components/ui/anchor-indicator";

interface EvaluationHistoryProps {
  onSelectEvaluation?: (evaluation: ProductEvaluation) => void;
  limit?: number;
}

export function EvaluationHistory({ onSelectEvaluation, limit = 10 }: EvaluationHistoryProps) {
  const [evaluations, setEvaluations] = useState<ProductEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/evaluations?limit=${limit}`);

      if (!response.ok) {
        throw new Error("Failed to fetch evaluations");
      }

      const data = await response.json();
      setEvaluations(data.evaluations || []);
    } catch (err) {
      console.error("Error fetching evaluations:", err);
      setError(err instanceof Error ? err.message : "Failed to load evaluations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, [limit]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
        <p className="text-red-600 dark:text-red-400 text-center">{error}</p>
        <button
          onClick={fetchEvaluations}
          className="mt-4 mx-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  if (evaluations.length === 0) {
    return (
      <div className="p-12 rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-sm text-center">
        <p className="text-neutral-600 dark:text-neutral-400">
          No evaluations yet. Start by analyzing your first product!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-black dark:text-white">
          Recent Evaluations ({evaluations.length})
        </h3>
        <button
          onClick={fetchEvaluations}
          className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
        </button>
      </div>

      <div className="space-y-3">
        {evaluations.map((evaluation, index) => (
          <EvaluationCard
            key={index}
            evaluation={evaluation}
            onClick={() => onSelectEvaluation?.(evaluation)}
          />
        ))}
      </div>
    </div>
  );
}

interface EvaluationCardProps {
  evaluation: ProductEvaluation;
  onClick?: () => void;
}

function EvaluationCard({ evaluation, onClick }: EvaluationCardProps) {
  const scoreColor = evaluation.buyingIntentProbability >= 67
    ? "text-green-600 dark:text-green-400"
    : evaluation.buyingIntentProbability >= 34
    ? "text-yellow-600 dark:text-yellow-400"
    : "text-red-600 dark:text-red-400";

  return (
    <div
      className={cn(
        "p-4 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 transition-all",
        onClick && "cursor-pointer hover:border-black/20 dark:hover:border-white/20 hover:shadow-md"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: URL and Demographics */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <a
              href={evaluation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-black dark:text-white hover:underline truncate flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              {new URL(evaluation.url).hostname}
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
            <span className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              {evaluation.targetDemographics?.ageRange || (evaluation.targetDemographics as any)?.age || 'N/A'} • {evaluation.targetDemographics?.gender || 'N/A'} • {evaluation.targetDemographics?.incomeTier || (evaluation.targetDemographics as any)?.income || 'N/A'}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(evaluation.timestamp).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Right: Scores */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-center">
            <div className={cn("text-2xl font-bold", scoreColor)}>
              {evaluation.buyingIntentProbability}%
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-500">Intent</div>
          </div>

          <AnchorBadge anchor={evaluation.purchaseIntentAnchor} size="sm" />
        </div>
      </div>

      {/* Product Category */}
      {evaluation.productAttributes && (
        <div className="mt-2 pt-2 border-t border-black/5 dark:border-white/10">
          <div className="text-xs text-neutral-600 dark:text-neutral-400">
            <span className="font-semibold">{evaluation.productAttributes.category}</span>
            {" • "}
            <span className="capitalize">{evaluation.productAttributes.priceTier} tier</span>
            {evaluation.ssrScore && (
              <>
                {" • "}
                <span>SSR: {evaluation.ssrScore}%</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
