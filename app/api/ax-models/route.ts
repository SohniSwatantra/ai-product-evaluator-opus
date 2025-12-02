import { NextResponse } from "next/server";
import { getEnabledAXModelConfigs, initAXModelTables, seedAXModelConfigs } from "@/lib/db";

/**
 * GET /api/ax-models
 * Returns list of enabled AX model configurations
 */
export async function GET() {
  try {
    // Ensure tables exist and are seeded
    await initAXModelTables();
    await seedAXModelConfigs();

    const models = await getEnabledAXModelConfigs();

    return NextResponse.json({
      success: true,
      models
    });
  } catch (error) {
    console.error("Error fetching AX models:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch AX models" },
      { status: 500 }
    );
  }
}
