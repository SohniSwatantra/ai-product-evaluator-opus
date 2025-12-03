import { NextRequest, NextResponse } from "next/server";
import { getEvaluationById, getAXModelEvaluation, upsertAXModelEvaluation, getEnabledAXModelConfigs, deductUserCredits } from "@/lib/db";
import { callOpenRouter, createAXEvaluationPrompt, parseAXResponse } from "@/lib/openrouter";
import { stackServerApp } from "@/stack/server";

/**
 * POST /api/ax-evaluate/[evaluationId]/[modelId]
 * Trigger AX evaluation for a specific model
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ evaluationId: string; modelId: string }> }
) {
  try {
    // Get current user for credit deduction
    const user = await stackServerApp.getUser();
    const userId = user?.id || null;

    const { evaluationId: evalIdStr, modelId } = await params;
    const evaluationId = parseInt(evalIdStr, 10);

    if (isNaN(evaluationId)) {
      return NextResponse.json(
        { success: false, error: "Invalid evaluation ID" },
        { status: 400 }
      );
    }

    // Check if evaluation exists
    const evaluation = await getEvaluationById(evaluationId);
    if (!evaluation) {
      return NextResponse.json(
        { success: false, error: "Evaluation not found" },
        { status: 404 }
      );
    }

    // Check if model is enabled
    const enabledModels = await getEnabledAXModelConfigs();
    const modelConfig = enabledModels.find(m => m.model_id === modelId);
    if (!modelConfig) {
      return NextResponse.json(
        { success: false, error: "Model not found or not enabled" },
        { status: 404 }
      );
    }

    // Check if already processing or completed
    const existingEval = await getAXModelEvaluation(evaluationId, modelId);
    if (existingEval?.status === 'processing') {
      return NextResponse.json(
        { success: false, error: "Evaluation already in progress" },
        { status: 409 }
      );
    }

    // Mark as processing
    await upsertAXModelEvaluation({
      evaluation_id: evaluationId,
      model_id: modelId,
      ax_score: null,
      anps: null,
      ax_factors: null,
      agent_accessibility: null,
      ax_recommendations: null,
      raw_response: null,
      status: 'processing',
      completed_at: null
    });

    try {
      // Create prompt and call OpenRouter
      const prompt = createAXEvaluationPrompt(
        evaluation.url,
        evaluation.websiteSnapshot
      );

      const response = await callOpenRouter(
        modelConfig.openrouter_model_id,
        prompt,
        4000 // Increased to prevent truncation for verbose models like Gemini
      );

      // Parse response
      const parsed = parseAXResponse(response);

      if (!parsed) {
        throw new Error("Failed to parse model response");
      }

      // Save successful result
      const result = await upsertAXModelEvaluation({
        evaluation_id: evaluationId,
        model_id: modelId,
        ax_score: parsed.axScore,
        anps: parsed.anps,
        ax_factors: parsed.factors,
        agent_accessibility: parsed.agentAccessibility,
        ax_recommendations: parsed.recommendations,
        raw_response: response,
        status: 'completed',
        completed_at: new Date().toISOString()
      });

      // Deduct credit for signed-in users on successful completion
      if (userId) {
        try {
          await deductUserCredits(userId, 1, `AX evaluation: ${modelConfig.display_name}`);
          console.log(`💳 Deducted 1 credit from user ${userId} for ${modelConfig.display_name}`);
        } catch (creditError) {
          console.error("Failed to deduct credit:", creditError);
          // Don't fail the evaluation if credit deduction fails
        }
      }

      return NextResponse.json({
        success: true,
        evaluation: result
      });

    } catch (evalError: any) {
      // Save failed result
      await upsertAXModelEvaluation({
        evaluation_id: evaluationId,
        model_id: modelId,
        ax_score: null,
        anps: null,
        ax_factors: null,
        agent_accessibility: null,
        ax_recommendations: null,
        raw_response: null,
        status: 'failed',
        error_message: evalError.message,
        completed_at: new Date().toISOString()
      });

      return NextResponse.json(
        { success: false, error: evalError.message },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error("Error in AX model evaluation:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ax-evaluate/[evaluationId]/[modelId]
 * Get status of a specific model evaluation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ evaluationId: string; modelId: string }> }
) {
  try {
    const { evaluationId: evalIdStr, modelId } = await params;
    const evaluationId = parseInt(evalIdStr, 10);

    if (isNaN(evaluationId)) {
      return NextResponse.json(
        { success: false, error: "Invalid evaluation ID" },
        { status: 400 }
      );
    }

    const evaluation = await getAXModelEvaluation(evaluationId, modelId);

    return NextResponse.json({
      success: true,
      evaluation: evaluation || { status: 'pending' }
    });

  } catch (error: any) {
    console.error("Error fetching AX model evaluation:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
