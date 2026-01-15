import { NextResponse } from "next/server";
import { getEvaluationJob } from "@/lib/db";

/**
 * Status Polling API Route
 * Returns the current status of an evaluation job
 * Frontend polls this endpoint every 2-3 seconds
 */
export async function GET(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    // Get job from database
    const job = await getEvaluationJob(jobId);

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Return job status
    const response: {
      jobId: string;
      status: string;
      createdAt: Date;
      updatedAt: Date;
      result?: unknown;
      completedAt?: Date;
      error?: string;
    } = {
      jobId: job.id,
      status: job.status, // 'pending', 'processing', 'completed', 'failed'
      createdAt: job.created_at,
      updatedAt: job.updated_at,
    };

    // If completed, include the result
    if (job.status === "completed" && job.result) {
      // Parse the result if it's a string (JSONB sometimes returns stringified JSON)
      let parsedResult = job.result;
      if (typeof job.result === "string") {
        try {
          parsedResult = JSON.parse(job.result);
        } catch (parseError) {
          console.error("Failed to parse job result:", parseError);
          // Keep the original result if parsing fails
        }
      }
      response.result = parsedResult;
      response.completedAt = job.completed_at;
    }

    // If failed, include the error
    if (job.status === "failed" && job.error) {
      response.error = job.error;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error("Status polling error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch job status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
