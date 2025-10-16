import { NextResponse } from "next/server";
import { createEvaluationJob } from "@/lib/db";
import { triggerScrapeJob } from "@/lib/github-actions";
import { stackServerApp } from "@/stack/server";
import { randomUUID } from "crypto";

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

    // Trigger GitHub Actions workflow
    await triggerScrapeJob({
      productUrl: normalizedUrl,
      demographics,
      jobId,
    });

    console.log(`✅ Job ${jobId} created and GitHub Actions triggered`);

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
