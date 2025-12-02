import { NextRequest, NextResponse } from "next/server";
import { getUserCredits, getUserCreditTransactions, initCreditTables } from "@/lib/db";
import { stackServerApp } from "@/stack/server";

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await stackServerApp.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Ensure credit tables exist
    await initCreditTables();

    // Get user's credit balance (pass email for admin check on new users)
    const balance = await getUserCredits(user.id, user.primaryEmail || undefined);

    // Check if transactions are requested
    const includeTransactions = request.nextUrl.searchParams.get("transactions") === "true";

    let transactions = null;
    if (includeTransactions) {
      transactions = await getUserCreditTransactions(user.id);
    }

    return NextResponse.json({
      success: true,
      balance,
      transactions,
    });
  } catch (error: any) {
    console.error("Error fetching user credits:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch credits" },
      { status: 500 }
    );
  }
}
