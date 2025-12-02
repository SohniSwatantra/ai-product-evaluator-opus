import { NextRequest, NextResponse } from "next/server";
import { constructWebhookEvent, CREDIT_PACKS, CreditPackId } from "@/lib/stripe";
import { addUserCredits, initCreditTables } from "@/lib/db";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = constructWebhookEvent(body, signature);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    // Handle the event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = session.metadata?.userId;
      const packId = session.metadata?.packId as CreditPackId;
      const credits = parseInt(session.metadata?.credits || "0", 10);

      if (!userId || !packId || !credits) {
        console.error("Missing metadata in checkout session:", session.id);
        return NextResponse.json(
          { error: "Missing metadata in checkout session" },
          { status: 400 }
        );
      }

      // Ensure credit tables exist
      await initCreditTables();

      // Add credits to user's account
      const pack = CREDIT_PACKS[packId];
      const description = `Purchased ${pack.name} (${credits} credits)`;

      await addUserCredits(userId, credits, description, session.id);

      console.log(`Successfully added ${credits} credits to user ${userId}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: error.message || "Webhook handler failed" },
      { status: 500 }
    );
  }
}
