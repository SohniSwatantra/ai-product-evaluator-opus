import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";
import {
  createDiscountCode,
  getDiscountCodes,
  deleteDiscountCode,
  toggleDiscountCodeActive,
  getDiscountStats,
  initDiscountTables,
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

// GET /api/admin/discounts - List all discount codes
export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    // Initialize tables if needed
    await initDiscountTables();

    const discounts = await getDiscountCodes();
    const stats = await getDiscountStats();

    return NextResponse.json({ discounts, stats });
  } catch (error) {
    console.error("Error fetching discount codes:", error);
    return NextResponse.json(
      { error: "Failed to fetch discount codes" },
      { status: 500 }
    );
  }
}

// POST /api/admin/discounts - Create a new discount code
export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    // Initialize tables if needed
    await initDiscountTables();

    const body = await request.json();
    const {
      discount_type,
      discount_value,
      description,
      min_purchase_amount,
      max_uses,
      expires_at,
      custom_code
    } = body;

    // Validate discount_type
    if (!discount_type || !['percentage', 'fixed'].includes(discount_type)) {
      return NextResponse.json(
        { error: "discount_type must be 'percentage' or 'fixed'" },
        { status: 400 }
      );
    }

    // Validate discount_value
    if (!discount_value || discount_value <= 0) {
      return NextResponse.json(
        { error: "discount_value is required and must be positive" },
        { status: 400 }
      );
    }

    // Validate percentage is not over 100
    if (discount_type === 'percentage' && discount_value > 100) {
      return NextResponse.json(
        { error: "Percentage discount cannot exceed 100%" },
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

    // Validate min_purchase_amount if provided
    if (min_purchase_amount !== undefined && min_purchase_amount !== null && min_purchase_amount < 0) {
      return NextResponse.json(
        { error: "min_purchase_amount cannot be negative" },
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

    const discount = await createDiscountCode(
      discount_type,
      discount_value,
      description || null,
      min_purchase_amount || null,
      max_uses || null,
      expiresAtDate,
      custom_code || undefined
    );

    return NextResponse.json({ discount });
  } catch (error: any) {
    console.error("Error creating discount code:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create discount code" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/discounts?id=X - Delete a discount code
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
        { error: "Discount code ID is required" },
        { status: 400 }
      );
    }

    const deleted = await deleteDiscountCode(parseInt(id));

    if (!deleted) {
      return NextResponse.json(
        { error: "Discount code not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting discount code:", error);
    return NextResponse.json(
      { error: "Failed to delete discount code" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/discounts - Toggle discount code active status
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
        { error: "Discount code ID is required" },
        { status: 400 }
      );
    }

    if (typeof is_active !== "boolean") {
      return NextResponse.json(
        { error: "is_active must be a boolean" },
        { status: 400 }
      );
    }

    const discount = await toggleDiscountCodeActive(parseInt(id), is_active);

    if (!discount) {
      return NextResponse.json(
        { error: "Discount code not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ discount });
  } catch (error) {
    console.error("Error toggling discount code:", error);
    return NextResponse.json(
      { error: "Failed to update discount code" },
      { status: 500 }
    );
  }
}
