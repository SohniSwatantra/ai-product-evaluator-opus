import { NextResponse } from "next/server";
import { getAllEvaluations, getEvaluationStats } from "@/lib/db";

/**
 * Get all evaluations
 * GET /api/evaluations?limit=50
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const includeStats = searchParams.get("stats") === "true";

    const evaluations = await getAllEvaluations(limit);

    const response: any = {
      evaluations,
      count: evaluations.length,
    };

    if (includeStats) {
      const stats = await getEvaluationStats();
      response.stats = stats;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching evaluations:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch evaluations",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
