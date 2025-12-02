/**
 * AX Council - Aggregates multi-model AX evaluations into a final score
 */

import { getAXModelEvaluations, getEnabledAXModelConfigs, saveAXCouncilResult } from "./db";
import { callOpenRouter } from "./openrouter";
import type { AXModelEvaluation, AXCouncilResult, AXModelConfig } from "@/types";

/**
 * Check if all enabled models have completed their evaluations
 */
export async function areAllModelsComplete(evaluationId: number): Promise<boolean> {
  const enabledModels = await getEnabledAXModelConfigs();
  const modelEvaluations = await getAXModelEvaluations(evaluationId);

  if (enabledModels.length === 0) {
    return false;
  }

  const completedModelIds = new Set(
    modelEvaluations
      .filter(e => e.status === 'completed')
      .map(e => e.model_id)
  );

  return enabledModels.every(model => completedModelIds.has(model.model_id));
}

/**
 * Calculate the weighted average of model scores
 */
function calculateAverageScore(evaluations: AXModelEvaluation[]): number {
  const validScores = evaluations
    .filter(e => e.status === 'completed' && e.ax_score !== null)
    .map(e => e.ax_score as number);

  if (validScores.length === 0) return 0;

  const sum = validScores.reduce((acc, score) => acc + score, 0);
  return Math.round(sum / validScores.length);
}

/**
 * Calculate the average ANPS from model evaluations
 */
function calculateAverageANPS(evaluations: AXModelEvaluation[]): number {
  const validANPS = evaluations
    .filter(e => e.status === 'completed' && e.anps !== null)
    .map(e => e.anps as number);

  if (validANPS.length === 0) return 0;

  const sum = validANPS.reduce((acc, anps) => acc + anps, 0);
  return Math.round(sum / validANPS.length);
}

/**
 * Generate council analysis summary using Claude (head of council)
 */
async function generateCouncilAnalysis(
  evaluations: AXModelEvaluation[],
  models: AXModelConfig[],
  finalScore: number,
  finalANPS: number
): Promise<string> {
  const modelMap = new Map(models.map(m => [m.model_id, m]));

  const modelSummaries = evaluations
    .filter(e => e.status === 'completed')
    .map(e => {
      const model = modelMap.get(e.model_id);
      return `${model?.display_name || e.model_id}: AX Score ${e.ax_score}, ANPS ${e.anps}`;
    })
    .join('\n');

  const prompt = `You are the head of an AI Agent Experience (AX) Council. Multiple AI models have independently evaluated a website for its Agent Experience quality. Your job is to synthesize their findings into a brief, authoritative summary.

Model Evaluations:
${modelSummaries}

Final Aggregated Scores:
- Final AX Score: ${finalScore}/100
- Final ANPS (Agent Net Promoter Score): ${finalANPS}

Provide a 2-3 sentence summary that:
1. States the overall AX quality (excellent/good/needs improvement)
2. Notes any significant agreement or disagreement between models
3. Gives a brief recommendation

Be concise and professional. Do not use emojis.`;

  try {
    // Use Claude (Anthropic) as the head of council via OpenRouter
    const response = await callOpenRouter(
      "anthropic/claude-sonnet-4",
      prompt,
      500
    );
    return response.trim();
  } catch (error) {
    console.error("Error generating council analysis:", error);
    // Fallback summary if API call fails
    const quality = finalScore >= 70 ? "good" : finalScore >= 40 ? "moderate" : "poor";
    return `The AX Council has evaluated this website with a final score of ${finalScore}/100 and ANPS of ${finalANPS}, indicating ${quality} agent accessibility. All participating models reached general consensus on the evaluation.`;
  }
}

/**
 * Run the AX Council aggregation
 */
export async function runAXCouncil(evaluationId: number): Promise<AXCouncilResult> {
  // 1. Verify all models are complete
  const allComplete = await areAllModelsComplete(evaluationId);
  if (!allComplete) {
    throw new Error("Cannot run AX Council: not all models have completed their evaluations");
  }

  // 2. Fetch all model evaluations and configs
  const [evaluations, models] = await Promise.all([
    getAXModelEvaluations(evaluationId),
    getEnabledAXModelConfigs()
  ]);

  const completedEvaluations = evaluations.filter(e => e.status === 'completed');

  if (completedEvaluations.length === 0) {
    throw new Error("No completed model evaluations found");
  }

  // 3. Calculate aggregated scores
  const finalScore = calculateAverageScore(completedEvaluations);
  const finalANPS = calculateAverageANPS(completedEvaluations);

  // 4. Generate council analysis
  const councilAnalysis = await generateCouncilAnalysis(
    completedEvaluations,
    models,
    finalScore,
    finalANPS
  );

  // 5. Prepare model scores summary
  const modelMap = new Map(models.map(m => [m.model_id, m]));
  const modelScores = completedEvaluations.map(e => ({
    model_id: e.model_id,
    display_name: modelMap.get(e.model_id)?.display_name || e.model_id,
    ax_score: e.ax_score as number,
    anps: e.anps as number
  }));

  // 6. Save and return council result
  const result = await saveAXCouncilResult({
    evaluation_id: evaluationId,
    final_ax_score: finalScore,
    final_anps: finalANPS,
    model_scores: modelScores,
    council_analysis: councilAnalysis
  });

  return result;
}

/**
 * Get evaluation status summary for UI
 */
export async function getAXEvaluationStatus(evaluationId: number): Promise<{
  models: {
    model_id: string;
    display_name: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    ax_score: number | null;
    anps: number | null;
  }[];
  allComplete: boolean;
  councilReady: boolean;
  councilResult: AXCouncilResult | null;
}> {
  const [enabledModels, evaluations, councilResult] = await Promise.all([
    getEnabledAXModelConfigs(),
    getAXModelEvaluations(evaluationId),
    import("./db").then(db => db.getAXCouncilResult(evaluationId))
  ]);

  const evaluationMap = new Map(evaluations.map(e => [e.model_id, e]));

  const models = enabledModels.map(model => {
    const evaluation = evaluationMap.get(model.model_id);
    return {
      model_id: model.model_id,
      display_name: model.display_name,
      status: evaluation?.status || 'pending' as const,
      ax_score: evaluation?.ax_score || null,
      anps: evaluation?.anps || null
    };
  });

  const allComplete = models.every(m => m.status === 'completed');
  const councilReady = allComplete && !councilResult;

  return {
    models,
    allComplete,
    councilReady,
    councilResult
  };
}
