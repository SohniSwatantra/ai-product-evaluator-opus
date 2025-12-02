import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";
import {
  createVoucher,
  getVouchers,
  deleteVoucher,
  toggleVoucherActive,
  getVoucherStats,
  initVoucherTables,
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

// GET /api/admin/vouchers - List all vouchers
export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    // Initialize tables if needed
    await initVoucherTables();

    const vouchers = await getVouchers();
    const stats = await getVoucherStats();

    return NextResponse.json({ vouchers, stats });
  } catch (error) {
    console.error("Error fetching vouchers:", error);
    return NextResponse.json(
      { error: "Failed to fetch vouchers" },
      { status: 500 }
    );
  }
}

// POST /api/admin/vouchers - Create a new voucher
export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    // Initialize tables if needed
    await initVoucherTables();

    const body = await request.json();
    const { credits_amount, max_uses, expires_at, custom_code } = body;

    if (!credits_amount || credits_amount <= 0) {
      return NextResponse.json(
        { error: "credits_amount is required and must be positive" },
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

    const voucher = await createVoucher(
      credits_amount,
      max_uses || null,
      expiresAtDate,
      custom_code || undefined
    );

    return NextResponse.json({ voucher });
  } catch (error: any) {
    console.error("Error creating voucher:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create voucher" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/vouchers?id=X - Delete a voucher
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
        { error: "Voucher ID is required" },
        { status: 400 }
      );
    }

    const deleted = await deleteVoucher(parseInt(id));

    if (!deleted) {
      return NextResponse.json(
        { error: "Voucher not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting voucher:", error);
    return NextResponse.json(
      { error: "Failed to delete voucher" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/vouchers - Toggle voucher active status
export async function PATCH(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, is_active } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Voucher ID is required" },
        { status: 400 }
      );
    }

    if (typeof is_active !== "boolean") {
      return NextResponse.json(
        { error: "is_active must be a boolean" },
        { status: 400 }
      );
    }

    const voucher = await toggleVoucherActive(parseInt(id), is_active);

    if (!voucher) {
      return NextResponse.json(
        { error: "Voucher not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ voucher });
  } catch (error) {
    console.error("Error toggling voucher:", error);
    return NextResponse.json(
      { error: "Failed to update voucher" },
      { status: 500 }
    );
  }
}
