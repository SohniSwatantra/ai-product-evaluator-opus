import { NextRequest, NextResponse } from "next/server";
import { runAXCouncil, areAllModelsComplete } from "@/lib/ax-council";
import { getAXCouncilResult } from "@/lib/db";

/**
 * POST /api/ax-council/[evaluationId]
 * Run AX Council aggregation
 */
export async function POST(
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

    // Check if all models are complete
    const allComplete = await areAllModelsComplete(evaluationId);
    if (!allComplete) {
      return NextResponse.json(
        { success: false, error: "Not all models have completed their evaluations" },
        { status: 400 }
      );
    }

    // Run council aggregation
    const result = await runAXCouncil(evaluationId);

    return NextResponse.json({
      success: true,
      result
    });

  } catch (error: any) {
    console.error("Error running AX council:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ax-council/[evaluationId]
 * Get AX Council result if available
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

    const result = await getAXCouncilResult(evaluationId);

    return NextResponse.json({
      success: true,
      result
    });

  } catch (error: any) {
    console.error("Error fetching AX council result:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
