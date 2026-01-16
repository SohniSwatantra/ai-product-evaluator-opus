import { NextRequest, NextResponse } from "next/server";
import { validateDiscountCode, calculateDiscount, initDiscountTables } from "@/lib/db";

// POST /api/discount/validate - Validate a discount code
export async function POST(request: NextRequest) {
  try {
    // Initialize tables if needed
    await initDiscountTables();

    const body = await request.json();
    const { code, purchase_amount } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Discount code is required" },
        { status: 400 }
      );
    }

    // Validate the discount code
    const discount = await validateDiscountCode(code, purchase_amount);

    // Calculate discount if purchase amount provided
    let discountInfo = null;
    if (purchase_amount && purchase_amount > 0) {
      discountInfo = calculateDiscount(discount, purchase_amount);
    }

    return NextResponse.json({
      success: true,
      discount: {
        code: discount.code,
        discount_type: discount.discount_type,
        discount_value: discount.discount_value,
        description: discount.description,
        min_purchase_amount: discount.min_purchase_amount,
      },
      calculation: discountInfo
    });
  } catch (error: any) {
    console.error("Error validating discount code:", error);
    return NextResponse.json(
      { error: error.message || "Invalid discount code" },
      { status: 400 }
    );
  }
}
