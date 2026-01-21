import { NextRequest, NextResponse } from "next/server";
import { constructWebhookEvent, CREDIT_PACKS, CreditPackId } from "@/lib/stripe";
import { addUserCredits, initCreditTables, recordReferralUsage, initReferralTables, recordDiscountUsage, initDiscountTables } from "@/lib/db";
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

      // Handle referral tracking if a referral code was used
      const referralCodeId = session.metadata?.referralCodeId;
      const referralCode = session.metadata?.referralCode;
      const commissionPercent = parseInt(session.metadata?.commissionPercent || "0", 10);
      const originalPrice = parseInt(session.metadata?.originalPrice || "0", 10);
      const discountAmount = parseInt(session.metadata?.discountAmount || "0", 10);

      if (referralCodeId && referralCode) {
        try {
          // Initialize referral tables
          await initReferralTables();

          // Calculate the final sale amount (what was actually charged) in dollars
          const saleAmount = (originalPrice - discountAmount) / 100;
          // Calculate commission in dollars
          const commissionAmount = saleAmount * (commissionPercent / 100);
          // Discount amount in dollars
          const discountAmountDollars = discountAmount / 100;

          await recordReferralUsage(
            parseInt(referralCodeId, 10),
            userId,
            session.id,
            saleAmount,
            discountAmountDollars,
            commissionAmount
          );

          console.log(`Recorded referral usage: code=${referralCode}, sale=$${saleAmount}, commission=$${commissionAmount}`);
        } catch (referralError: any) {
          // Don't fail the webhook if referral tracking fails
          console.error("Error recording referral usage:", referralError.message);
        }
      }

      // Handle discount code tracking if a discount code was used (and no referral)
      const discountCodeId = session.metadata?.discountCodeId;
      const discountCode = session.metadata?.discountCode;

      if (discountCodeId && discountCode && !referralCodeId) {
        try {
          // Initialize discount tables
          await initDiscountTables();

          // Calculate amounts in dollars
          const originalAmountDollars = originalPrice / 100;
          const discountAmountDollars = discountAmount / 100;
          const finalAmountDollars = (originalPrice - discountAmount) / 100;

          await recordDiscountUsage(
            parseInt(discountCodeId, 10),
            userId,
            session.id,
            originalAmountDollars,
            discountAmountDollars,
            finalAmountDollars
          );

          console.log(`Recorded discount usage: code=${discountCode}, discount=$${discountAmountDollars}`);
        } catch (discountError: any) {
          // Don't fail the webhook if discount tracking fails
          console.error("Error recording discount usage:", discountError.message);
        }
      }
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
