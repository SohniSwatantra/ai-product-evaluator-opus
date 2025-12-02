import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession, CREDIT_PACKS, CreditPackId } from "@/lib/stripe";
import { stackServerApp } from "@/stack/server";

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

    const body = await request.json();
    const { packId } = body;

    // Validate pack ID
    if (!packId || !CREDIT_PACKS[packId as CreditPackId]) {
      return NextResponse.json(
        { success: false, error: "Invalid credit pack" },
        { status: 400 }
      );
    }

    // Get base URL for success/cancel redirects
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await createCheckoutSession(
      packId as CreditPackId,
      user.id,
      user.primaryEmail || "",
      `${origin}/pricing?success=true`,
      `${origin}/pricing?canceled=true`
    );

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
