import { NextResponse } from "next/server";
import { getEvaluationById, deleteEvaluation, isShowcaseEvaluation } from "@/lib/db";
import { stackServerApp } from "@/stack/server";

/**
 * Get a single evaluation by ID
 * Access control:
 * - Showcase evaluations: viewable by everyone
 * - Other evaluations: viewable only by owner
 * GET /api/evaluations/[id]
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const evaluationId = parseInt(id);

    if (isNaN(evaluationId)) {
      return NextResponse.json(
        { error: "Invalid evaluation ID" },
        { status: 400 }
      );
    }

    const evaluation = await getEvaluationById(evaluationId);

    if (!evaluation) {
      return NextResponse.json(
        { error: "Evaluation not found" },
        { status: 404 }
      );
    }

    // Check if it's a showcase evaluation (viewable by everyone)
    const isShowcase = await isShowcaseEvaluation(evaluationId);

    if (isShowcase) {
      // Showcase evaluations are public
      return NextResponse.json(evaluation);
    }

    // For non-showcase evaluations, check ownership
    const user = await stackServerApp.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user owns this evaluation
    if (evaluation.userId !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to view this evaluation" },
        { status: 403 }
      );
    }

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error("Error fetching evaluation:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch evaluation",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Delete an evaluation by ID
 * Access control:
 * - Must be authenticated
 * - Can only delete own evaluations
 * - Cannot delete showcase evaluations
 * DELETE /api/evaluations/[id]
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const evaluationId = parseInt(id);

    if (isNaN(evaluationId)) {
      return NextResponse.json(
        { error: "Invalid evaluation ID" },
        { status: 400 }
      );
    }

    // Check authentication
    const user = await stackServerApp.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get the evaluation to check ownership
    const evaluation = await getEvaluationById(evaluationId);

    if (!evaluation) {
      return NextResponse.json(
        { error: "Evaluation not found" },
        { status: 404 }
      );
    }

    // Check if it's a showcase evaluation (cannot be deleted)
    const isShowcase = await isShowcaseEvaluation(evaluationId);

    if (isShowcase) {
      return NextResponse.json(
        { error: "Cannot delete showcase evaluations" },
        { status: 403 }
      );
    }

    // Check if user owns this evaluation
    if (evaluation.userId !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to delete this evaluation" },
        { status: 403 }
      );
    }

    const success = await deleteEvaluation(evaluationId);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete evaluation" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Evaluation deleted" });
  } catch (error) {
    console.error("Error deleting evaluation:", error);
    return NextResponse.json(
      {
        error: "Failed to delete evaluation",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
