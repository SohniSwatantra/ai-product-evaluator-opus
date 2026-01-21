import { NextRequest, NextResponse } from "next/server";
import { validateDiscountCode, calculateDiscount, initDiscountTables } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    await initDiscountTables();

    const body = await request.json();
    const { code, purchase_amount } = body;

    if (!code) {
      return NextResponse.json(
        { success: false, error: "Discount code is required" },
        { status: 400 }
      );
    }

    const discount = await validateDiscountCode(code, purchase_amount);

    // Calculate discount if purchase amount is provided
    let calculation = null;
    if (purchase_amount) {
      calculation = calculateDiscount(discount, purchase_amount);
    }

    return NextResponse.json({
      success: true,
      discount: {
        code: discount.code,
        discount_type: discount.discount_type,
        discount_value: Number(discount.discount_value),
        description: discount.description,
        min_purchase_amount: discount.min_purchase_amount ? Number(discount.min_purchase_amount) : null,
      },
      calculation,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Invalid discount code" },
      { status: 400 }
    );
  }
}
