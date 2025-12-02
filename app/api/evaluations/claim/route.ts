import { NextRequest, NextResponse } from "next/server";
import { claimEvaluationByJobId } from "@/lib/db";
import { stackServerApp } from "@/stack/server";

export async function POST(request: NextRequest) {
  try {
    // Get current user from Stack Auth
    const user = await stackServerApp.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { jobId } = body;

    if (!jobId || typeof jobId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid jobId" },
        { status: 400 }
      );
    }

    // Claim the evaluation (link it to the signed-in user)
    // No credit deduction - anonymous evaluations are free
    const evaluation = await claimEvaluationByJobId(jobId, user.id);

    if (!evaluation) {
      return NextResponse.json(
        { error: "Evaluation not found or already claimed" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      evaluation
    });
  } catch (error) {
    console.error("Error claiming evaluation:", error);
    return NextResponse.json(
      { error: "Failed to claim evaluation" },
      { status: 500 }
    );
  }
}
