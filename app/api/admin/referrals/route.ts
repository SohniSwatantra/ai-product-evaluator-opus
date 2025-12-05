import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";
import {
  createReferralCode,
  getReferralCodes,
  deleteReferralCode,
  toggleReferralCodeActive,
  updateReferralCode,
  getReferralStats,
  initReferralTables,
} from "@/lib/db";

const ADMIN_EMAIL = "sohni.swatantra@gmail.com";

async function isAdmin(request: NextRequest): Promise<boolean> {
  try {
    const user = await stackServerApp.getUser();
    if (!user) return false;
    return user.primaryEmail === ADMIN_EMAIL;
  } catch {
    return false;
  }
}

// GET /api/admin/referrals - List all referral codes
export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    // Initialize tables if needed
    await initReferralTables();

    const referrals = await getReferralCodes();
    const stats = await getReferralStats();

    return NextResponse.json({ referrals, stats });
  } catch (error) {
    console.error("Error fetching referrals:", error);
    return NextResponse.json(
      { error: "Failed to fetch referral codes" },
      { status: 500 }
    );
  }
}

// POST /api/admin/referrals - Create a new referral code
export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    // Initialize tables if needed
    await initReferralTables();

    const body = await request.json();
    const {
      owner_name,
      owner_email,
      discount_percent,
      commission_percent,
      max_uses,
      expires_at,
      custom_code,
    } = body;

    if (!owner_name || owner_name.trim() === "") {
      return NextResponse.json(
        { error: "owner_name is required" },
        { status: 400 }
      );
    }

    // Validate discount_percent
    if (discount_percent !== undefined && (discount_percent < 0 || discount_percent > 100)) {
      return NextResponse.json(
        { error: "discount_percent must be between 0 and 100" },
        { status: 400 }
      );
    }

    // Validate commission_percent
    if (commission_percent !== undefined && (commission_percent < 0 || commission_percent > 100)) {
      return NextResponse.json(
        { error: "commission_percent must be between 0 and 100" },
        { status: 400 }
      );
    }

    // Validate max_uses if provided
    if (max_uses !== undefined && max_uses !== null && max_uses <= 0) {
      return NextResponse.json(
        { error: "max_uses must be positive if provided" },
        { status: 400 }
      );
    }

    // Parse expires_at if provided
    let expiresAtDate: Date | null = null;
    if (expires_at) {
      expiresAtDate = new Date(expires_at);
      if (isNaN(expiresAtDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid expires_at date format" },
          { status: 400 }
        );
      }
      if (expiresAtDate <= new Date()) {
        return NextResponse.json(
          { error: "expires_at must be in the future" },
          { status: 400 }
        );
      }
    }

    const referral = await createReferralCode(
      owner_name.trim(),
      owner_email?.trim() || null,
      discount_percent ?? 10,
      commission_percent ?? 20,
      max_uses || null,
      expiresAtDate,
      custom_code?.trim() || undefined
    );

    return NextResponse.json({ referral });
  } catch (error: any) {
    console.error("Error creating referral code:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create referral code" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/referrals?id=X - Delete a referral code
export async function DELETE(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Referral code ID is required" },
        { status: 400 }
      );
    }

    const deleted = await deleteReferralCode(parseInt(id));

    if (!deleted) {
      return NextResponse.json(
        { error: "Referral code not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting referral code:", error);
    return NextResponse.json(
      { error: "Failed to delete referral code" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/referrals - Update referral code (toggle active or update fields)
export async function PATCH(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, is_active, owner_name, owner_email, discount_percent, commission_percent, max_uses, expires_at } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Referral code ID is required" },
        { status: 400 }
      );
    }

    // If only toggling active status
    if (typeof is_active === "boolean" && Object.keys(body).length === 2) {
      const referral = await toggleReferralCodeActive(parseInt(id), is_active);

      if (!referral) {
        return NextResponse.json(
          { error: "Referral code not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ referral });
    }

    // Otherwise, update multiple fields
    const updates: any = {};
    if (owner_name !== undefined) updates.owner_name = owner_name;
    if (owner_email !== undefined) updates.owner_email = owner_email;
    if (discount_percent !== undefined) updates.discount_percent = discount_percent;
    if (commission_percent !== undefined) updates.commission_percent = commission_percent;
    if (max_uses !== undefined) updates.max_uses = max_uses;
    if (is_active !== undefined) updates.is_active = is_active;
    if (expires_at !== undefined) {
      updates.expires_at = expires_at ? new Date(expires_at) : null;
    }

    const referral = await updateReferralCode(parseInt(id), updates);

    if (!referral) {
      return NextResponse.json(
        { error: "Referral code not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ referral });
  } catch (error) {
    console.error("Error updating referral code:", error);
    return NextResponse.json(
      { error: "Failed to update referral code" },
      { status: 500 }
    );
  }
}
