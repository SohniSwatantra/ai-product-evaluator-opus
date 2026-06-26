import { NextResponse } from "next/server";
import { validateApiKey, getEvaluationJob, getEvaluationById } from "@/lib/db";
import type { ProductEvaluation } from "@/types";

/**
 * Tier 3: Public result + CI gating.
 *
 * GET /api/public/evaluations/{jobIdOrEvaluationId}
 *   Authorization: Bearer axk_xxx
 *   Optional: ?minAx=70  -> returns 422 if the measured AX score is below the threshold
 *                           (so a CI step can `exit 1` on a regression)
 *
 * Accepts either a job UUID (from /api/public/evaluate) or a numeric evaluation id.
 */
function getBearer(request: Request): string | null {
  const auth = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!auth) return null;
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

function summarize(ev: ProductEvaluation) {
  return {
    id: ev.id,
    url: ev.url,
    overallScore: ev.overallScore,
    buyingIntentProbability: ev.buyingIntentProbability,
    ssrScore: ev.ssrScore ?? null,
    ax: ev.agentExperience
      ? {
          axScore: ev.agentExperience.axScore,
          anps: ev.agentExperience.anps,
          scoreBasis: ev.agentExperience.scoreBasis ?? "estimated",
          factors: ev.agentExperience.factors,
          measuredSignals: ev.agentExperience.measuredSignals ?? null,
          recommendations: ev.agentExperience.recommendations,
        }
      : null,
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const key = getBearer(request);
  if (!key) return NextResponse.json({ error: "Missing API key" }, { status: 401 });
  const auth = await validateApiKey(key);
  if (!auth) return NextResponse.json({ error: "Invalid or revoked API key" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const minAx = searchParams.get("minAx");

  let evaluation: ProductEvaluation | null = null;
  let status = "completed";

  // Numeric id -> direct evaluation; otherwise treat as a job UUID.
  if (/^\d+$/.test(id)) {
    evaluation = await getEvaluationById(parseInt(id));
  } else {
    const job = await getEvaluationJob(id);
    if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
    status = job.status;
    if (job.status !== "completed") {
      return NextResponse.json({ status: job.status, error: job.error ?? null });
    }
    evaluation = job.result as ProductEvaluation;
  }

  if (!evaluation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const summary = summarize(evaluation);

  // CI gating: fail (422) when AX is below the requested threshold.
  if (minAx != null) {
    const threshold = Number(minAx);
    const axScore = summary.ax?.axScore ?? null;
    const passed = axScore != null && axScore >= threshold;
    return NextResponse.json(
      { status, passed, threshold, axScore, evaluation: summary },
      { status: passed ? 200 : 422 }
    );
  }

  return NextResponse.json({ status, evaluation: summary });
}
