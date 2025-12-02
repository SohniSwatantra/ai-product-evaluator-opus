import { NextRequest, NextResponse } from "next/server";
import { getAXEvaluationStatus } from "@/lib/ax-council";

/**
 * GET /api/ax-evaluate/status/[evaluationId]
 * Get status of all model evaluations for an evaluation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ evaluationId: string }> }
) {
  try {
    const { evaluationId: evalIdStr } = await params;
    const evaluationId = parseInt(evalIdStr, 10);

    if (isNaN(evaluationId)) {
      return NextResponse.json(
        { success: false, error: "Invalid evaluation ID" },
        { status: 400 }
      );
    }

    const status = await getAXEvaluationStatus(evaluationId);

    return NextResponse.json({
      success: true,
      ...status
    });

  } catch (error: any) {
    console.error("Error fetching AX evaluation status:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
