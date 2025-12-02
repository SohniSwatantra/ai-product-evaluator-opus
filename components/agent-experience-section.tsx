"use client";

import { useState, useEffect, useCallback } from "react";
import { Bot, CheckCircle2, AlertCircle, XCircle, Info, Play, Loader2, Users, RefreshCw, Star } from "lucide-react";
import type { AgentExperience, AXModelConfig, AXModelEvaluation, AXCouncilResult } from "@/types";
import { AXScoreGauge } from "@/components/charts/ax-score-gauge";
import { cn } from "@/lib/utils";

interface AgentExperienceSectionProps {
  agentExperience: AgentExperience;
  evaluationId?: number;
  isShowcase?: boolean; // Disable model buttons for showcase evaluations
}

interface ModelTabStatus {
  model_id: string;
  display_name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  ax_score: number | null;
  anps: number | null;
}

export function AgentExperienceSection({ agentExperience, evaluationId, isShowcase = false }: AgentExperienceSectionProps) {
  const [models, setModels] = useState<AXModelConfig[]>([]);
  const [modelStatuses, setModelStatuses] = useState<ModelTabStatus[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedModelData, setSelectedModelData] = useState<AXModelEvaluation | null>(null);
  const [councilResult, setCouncilResult] = useState<AXCouncilResult | null>(null);
  const [councilReady, setCouncilReady] = useState(false);
  const [processingModels, setProcessingModels] = useState<Set<string>>(new Set());
  const [runningCouncil, setRunningCouncil] = useState(false);

  // Use the passed agentExperience as default/initial data
  const { axScore, anps, factors, agentAccessibility, recommendations } =
    selectedModelData?.status === 'completed' && selectedModelData.ax_score !== null
      ? {
          axScore: selectedModelData.ax_score,
          anps: selectedModelData.anps || 0,
          factors: selectedModelData.ax_factors || [],
          agentAccessibility: selectedModelData.agent_accessibility || "",
          recommendations: selectedModelData.ax_recommendations || []
        }
      : councilResult
        ? {
            axScore: councilResult.final_ax_score,
            anps: councilResult.final_anps,
            factors: agentExperience.factors,
            agentAccessibility: councilResult.council_analysis,
            recommendations: agentExperience.recommendations
          }
        : agentExperience;

  // Fetch available models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch("/api/ax-models");
        const data = await response.json();
        if (data.success) {
          setModels(data.models);
        }
      } catch (error) {
        console.error("Error fetching AX models:", error);
      }
    };
    fetchModels();
  }, []);

  // Fetch evaluation status when evaluationId is available
  const fetchStatus = useCallback(async () => {
    if (!evaluationId) return;

    try {
      const response = await fetch(`/api/ax-evaluate/status/${evaluationId}`);
      const data = await response.json();
      if (data.success) {
        setModelStatuses(data.models);
        setCouncilReady(data.councilReady);
        setCouncilResult(data.councilResult);
      }
    } catch (error) {
      console.error("Error fetching AX status:", error);
    }
  }, [evaluationId]);

  useEffect(() => {
    if (evaluationId) {
      fetchStatus();
    }
  }, [evaluationId, fetchStatus]);

  // Run evaluation for a specific model
  const runModelEvaluation = async (modelId: string) => {
    if (!evaluationId) return;

    // Prevent duplicate runs
    if (processingModels.has(modelId)) return;

    // Add to processing set
    setProcessingModels(prev => new Set(prev).add(modelId));
    setSelectedModel(modelId);

    // Update status to processing
    setModelStatuses(prev =>
      prev.map(m => m.model_id === modelId ? { ...m, status: 'processing' as const } : m)
    );

    try {
      const response = await fetch(`/api/ax-evaluate/${evaluationId}/${modelId}`, {
        method: "POST"
      });
      const data = await response.json();

      if (data.success) {
        setSelectedModelData(data.evaluation);
        setModelStatuses(prev =>
          prev.map(m => m.model_id === modelId
            ? { ...m, status: 'completed', ax_score: data.evaluation.ax_score, anps: data.evaluation.anps }
            : m
          )
        );
      } else {
        setModelStatuses(prev =>
          prev.map(m => m.model_id === modelId ? { ...m, status: 'failed' } : m)
        );
      }
    } catch (error) {
      console.error("Error running AX evaluation:", error);
      setModelStatuses(prev =>
        prev.map(m => m.model_id === modelId ? { ...m, status: 'failed' } : m)
      );
    } finally {
      // Remove from processing set
      setProcessingModels(prev => {
        const next = new Set(prev);
        next.delete(modelId);
        return next;
      });
      // Refresh status to check if council is ready
      fetchStatus();
    }
  };

  // Fetch specific model's evaluation data
  const fetchModelData = async (modelId: string) => {
    if (!evaluationId) return;

    setSelectedModel(modelId);
    try {
      const response = await fetch(`/api/ax-evaluate/${evaluationId}/${modelId}`);
      const data = await response.json();
      if (data.success && data.evaluation?.status === 'completed') {
        setSelectedModelData(data.evaluation);
      }
    } catch (error) {
      console.error("Error fetching model data:", error);
    }
  };

  // Run AX Council
  const runCouncil = async () => {
    if (!evaluationId) return;

    setRunningCouncil(true);
    try {
      const response = await fetch(`/api/ax-council/${evaluationId}`, {
        method: "POST"
      });
      const data = await response.json();

      if (data.success) {
        setCouncilResult(data.result);
        setSelectedModel('council');
        setSelectedModelData(null);
      }
    } catch (error) {
      console.error("Error running AX council:", error);
    } finally {
      setRunningCouncil(false);
      fetchStatus();
    }
  };

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

  const getStatusFromEvaluationId = (modelId: string): ModelTabStatus | undefined => {
    return modelStatuses.find(m => m.model_id === modelId);
  };

  const allModelsComplete = modelStatuses.length > 0 && modelStatuses.every(m => m.status === 'completed');

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

      {/* Model Tabs - Always show if evaluationId is available */}
      {evaluationId && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">
              Multi-Model Evaluation
            </h4>
            <button
              onClick={fetchStatus}
              className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              title="Refresh status"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Default Claude Opus 4.5 (from initial evaluation) - Always first, green */}
            <button
              onClick={() => {
                setSelectedModel(null);
                setSelectedModelData(null);
              }}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all border-2",
                selectedModel === null && selectedModel !== 'council'
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white dark:bg-neutral-900 text-green-700 dark:text-green-400 border-green-500 dark:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
              )}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Claude Opus 4.5</span>
                <span className="ml-1 text-xs opacity-75">({agentExperience.axScore})</span>
              </div>
            </button>

            {/* Model tabs from API (configured via admin) */}
            {models.map((model) => {
              const status = getStatusFromEvaluationId(model.model_id);
              const isSelected = selectedModel === model.model_id;
              const isCompleted = status?.status === 'completed';
              const isProcessing = status?.status === 'processing' || processingModels.has(model.model_id);
              const isFailed = status?.status === 'failed';

              return (
                <button
                  key={model.model_id}
                  onClick={() => {
                    if (isShowcase) return; // Disable for showcase evaluations
                    if (isCompleted) {
                      fetchModelData(model.model_id);
                    } else if (!isProcessing) {
                      runModelEvaluation(model.model_id);
                    }
                  }}
                  disabled={isProcessing || (isShowcase && !isCompleted)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all border",
                    isSelected
                      ? "bg-purple-600 text-white border-purple-600"
                      : isCompleted
                        ? "bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-green-400 dark:border-green-600 hover:border-purple-400"
                        : isFailed
                          ? "bg-white dark:bg-neutral-900 text-red-600 dark:text-red-400 border-red-300 dark:border-red-700"
                          : "bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-purple-400",
                    isProcessing && "opacity-75 cursor-wait",
                    isShowcase && !isCompleted && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : isFailed ? (
                      <XCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    <span>{model.display_name}</span>
                    {isCompleted && status?.ax_score !== null && (
                      <span className="ml-1 text-xs opacity-75">({status.ax_score})</span>
                    )}
                  </div>
                </button>
              );
            })}

            {/* AX Council Tab - Always Yellow/Orange with tooltip when disabled */}
            <div className="relative group">
              <button
                onClick={() => {
                  if (isShowcase) return; // Disable for showcase evaluations
                  if (councilResult) {
                    setSelectedModel('council');
                    setSelectedModelData(null);
                  } else if (allModelsComplete) {
                    runCouncil();
                  }
                }}
                disabled={(!allModelsComplete && !councilResult) || (isShowcase && !councilResult)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all border-2",
                  selectedModel === 'council'
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-500"
                    : councilResult
                      ? "bg-white dark:bg-neutral-900 text-amber-700 dark:text-amber-400 border-amber-500 dark:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                      : allModelsComplete && !isShowcase
                        ? "bg-white dark:bg-neutral-900 text-amber-700 dark:text-amber-400 border-amber-400 dark:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                        : "bg-white dark:bg-neutral-900 text-amber-600/50 dark:text-amber-500/50 border-amber-300 dark:border-amber-700 cursor-not-allowed",
                  isShowcase && !councilResult && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex items-center gap-2">
                  {runningCouncil ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : councilResult ? (
                    <CheckCircle2 className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Users className="w-4 h-4" />
                  )}
                  <span>AX Council</span>
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  {councilResult && (
                    <span className="ml-1 text-xs opacity-75">({councilResult.final_ax_score})</span>
                  )}
                </div>
              </button>
              {/* Tooltip - show when disabled */}
              {((!allModelsComplete && !councilResult) || (isShowcase && !councilResult)) && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-neutral-900 dark:bg-neutral-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
                  {isShowcase ? "Model evaluations are disabled for showcase" : "Run all model evaluations first to unlock AX Council"}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-900 dark:border-t-neutral-800"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Council Result Display */}
      {selectedModel === 'council' && councilResult && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 border border-purple-200 dark:border-purple-700">
          <h4 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-3">
            AX Council Final Assessment
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {councilResult.model_scores.map((score) => (
              <div key={score.model_id} className="p-3 rounded-lg bg-white/60 dark:bg-black/20">
                <p className="text-xs text-neutral-600 dark:text-neutral-400">{score.display_name}</p>
                <p className="text-lg font-bold text-purple-700 dark:text-purple-300">{score.ax_score}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-purple-800 dark:text-purple-200 leading-relaxed">
            {councilResult.council_analysis}
          </p>
        </div>
      )}

      {/* AX Score Gauges */}
      <div className="mb-8">
        <AXScoreGauge axScore={axScore} anps={anps} />
      </div>

      {/* Factor Breakdown */}
      {factors && factors.length > 0 && (
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
      )}

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
