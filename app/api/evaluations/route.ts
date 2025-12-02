import { NextResponse } from "next/server";
import { getEvaluationsByUserId, getShowcaseEvaluations, getEvaluationStats } from "@/lib/db";
import { stackServerApp } from "@/stack/server";

/**
 * Get evaluations based on user authentication
 * - Not logged in: Returns showcase evaluations (landing page)
 * - Logged in: Returns user's own evaluations
 * GET /api/evaluations?limit=10
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const includeStats = searchParams.get("stats") === "true";

    // Check if user is authenticated
    const user = await stackServerApp.getUser();

    let evaluations;

    if (!user) {
      // Not logged in: show only showcase evaluations
      evaluations = await getShowcaseEvaluations(limit);
    } else {
      // Logged in: show only user's own evaluations
      evaluations = await getEvaluationsByUserId(user.id, limit);
    }

    const response: {
      evaluations: unknown[];
      count: number;
      stats?: unknown;
    } = {
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
