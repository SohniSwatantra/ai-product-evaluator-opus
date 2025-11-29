import { NextResponse } from "next/server";
import { createEvaluationJob } from "@/lib/db";
import { stackServerApp } from "@/stack/server";
import { randomUUID } from "crypto";
import type { Demographics } from "@/types";

/**
 * Async Evaluate API Route
 * Creates a job and triggers GitHub Actions to run Playwright scraping
 * Returns jobId immediately for frontend to poll status
 */
export async function POST(request: Request) {
  try {
    const { productUrl, demographics } = await request.json();

    if (!productUrl) {
      return NextResponse.json(
        { error: "Product URL is required" },
        { status: 400 }
      );
    }

    if (!demographics) {
      return NextResponse.json(
        { error: "Target audience demographics are required" },
        { status: 400 }
      );
    }

    // Validate and fix URL
    let normalizedUrl = productUrl.trim();
    if (!normalizedUrl.match(/^https?:\/\//i)) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    try {
      new URL(normalizedUrl);
    } catch {
      return NextResponse.json(
        { error: "Please enter a valid URL" },
        { status: 400 }
      );
    }

    // Get current user (if logged in)
    const user = await stackServerApp.getUser();
    const userId = user?.id || null;

    // Generate unique job ID
    const jobId = randomUUID();

    console.log(`🚀 Creating evaluation job ${jobId} for ${normalizedUrl}`);

    // Create job in database
    await createEvaluationJob(jobId, normalizedUrl, demographics, userId);

    // Trigger GitHub Actions workflow via repository_dispatch
    await triggerGitHubActionsWorkflow({
      productUrl: normalizedUrl,
      demographics,
      jobId,
    });

    console.log(`✅ Job ${jobId} dispatched to GitHub Actions`);

    // Return job ID immediately (frontend will poll for results)
    return NextResponse.json({
      jobId,
      status: "pending",
      message: "Evaluation started. Please wait while we analyze the product...",
    });

  } catch (error) {
    console.error("Evaluation error:", error);

    return NextResponse.json(
      {
        error: "Failed to start evaluation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


async function triggerGitHubActionsWorkflow(payload: { productUrl: string; demographics: Demographics; jobId: string }) {
  const githubToken = process.env.GITHUB_TOKEN;
  const githubRepo = process.env.GITHUB_REPO || "SohniSwatantra/ai-product-evaluator-opus";

  if (!githubToken) {
    throw new Error("GITHUB_TOKEN is not configured. Set it in your Netlify environment variables.");
  }

  const response = await fetch(`https://api.github.com/repos/${githubRepo}/dispatches`, {
    method: "POST",
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${githubToken}`,
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
