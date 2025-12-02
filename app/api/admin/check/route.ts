import { NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "sohni.swatantra@gmail.com";

/**
 * GET /api/admin/check
 * Check if current user is admin
 */
export async function GET() {
  try {
    const user = await stackServerApp.getUser();

    if (!user) {
      return NextResponse.json({
        success: false,
        isAdmin: false,
        error: "Not authenticated"
      }, { status: 401 });
    }

    const isAdmin = user.primaryEmail === ADMIN_EMAIL;

    return NextResponse.json({
      success: true,
      isAdmin,
      email: user.primaryEmail
    });

  } catch (error: any) {
    console.error("Error checking admin status:", error);
    return NextResponse.json(
      { success: false, isAdmin: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
