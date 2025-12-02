import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { stackServerApp } from "@/stack/server";

const ADMIN_EMAIL = "sohni.swatantra@gmail.com";

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await stackServerApp.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (user.primaryEmail !== ADMIN_EMAIL) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const { credits } = await request.json();

    if (typeof credits !== "number" || credits < 0) {
      return NextResponse.json(
        { success: false, error: "Invalid credits amount" },
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL || "");

    // Update admin's credits
    await sql`
      UPDATE user_credits SET balance = ${credits}, updated_at = NOW()
      WHERE user_id = ${user.id}
    `;

    // Log the transaction
    await sql`
      INSERT INTO credit_transactions (user_id, amount, type, description, balance_after)
      VALUES (${user.id}, ${credits}, 'bonus', 'Admin credits set', ${credits})
    `;

    return NextResponse.json({
      success: true,
      balance: credits,
      message: `Credits set to ${credits}`,
    });
  } catch (error: any) {
    console.error("Error setting admin credits:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to set credits" },
      { status: 500 }
    );
  }
}
