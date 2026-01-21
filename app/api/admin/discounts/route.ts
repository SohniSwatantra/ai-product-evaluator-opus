import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";
import {
  initDiscountTables,
  createDiscountCode,
  getDiscountCodes,
  updateDiscountCode,
  deleteDiscountCode,
  generateDiscountCode,
} from "@/lib/db";

const ADMIN_EMAILS = ["swatantrasohni@gmail.com"];

async function isAdmin(): Promise<boolean> {
  const user = await stackServerApp.getUser();
  if (!user) return false;
  return ADMIN_EMAILS.includes(user.primaryEmail || "");
}

// GET - List all discount codes
export async function GET() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await initDiscountTables();
    const discounts = await getDiscountCodes();

    return NextResponse.json({ success: true, discounts });
  } catch (error: any) {
    console.error("Error fetching discount codes:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch discount codes" },
      { status: 500 }
    );
  }
}

// POST - Create a new discount code
export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await initDiscountTables();

    const body = await request.json();
    const {
      code,
      discountType,
      discountValue,
      description,
      minPurchaseAmount,
      maxUses,
      expiresAt,
      autoGenerate,
    } = body;

    // Validate required fields
    if (!discountType || discountValue === undefined) {
      return NextResponse.json(
        { success: false, error: "Discount type and value are required" },
        { status: 400 }
      );
    }

    // Validate discount type
    if (!["percentage", "fixed"].includes(discountType)) {
      return NextResponse.json(
        { success: false, error: "Invalid discount type" },
        { status: 400 }
      );
    }

    // Validate discount value
    if (discountType === "percentage" && (discountValue < 0 || discountValue > 100)) {
      return NextResponse.json(
        { success: false, error: "Percentage discount must be between 0 and 100" },
        { status: 400 }
      );
    }

    // Generate code if requested or use provided code
    const finalCode = autoGenerate ? generateDiscountCode() : code;

    if (!finalCode) {
      return NextResponse.json(
        { success: false, error: "Discount code is required" },
        { status: 400 }
      );
    }

    const discount = await createDiscountCode(
      finalCode,
      discountType,
      discountValue,
      description,
      minPurchaseAmount,
      maxUses,
      expiresAt ? new Date(expiresAt) : undefined
    );

    return NextResponse.json({ success: true, discount });
  } catch (error: any) {
    console.error("Error creating discount code:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create discount code" },
      { status: 500 }
    );
  }
}

// PATCH - Update a discount code
export async function PATCH(request: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Discount code ID is required" },
        { status: 400 }
      );
    }

    const discount = await updateDiscountCode(id, updates);

    if (!discount) {
      return NextResponse.json(
        { success: false, error: "Discount code not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, discount });
  } catch (error: any) {
    console.error("Error updating discount code:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update discount code" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a discount code
export async function DELETE(request: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Discount code ID is required" },
        { status: 400 }
      );
    }

    const deleted = await deleteDiscountCode(parseInt(id, 10));

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Discount code not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting discount code:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete discount code" },
      { status: 500 }
    );
  }
}
