import { NextResponse } from "next/server";
import { initDatabase } from "@/lib/db";

/**
 * Initialize database schema
 * GET /api/init-db
 */
export async function GET() {
  try {
    await initDatabase();
    return NextResponse.json({
      success: true,
      message: "Database initialized successfully",
    });
  } catch (error) {
    console.error("Database initialization error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to initialize database",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
