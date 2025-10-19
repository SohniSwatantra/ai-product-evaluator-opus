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

    // Enqueue Netlify async workload
    await enqueueEvaluationWorkload({
      productUrl: normalizedUrl,
      demographics,
      jobId,
    });

    console.log(`✅ Job ${jobId} queued for Netlify async processing`);

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


async function enqueueEvaluationWorkload(payload: { productUrl: string; demographics: Demographics; jobId: string }) {
  const enqueueUrl = process.env.NETLIFY_WORKLOAD_ENQUEUE_URL;
  const enqueueToken = process.env.NETLIFY_WORKLOAD_TOKEN;

  if (!enqueueUrl) {
    throw new Error("NETLIFY_WORKLOAD_ENQUEUE_URL is not configured. Set it to your Netlify async workload enqueue endpoint.");
  }

  const response = await fetch(`${enqueueUrl.replace(/\/$/, "")}/product-evaluation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(enqueueToken ? { Authorization: `Bearer ${enqueueToken}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to enqueue Netlify workload: ${response.status} ${response.statusText} - ${errorText}`);
  }
}
