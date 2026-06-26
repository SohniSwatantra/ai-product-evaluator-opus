import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createEvaluationJob, validateApiKey, getUserCredits } from "@/lib/db";
import type { Demographics } from "@/types";

/**
 * Tier 3: Public scoring API (API-key authenticated).
 *
 * POST /api/public/evaluate
 *   Authorization: Bearer axk_xxx
 *   { "url": "https://example.com", "demographics": { ... } }  // demographics optional
 *
 * Returns a jobId. Poll GET /api/public/evaluations/{jobId} for the result.
 */

const DEFAULT_DEMOGRAPHICS: Demographics = {
  ageRange: "25-34",
  gender: "all",
  incomeTier: "medium",
  region: "north-america",
};

function getBearer(request: Request): string | null {
  const auth = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!auth) return null;
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

export async function POST(request: Request) {
  try {
    const key = getBearer(request);
    if (!key) {
      return NextResponse.json({ error: "Missing API key. Use 'Authorization: Bearer axk_...'" }, { status: 401 });
    }

    const auth = await validateApiKey(key);
    if (!auth) {
      return NextResponse.json({ error: "Invalid or revoked API key" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const url = body?.url;
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    let normalizedUrl = url.trim();
    if (!normalizedUrl.match(/^https?:\/\//i)) normalizedUrl = "https://" + normalizedUrl;
    try {
      new URL(normalizedUrl);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Credit check (10 credits per run, same as the UI path).
    const credits = await getUserCredits(auth.userId);
    if (credits < 10) {
      return NextResponse.json({ error: "Insufficient credits", credits }, { status: 402 });
    }

    const demographics: Demographics = { ...DEFAULT_DEMOGRAPHICS, ...(body.demographics || {}) };
    const jobId = randomUUID();

    await createEvaluationJob(jobId, normalizedUrl, demographics, auth.userId);
    await triggerGitHubActionsWorkflow({ productUrl: normalizedUrl, demographics, jobId });

    return NextResponse.json({
      jobId,
      status: "pending",
      poll: `/api/public/evaluations/${jobId}`,
    });
  } catch (error) {
    console.error("Public evaluate error:", error);
    return NextResponse.json(
      { error: "Failed to start evaluation", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

async function triggerGitHubActionsWorkflow(payload: {
  productUrl: string;
  demographics: Demographics;
  jobId: string;
}) {
  const githubToken = process.env.GITHUB_TOKEN;
  const githubRepo = process.env.GITHUB_REPO || "SohniSwatantra/ai-product-evaluator-opus";
  if (!githubToken) throw new Error("GITHUB_TOKEN is not configured");

  const response = await fetch(`https://api.github.com/repos/${githubRepo}/dispatches`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${githubToken}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      event_type: "scrape-product",
      client_payload: {
        productUrl: payload.productUrl,
        demographics: JSON.stringify(payload.demographics),
        jobId: payload.jobId,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to trigger GitHub Actions: ${response.status} ${response.statusText} - ${errorText}`);
  }
}
