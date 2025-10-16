import { NextResponse } from "next/server";
import { getEvaluationsByUserId } from "@/lib/db";
import { stackServerApp } from "@/stack/server";

export async function GET() {
  try {
    // Get current user from Stack Auth
    const user = await stackServerApp.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch user's evaluations (now includes IDs)
    const evaluations = await getEvaluationsByUserId(user.id);

    return NextResponse.json(evaluations);
  } catch (error) {
    console.error("Error fetching user evaluations:", error);
    return NextResponse.json(
      { error: "Failed to fetch evaluations" },
      { status: 500 }
    );
  }
}
