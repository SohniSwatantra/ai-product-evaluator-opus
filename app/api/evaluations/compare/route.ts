import { NextResponse } from "next/server";
import { getEvaluationById } from "@/lib/db";

/**
 * Tier 2: Side-by-side comparison of multiple evaluations.
 * GET /api/evaluations/compare?ids=1,2,3
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids");
    if (!idsParam) {
      return NextResponse.json({ error: "ids query parameter is required (e.g. ?ids=1,2)" }, { status: 400 });
    }

    const ids = idsParam
      .split(",")
      .map((s) => parseInt(s.trim()))
      .filter((n) => !isNaN(n))
      .slice(0, 5); // cap at 5 for a readable comparison

    if (ids.length === 0) {
      return NextResponse.json({ error: "No valid ids provided" }, { status: 400 });
    }

    const evaluations = (await Promise.all(ids.map((id) => getEvaluationById(id)))).filter(Boolean);

    return NextResponse.json({ count: evaluations.length, evaluations });
  } catch (error) {
    console.error("Compare error:", error);
    return NextResponse.json(
      { error: "Failed to compare", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
