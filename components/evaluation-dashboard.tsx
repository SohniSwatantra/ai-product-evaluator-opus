"use client";

import { type ProductEvaluation } from "@/types";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, ExternalLink, Sparkles, Users, Package, Target, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlowingShadow } from "@/components/ui/glowing-shadow";
import { AnchorIndicator, AnchorBadge } from "@/components/ui/anchor-indicator";
import { FactorRadarChart } from "@/components/charts/radar-chart";
import { MethodologyGauges } from "@/components/charts/methodology-gauges";
import { SSRDistributionChart } from "@/components/charts/ssr-distribution-chart";
import { ConfidenceBreakdown } from "@/components/charts/confidence-breakdown";
import { AnchorSimilarityDonut } from "@/components/charts/anchor-similarity-donut";
import { AgentExperienceSection } from "@/components/agent-experience-section";
import { ExportShareButtons } from "@/components/export-share-buttons";
import { SectionRecommendations } from "@/components/section-recommendations";
import { AuthGate } from "@/components/auth-gate";
import { useUser } from "@stackframe/stack";

interface EvaluationDashboardProps {
  evaluation: ProductEvaluation;
  onNewAnalysis: () => void;
}

export function EvaluationDashboard({ evaluation, onNewAnalysis }: EvaluationDashboardProps) {
  const user = useUser();

  // Normalize demographics to handle legacy format
  const normalizedEvaluation = {
    ...evaluation,
    targetDemographics: {
      ageRange: evaluation.targetDemographics?.ageRange || (evaluation.targetDemographics as any)?.age || "25-34",
      gender: evaluation.targetDemographics?.gender || "all",
      incomeTier: evaluation.targetDemographics?.incomeTier || (evaluation.targetDemographics as any)?.income || "medium",
      region: evaluation.targetDemographics?.region || "north-america",
      ...(evaluation.targetDemographics?.ethnicity && { ethnicity: evaluation.targetDemographics.ethnicity }),
    }
  };

  const scoreColor = normalizedEvaluation.overallScore >= 70 ? "text-green-600 dark:text-green-400" : normalizedEvaluation.overallScore >= 40 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400";
  const probabilityColor = normalizedEvaluation.buyingIntentProbability >= 70 ? "text-green-600 dark:text-green-400" : normalizedEvaluation.buyingIntentProbability >= 40 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400";

  return (
    <>
      <div id="evaluation-report" className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onNewAnalysis}
          className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Analyze Another Product</span>
        </button>
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          {new Date(normalizedEvaluation.timestamp).toLocaleString()}
        </div>
      </div>

      {/* Product URL */}
      <div className="p-6 rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-2">Analyzed Product</h3>
            <p className="font-mono text-sm break-all text-black dark:text-white">{normalizedEvaluation.url}</p>
          </div>
          <a
            href={normalizedEvaluation.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black/5 dark:bg-white/10 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/20 transition-colors text-sm font-medium whitespace-nowrap"
          >
            <ExternalLink className="w-4 h-4" />
            View Product
          </a>
        </div>
      </div>

      {/* Product Screenshot & Name - Compact Top Section */}
      {normalizedEvaluation.websiteSnapshot && (
        <div className="p-6 rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
          <div className="flex flex-col gap-4">
            {/* Hero Screenshot - Header and Hero Section Only (or full screenshot for old evaluations) */}
            <div className="w-full">
              <div className="rounded-lg overflow-hidden border border-black/10 dark:border-white/10 shadow-lg">
                <img
                  src={normalizedEvaluation.websiteSnapshot.heroScreenshotBase64 || normalizedEvaluation.websiteSnapshot.heroScreenshotPath || normalizedEvaluation.websiteSnapshot.screenshotPath}
                  alt={normalizedEvaluation.websiteSnapshot.heroScreenshotPath ? "Website Header and Hero Section" : "Website Screenshot"}
                  className="w-full h-auto object-cover object-top"
                  style={{ maxHeight: '500px' }}
                />
              </div>
            </div>

            {/* Product Name */}
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-2">Hero Section - Headline</h3>
              <p className="text-2xl font-bold text-black dark:text-white">{normalizedEvaluation.websiteSnapshot.productName}</p>
            </div>
          </div>
        </div>
      )}

      {/* Target Audience & Product Attributes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Target Audience Demographics */}
        <div className="p-6 rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-black dark:text-white" />
            <h3 className="text-lg font-semibold text-black dark:text-white">Target Audience</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-600 dark:text-neutral-400">Age Range:</span>
              <span className="font-semibold text-black dark:text-white">{normalizedEvaluation.targetDemographics.ageRange} years</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600 dark:text-neutral-400">Gender:</span>
              <span className="font-semibold text-black dark:text-white capitalize">{normalizedEvaluation.targetDemographics.gender}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600 dark:text-neutral-400">Income Level:</span>
              <span className="font-semibold text-black dark:text-white capitalize">{normalizedEvaluation.targetDemographics.incomeTier}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600 dark:text-neutral-400">Region:</span>
              <span className="font-semibold text-black dark:text-white capitalize">{normalizedEvaluation.targetDemographics.region.replace('-', ' ')}</span>
            </div>
            {normalizedEvaluation.targetDemographics.ethnicity && (
              <div className="flex justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">Ethnicity:</span>
                <span className="font-semibold text-black dark:text-white">{normalizedEvaluation.targetDemographics.ethnicity}</span>
              </div>
            )}
          </div>
        </div>

        {/* Product Attributes */}
        <div className="p-6 rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-black dark:text-white" />
            <h3 className="text-lg font-semibold text-black dark:text-white">Product Attributes</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-600 dark:text-neutral-400">Category:</span>
              <span className="font-semibold text-black dark:text-white">{normalizedEvaluation.productAttributes?.category || 'Not specified'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600 dark:text-neutral-400">Price Tier:</span>
              <span className="font-semibold text-black dark:text-white capitalize">{normalizedEvaluation.productAttributes?.priceTier || 'Not specified'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600 dark:text-neutral-400">Source:</span>
              <span className="font-semibold text-black dark:text-white">{normalizedEvaluation.productAttributes?.conceptSource || 'Not specified'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Intent Anchor - PROMINENT DISPLAY */}
      <div className="p-8 rounded-2xl border-2 border-black/20 dark:border-white/20 bg-gradient-to-br from-white to-neutral-50 dark:from-black dark:to-neutral-900 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-6 h-6 text-black dark:text-white" />
          <h3 className="text-2xl font-semibold text-black dark:text-white">Purchase Intent Prediction</h3>
        </div>
        <AnchorIndicator
          anchor={normalizedEvaluation.purchaseIntentAnchor}
          probability={normalizedEvaluation.buyingIntentProbability}
          className="mt-4"
        />
        <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
          Based on the three-tier anchor system that we developed based on research, this represents the likelihood that your target demographic would purchase this product
        </p>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <GlowingShadow
          glowColor="rgba(34, 197, 94, 0.3)"
          shadowIntensity="medium"
        >
          <div className="p-8 rounded-2xl border-2 border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400 mb-2">Overall Score</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-4">Factor-based analysis</p>
            <div className={cn("text-6xl font-bold mb-2", scoreColor)}>
              {normalizedEvaluation.overallScore}
              <span className="text-2xl">/100</span>
            </div>
            <div className="w-full h-3 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={cn("h-full transition-all", scoreColor.replace("text-", "bg-"))}
                style={{ width: `${normalizedEvaluation.overallScore}%` }}
              />
            </div>
          </div>
        </GlowingShadow>

        <GlowingShadow
          glowColor="rgba(59, 130, 246, 0.3)"
          shadowIntensity="medium"
        >
          <div className="p-8 rounded-2xl border-2 border-black/20 dark:border-white/20 bg-black/5 dark:bg-white/5 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400 mb-2">Buying Intent Probability</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-4">
              {normalizedEvaluation.ssrScore ? "SSR methodology - 90% human correlation" : "Factor-based estimate"}
            </p>
            <div className={cn("text-6xl font-bold mb-2", probabilityColor)}>
              {normalizedEvaluation.buyingIntentProbability}
              <span className="text-2xl">%</span>
            </div>
            <div className="w-full h-3 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={cn("h-full transition-all", probabilityColor.replace("text-", "bg-"))}
                style={{ width: `${normalizedEvaluation.buyingIntentProbability}%` }}
              />
            </div>
            {normalizedEvaluation.ssrConfidence && (
              <div className="mt-3 text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
                <div>
                  Overall Confidence: <span className="font-semibold">{normalizedEvaluation.ssrConfidence}%</span>
                </div>
                {normalizedEvaluation.ssrMarginConfidence !== undefined && (
                  <div className="text-xs opacity-75">
                    (Entropy + Margin: {normalizedEvaluation.ssrMarginConfidence.toFixed(0)}%)
                  </div>
                )}
              </div>
            )}
          </div>
        </GlowingShadow>
      </div>

      {/* Methodology Comparison - NEW! */}
      {normalizedEvaluation.methodologyComparison && (
        <div className={cn(
          "p-8 rounded-2xl border-2 backdrop-blur-sm",
          normalizedEvaluation.methodologyComparison.agreement === "high"
            ? "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/20"
            : normalizedEvaluation.methodologyComparison.agreement === "medium"
            ? "border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/20"
            : "border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/20"
        )}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className={cn(
              "w-6 h-6",
              normalizedEvaluation.methodologyComparison.agreement === "high"
                ? "text-green-600 dark:text-green-400"
                : normalizedEvaluation.methodologyComparison.agreement === "medium"
                ? "text-yellow-600 dark:text-yellow-400"
                : "text-orange-600 dark:text-orange-400"
            )} />
            <h3 className="text-2xl font-semibold text-black dark:text-white">Methodology Comparison</h3>
            <div className={cn(
              "ml-auto px-4 py-2 rounded-full text-sm font-bold uppercase",
              normalizedEvaluation.methodologyComparison.agreement === "high"
                ? "bg-green-500/20 text-green-700 dark:text-green-300"
                : normalizedEvaluation.methodologyComparison.agreement === "medium"
                ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300"
                : "bg-orange-500/20 text-orange-700 dark:text-orange-300"
            )}>
              {normalizedEvaluation.methodologyComparison.agreement} Agreement
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="p-4 rounded-lg bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10">
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Factor-Based Score</p>
              <p className="text-3xl font-bold text-black dark:text-white">{normalizedEvaluation.methodologyComparison.factorScore}</p>
              <p className="text-xs text-neutral-500 mt-1">Product analysis</p>
            </div>
            <div className="p-4 rounded-lg bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10">
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">SSR Score</p>
              <p className="text-3xl font-bold text-black dark:text-white">{normalizedEvaluation.methodologyComparison.ssrScore}</p>
              <p className="text-xs text-neutral-500 mt-1">Human behavior</p>
            </div>
            <div className="p-4 rounded-lg bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10">
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Confidence Level</p>
              <p className="text-3xl font-bold text-black dark:text-white">{normalizedEvaluation.methodologyComparison.confidenceLevel}%</p>
              <p className="text-xs text-neutral-500 mt-1">Prediction reliability</p>
            </div>
          </div>

          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
            {normalizedEvaluation.methodologyComparison.explanation}
          </p>

          {/* Methodology Gauges Visualization */}
          <div className="mt-6">
            <MethodologyGauges
              factorScore={normalizedEvaluation.methodologyComparison.factorScore}
              ssrScore={normalizedEvaluation.methodologyComparison.ssrScore}
              agreement={normalizedEvaluation.methodologyComparison.agreement}
            />
          </div>

          <div className="mt-4 p-4 rounded-lg bg-white dark:bg-neutral-900 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              <span className="font-semibold">Research-Based:</span> This comparison combines insights from our in depth research on AI Agent behaviour buying and ability of LLM's to reproduce human purchase intent characteristics
            </p>
          </div>
        </div>
      )}

      {/* Textual Analysis - NEW! - LAST SECTION BEFORE AUTH GATE */}
      {normalizedEvaluation.textualAnalysis && (
        <div className="p-8 rounded-2xl border-2 border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/20 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <h3 className="text-2xl font-semibold text-black dark:text-white">Demographic-Specific Purchase Intent</h3>
          </div>
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
            {normalizedEvaluation.textualAnalysis}
          </p>
          <div className="mt-4 p-4 rounded-lg bg-white dark:bg-neutral-900 border border-purple-200 dark:border-purple-800">
            <p className="text-sm text-purple-900 dark:text-purple-200">
              <span className="font-semibold">SSR Methodology:</span> This textual response was converted to embeddings and compared against reference anchors using cosine similarity to predict purchase intent with 90% correlation to human behavior.
            </p>
          </div>
        </div>
      )}

      {/* AUTH GATE - Show for non-authenticated users */}
      {!user && <AuthGate />}

      {/* PROTECTED CONTENT - Always rendered with conditional blur */}
      <div className={!user ? "protected-content-blur" : ""}>
      {/* SSR Distribution Visualization - ENHANCED WITH CHART! */}
      {normalizedEvaluation.ssrDistribution && (
        <div className="p-8 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/20 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-2xl font-semibold text-black dark:text-white">Purchase Intent Distribution (Likert Scale)</h3>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
            Probability distribution across 5-point Likert scale (1 = Definitely won't buy, 5 = Definitely will buy)
          </p>

          {/* Enhanced Chart Visualization */}
          <SSRDistributionChart distribution={normalizedEvaluation.ssrDistribution} />

          <div className="mt-4 p-4 rounded-lg bg-white dark:bg-neutral-900 border border-indigo-200 dark:border-indigo-800">
            <p className="text-sm text-indigo-900 dark:text-indigo-200">
              <span className="font-semibold">SSR Methodology:</span> This probability distribution is calculated by comparing the textual response to reference anchors using semantic similarity, producing a Likert-scale rating that correlates 90% with human purchase intent.
            </p>
          </div>
        </div>
      )}

      {/* Confidence Breakdown - NEW! */}
      {normalizedEvaluation.ssrConfidence && (
        <div className="p-8 rounded-2xl border-2 border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-900/20 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            <h3 className="text-2xl font-semibold text-black dark:text-white">Confidence Metrics Breakdown</h3>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
            Our dual-metric confidence system combines entropy (distribution spread) and margin (decisiveness) for robust prediction reliability.
          </p>
          <ConfidenceBreakdown
            ssrConfidence={normalizedEvaluation.ssrConfidence}
            ssrMarginConfidence={normalizedEvaluation.ssrMarginConfidence}
          />
        </div>
      )}

      {/* Anchor Similarity Analysis - NEW! */}
      {normalizedEvaluation.ssrDistribution && (
        <div className="p-8 rounded-2xl border-2 border-cyan-200 dark:border-cyan-800 bg-cyan-50/50 dark:bg-cyan-900/20 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            <h3 className="text-2xl font-semibold text-black dark:text-white">Semantic Anchor Analysis</h3>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
            This visualization shows how closely the textual analysis aligns with each purchase intent tier (Low/Middle/High) based on semantic similarity to reference statements.
          </p>
          <AnchorSimilarityDonut anchorSimilarities={[
            { tier: "low", similarity: normalizedEvaluation.ssrDistribution.rating1 + normalizedEvaluation.ssrDistribution.rating2 },
            { tier: "middle", similarity: normalizedEvaluation.ssrDistribution.rating3 },
            { tier: "high", similarity: normalizedEvaluation.ssrDistribution.rating4 + normalizedEvaluation.ssrDistribution.rating5 }
          ]} />
        </div>
      )}

      {/* Agent Experience (AX) Section - UNIQUE DIFFERENTIATOR! */}
      {normalizedEvaluation.agentExperience && (
        <AgentExperienceSection agentExperience={normalizedEvaluation.agentExperience} />
      )}

      {/* Evaluation Factors */}
      <div className="p-8 rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
        <h3 className="text-2xl font-semibold mb-6 text-black dark:text-white">Evaluation Factors</h3>

        {/* Radar Chart Visualization */}
        <div className="mb-8 p-6 rounded-xl bg-neutral-50 dark:bg-neutral-900/50">
          <h4 className="text-lg font-semibold mb-4 text-center text-black dark:text-white">6-Factor Analysis Breakdown</h4>
          <FactorRadarChart factors={normalizedEvaluation.factors} />
        </div>

        {/* Factor Cards */}
        <div className="space-y-2">
          {normalizedEvaluation.factors.map((factor) => (
            <FactorCard key={factor.name} factor={factor} />
          ))}
        </div>
      </div>

      {/* AI Analysis */}
      <div className="p-8 rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-black dark:text-white" />
          <h3 className="text-2xl font-semibold text-black dark:text-white">AI Analysis</h3>
        </div>
        <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">{normalizedEvaluation.analysis}</p>
      </div>

      {/* Demographic Impact - NEW! */}
      <div className="p-8 rounded-2xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-2xl font-semibold text-black dark:text-white">Demographic Impact Analysis</h3>
        </div>
        <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">{normalizedEvaluation.demographicImpact}</p>
        <div className="mt-4 p-4 rounded-lg bg-white dark:bg-neutral-900 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-900 dark:text-blue-200">
            <span className="font-semibold">Research-Based:</span> This analysis is based on the methodology from our research which found that demographics significantly influence purchase intent across different product categories.
          </p>
        </div>
      </div>

      {/* Live Website Details - Bottom Section */}
      {normalizedEvaluation.websiteSnapshot && (
        <div className="p-8 rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-6">
            <Package className="w-6 h-6 text-black dark:text-white" />
            <h3 className="text-2xl font-semibold text-black dark:text-white">Live Website Snapshot</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Full Screenshot */}
            <div>
              <div className="rounded-xl overflow-hidden border-2 border-black/10 dark:border-white/10 shadow-2xl">
                <img
                  src={normalizedEvaluation.websiteSnapshot.heroScreenshotBase64 || normalizedEvaluation.websiteSnapshot.screenshotPath}
                  alt="Website Screenshot"
                  className="w-full h-auto"
                />
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 text-center">
                Captured at {new Date(normalizedEvaluation.timestamp).toLocaleString()}
              </p>
            </div>

            {/* Product Details */}
            <div className="space-y-4">
              {normalizedEvaluation.websiteSnapshot.description && normalizedEvaluation.websiteSnapshot.description !== "Connect with expert developers to fix your code, optimize performance, and ensure security." && (
                <div>
                  <h4 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-2">Description</h4>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{normalizedEvaluation.websiteSnapshot.description}</p>
                </div>
              )}

              {normalizedEvaluation.websiteSnapshot.keyFeatures.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-2">Key Features</h4>
                  <ul className="space-y-1">
                    {normalizedEvaluation.websiteSnapshot.keyFeatures.slice(0, 5).map((feature, index) => (
                      <li key={index} className="text-sm text-neutral-700 dark:text-neutral-300 flex items-start gap-2">
                        <span className="text-black dark:text-white mt-1">•</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Section-by-Section Recommendations - NEW ENHANCED VIEW */}
      {normalizedEvaluation.sectionedRecommendations && normalizedEvaluation.sectionedRecommendations.length > 0 ? (
        <SectionRecommendations sections={normalizedEvaluation.sectionedRecommendations} />
      ) : null}

      {/* Legacy Recommendations - Fallback or Additional */}
      <div className="p-8 rounded-2xl border-2 border-black/20 dark:border-white/20 bg-black/5 dark:bg-white/5 backdrop-blur-sm">
        <h3 className="text-2xl font-semibold mb-2 text-black dark:text-white">
          {normalizedEvaluation.sectionedRecommendations && normalizedEvaluation.sectionedRecommendations.length > 0 ? "Additional Recommendations" : "Recommendations"}
        </h3>
        <ul className="space-y-1.5">
          {normalizedEvaluation.recommendations.map((recommendation, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-black/10 dark:bg-white/20 text-black dark:text-white flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">
                {index + 1}
              </div>
              <p className="text-neutral-700 dark:text-neutral-300">{recommendation}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Divider */}
      <div className="border-t border-black/10 dark:border-white/10 my-8"></div>

      {/* Export & Share Buttons */}
      <ExportShareButtons
        evaluation={evaluation}
        elementId="evaluation-report"
      />
      </div>
      {/* END PROTECTED CONTENT */}
      </div>
    </>
  );
}

function FactorCard({ factor }: { factor: any }) {
  const getImpactIcon = () => {
    switch (factor.impact) {
      case "positive":
        return <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case "negative":
        return <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />;
      default:
        return <Minus className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
    }
  };

  const getScoreColor = () => {
    if (factor.score >= 70) return "text-green-600 dark:text-green-400 bg-green-500/10";
    if (factor.score >= 40) return "text-yellow-600 dark:text-yellow-400 bg-yellow-500/10";
    return "text-red-600 dark:text-red-400 bg-red-500/10";
  };

  return (
    <div className="p-6 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {getImpactIcon()}
          <h4 className="font-semibold text-black dark:text-white">{factor.name}</h4>
        </div>
        <div className={cn("px-3 py-1 rounded-full text-sm font-semibold", getScoreColor())}>
          {factor.score}/100
        </div>
      </div>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">{factor.description}</p>
      <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
        <span>Weight:</span>
        <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-black dark:bg-white"
            style={{ width: `${factor.weight * 100}%` }}
          />
        </div>
        <span>{Math.round(factor.weight * 100)}%</span>
      </div>
    </div>
  );
}
