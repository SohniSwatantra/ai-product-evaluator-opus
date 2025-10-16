import { NextResponse } from "next/server";
import { migrateAXColumns } from "@/lib/migrate-ax";

/**
 * API endpoint to run AX columns migration
 * GET /api/migrate-ax
 */
export async function GET() {
  try {
    const result = await migrateAXColumns();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Migration API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Migration failed",
      },
      { status: 500 }
    );
  }
}
