import { NextRequest, NextResponse } from "next/server";
import { validateReferralCode, initReferralTables } from "@/lib/db";

/**
 * GET /api/referrals/validate?code=XXX
 * Validates a referral code and returns discount info if valid
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { valid: false, error: "Referral code is required" },
        { status: 400 }
      );
    }

    // Initialize tables if needed
    await initReferralTables();

    const referral = await validateReferralCode(code);

    return NextResponse.json({
      valid: true,
      code: referral.code,
      discount_percent: referral.discount_percent,
      owner_name: referral.owner_name,
    });
  } catch (error: any) {
    return NextResponse.json(
      { valid: false, error: error.message || "Invalid referral code" },
      { status: 400 }
    );
  }
}
