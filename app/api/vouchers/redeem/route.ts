import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";
import { redeemVoucher, initVoucherTables } from "@/lib/db";

// Rate limiting: Track redemption attempts per IP
const redemptionAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60 * 1000; // 1 minute window

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = redemptionAttempts.get(ip);

  if (!record || now > record.resetAt) {
    redemptionAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  if (record.count >= MAX_ATTEMPTS) {
    return true;
  }

  record.count++;
  return false;
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of redemptionAttempts.entries()) {
    if (now > record.resetAt) {
      redemptionAttempts.delete(ip);
    }
  }
}, 60 * 1000);

// POST /api/vouchers/redeem - Redeem a voucher code
export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ||
               request.headers.get("x-real-ip") ||
               "unknown";

    // Check rate limit
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many attempts. Please wait a minute before trying again." },
        { status: 429 }
      );
    }

    // User must be signed in
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to redeem a voucher" },
        { status: 401 }
      );
    }

    // Initialize tables if needed
    await initVoucherTables();

    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Voucher code is required" },
        { status: 400 }
      );
    }

    // Sanitize code - trim and uppercase
    const sanitizedCode = code.trim().toUpperCase();

    if (sanitizedCode.length < 3 || sanitizedCode.length > 50) {
      return NextResponse.json(
        { error: "Invalid voucher code format" },
        { status: 400 }
      );
    }

    // Attempt redemption
    const result = await redeemVoucher(sanitizedCode, user.id);

    return NextResponse.json({
      success: true,
      message: `Successfully redeemed ${result.credits} credits!`,
      credits: result.credits,
      newBalance: result.newBalance,
    });
  } catch (error: any) {
    console.error("Error redeeming voucher:", error);

    // Return user-friendly error messages for known errors
    const knownErrors = [
      "Invalid voucher code",
      "This voucher is no longer active",
      "This voucher has expired",
      "This voucher has reached its maximum number of uses",
      "You have already redeemed this voucher",
    ];

    const errorMessage = error.message || "Failed to redeem voucher";

    if (knownErrors.some((msg) => errorMessage.includes(msg))) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to redeem voucher. Please try again." },
      { status: 500 }
    );
  }
}
