import { NextRequest, NextResponse } from "next/server";
import {
  getShowcaseEvaluationsForAdmin,
  addShowcaseEvaluation,
  removeShowcaseEvaluation,
  getEvaluationById,
  initDatabase,
} from "@/lib/db";
import { stackServerApp } from "@/stack/server";

const ADMIN_EMAIL = "sohni.swatantra@gmail.com";

/**
 * Check if current user is admin
 */
async function isAdmin(): Promise<{ isAdmin: boolean; user: any }> {
  const user = await stackServerApp.getUser();
  if (!user) {
    return { isAdmin: false, user: null };
  }
  return { isAdmin: user.primaryEmail === ADMIN_EMAIL, user };
}

/**
 * GET /api/admin/showcase
 * Get all showcase evaluations with their details
 */
export async function GET() {
  try {
    const { isAdmin: admin, user } = await isAdmin();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    // Ensure tables exist
    await initDatabase();

    const showcaseEvaluations = await getShowcaseEvaluationsForAdmin();

    return NextResponse.json({
      success: true,
      evaluations: showcaseEvaluations,
      count: showcaseEvaluations.length,
    });
  } catch (error: any) {
    console.error("Error fetching showcase evaluations:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch showcase evaluations" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/showcase
 * Add an evaluation to the showcase
 * Body: { evaluationId: number, displayOrder?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const { isAdmin: admin, user } = await isAdmin();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const { evaluationId, displayOrder } = await request.json();

    if (typeof evaluationId !== "number" || evaluationId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid evaluation ID" },
        { status: 400 }
      );
    }

    // Verify the evaluation exists
    const evaluation = await getEvaluationById(evaluationId);
    if (!evaluation) {
      return NextResponse.json(
        { success: false, error: "Evaluation not found" },
        { status: 404 }
      );
    }

    await addShowcaseEvaluation(evaluationId, displayOrder);

    return NextResponse.json({
      success: true,
      message: `Evaluation ${evaluationId} added to showcase`,
      evaluation: {
        id: evaluation.id,
        url: evaluation.url,
        overallScore: evaluation.overallScore,
      },
    });
  } catch (error: any) {
    console.error("Error adding showcase evaluation:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add showcase evaluation" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/showcase
 * Remove an evaluation from the showcase
 * Body: { evaluationId: number }
 */
export async function DELETE(request: NextRequest) {
  try {
    const { isAdmin: admin, user } = await isAdmin();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const { evaluationId } = await request.json();

    if (typeof evaluationId !== "number" || evaluationId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid evaluation ID" },
        { status: 400 }
      );
    }

    await removeShowcaseEvaluation(evaluationId);

    return NextResponse.json({
      success: true,
      message: `Evaluation ${evaluationId} removed from showcase`,
    });
  } catch (error: any) {
    console.error("Error removing showcase evaluation:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to remove showcase evaluation" },
      { status: 500 }
    );
  }
}
