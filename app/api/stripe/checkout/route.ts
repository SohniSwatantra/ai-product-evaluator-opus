import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession, CREDIT_PACKS, CreditPackId, ReferralInfo, DiscountInfo } from "@/lib/stripe";
import { stackServerApp } from "@/stack/server";
import { validateReferralCode, initReferralTables, validateDiscountCode, initDiscountTables } from "@/lib/db";

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
    const { packId, referralCode, discountCode } = body;

    // Validate pack ID
    if (!packId || !CREDIT_PACKS[packId as CreditPackId]) {
      return NextResponse.json(
        { success: false, error: "Invalid credit pack" },
        { status: 400 }
      );
    }

    const pack = CREDIT_PACKS[packId as CreditPackId];

    // Initialize tables
    await initReferralTables();
    await initDiscountTables();

    // Validate referral code if provided (takes priority over discount code)
    let referralInfo: ReferralInfo | undefined;
    let discountInfo: DiscountInfo | undefined;

    if (referralCode && referralCode.trim()) {
      try {
        const referral = await validateReferralCode(referralCode.trim());
        referralInfo = {
          code: referral.code,
          codeId: referral.id,
          discountPercent: referral.discount_percent,
          commissionPercent: referral.commission_percent,
        };
        console.log(`Applying referral code ${referral.code}: ${referral.discount_percent}% discount`);
      } catch (error: any) {
        // Return error if referral code is invalid
        return NextResponse.json(
          { success: false, error: error.message || "Invalid referral code" },
          { status: 400 }
        );
      }
    }
    // Only check discount code if no referral code
    else if (discountCode && discountCode.trim()) {
      try {
        // Convert pack price from cents to dollars for validation
        const packPriceInDollars = pack.price / 100;
        const discount = await validateDiscountCode(discountCode.trim(), packPriceInDollars);
        discountInfo = {
          code: discount.code,
          codeId: discount.id,
          discountType: discount.discount_type,
          discountValue: Number(discount.discount_value),
        };
        console.log(`Applying discount code ${discount.code}: ${discount.discount_type === 'percentage' ? discount.discount_value + '%' : '€' + discount.discount_value} off`);
      } catch (error: any) {
        // Return error if discount code is invalid
        return NextResponse.json(
          { success: false, error: error.message || "Invalid discount code" },
          { status: 400 }
        );
      }
    }

    // Get base URL for success/cancel redirects
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await createCheckoutSession(
      packId as CreditPackId,
      user.id,
      user.primaryEmail || "",
      `${origin}/pricing?success=true`,
      `${origin}/pricing?canceled=true`,
      referralInfo,
      discountInfo
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
