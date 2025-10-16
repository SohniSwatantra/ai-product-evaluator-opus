import { NextResponse } from "next/server";
import { getEvaluationById, deleteEvaluation } from "@/lib/db";

/**
 * Get a single evaluation by ID
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

    const success = await deleteEvaluation(evaluationId);

    if (!success) {
      return NextResponse.json(
        { error: "Evaluation not found" },
        { status: 404 }
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
