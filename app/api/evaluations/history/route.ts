import { NextResponse } from "next/server";
import { getEvaluationHistoryByUrl } from "@/lib/db";

/**
 * Tier 2: AX / score history for a URL over time (regression tracking).
 * GET /api/evaluations/history?url=https://example.com&limit=50
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);

    if (!url) {
      return NextResponse.json({ error: "url query parameter is required" }, { status: 400 });
    }

    // Normalize the same way the evaluate route does so history matches.
    let normalized = url.trim();
    if (!normalized.match(/^https?:\/\//i)) normalized = "https://" + normalized;

    const history = await getEvaluationHistoryByUrl(normalized, limit);

    // Simple regression flag: did AX drop vs the previous run?
    let regression: { droppedBy: number; from: number; to: number } | null = null;
    const axPoints = history.filter((h) => h.axScore != null);
    if (axPoints.length >= 2) {
      const prev = axPoints[axPoints.length - 2].axScore!;
      const last = axPoints[axPoints.length - 1].axScore!;
      if (last < prev) regression = { droppedBy: prev - last, from: prev, to: last };
    }

    return NextResponse.json({ url: normalized, count: history.length, history, regression });
  } catch (error) {
    console.error("History error:", error);
    return NextResponse.json(
      { error: "Failed to load history", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
