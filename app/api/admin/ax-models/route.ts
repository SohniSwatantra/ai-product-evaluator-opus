import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";
import {
  getAllAXModelConfigs,
  createAXModelConfig,
  updateAXModelConfig,
  deleteAXModelConfig,
  initAXModelTables
} from "@/lib/db";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "sohni.swatantra@gmail.com";

/**
 * Check if user is admin
 */
async function checkAdmin(): Promise<{ isAdmin: boolean; error?: string }> {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return { isAdmin: false, error: "Not authenticated" };
    }
    if (user.primaryEmail !== ADMIN_EMAIL) {
      return { isAdmin: false, error: "Not authorized" };
    }
    return { isAdmin: true };
  } catch {
    return { isAdmin: false, error: "Authentication error" };
  }
}

/**
 * GET /api/admin/ax-models
 * Get all AX model configurations (including disabled)
 */
export async function GET() {
  const { isAdmin, error } = await checkAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { success: false, error: error || "Unauthorized" },
      { status: 403 }
    );
  }

  try {
    await initAXModelTables();
    const models = await getAllAXModelConfigs();

    return NextResponse.json({
      success: true,
      models
    });
  } catch (error: any) {
    console.error("Error fetching AX models:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch models" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/ax-models
 * Create a new AX model configuration
 */
export async function POST(request: NextRequest) {
  const { isAdmin, error } = await checkAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { success: false, error: error || "Unauthorized" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    const { model_id, display_name, provider, openrouter_model_id, is_enabled, sort_order } = body;

    if (!model_id || !display_name || !provider || !openrouter_model_id) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const model = await createAXModelConfig({
      model_id,
      display_name,
      provider,
      openrouter_model_id,
      is_enabled: is_enabled ?? true,
      sort_order: sort_order ?? 0
    });

    return NextResponse.json({
      success: true,
      model
    });
  } catch (error: any) {
    console.error("Error creating AX model:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create model" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/ax-models
 * Update an existing AX model configuration
 */
export async function PUT(request: NextRequest) {
  const { isAdmin, error } = await checkAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { success: false, error: error || "Unauthorized" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Model ID required" },
        { status: 400 }
      );
    }

    const model = await updateAXModelConfig(id, updates);

    if (!model) {
      return NextResponse.json(
        { success: false, error: "Model not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      model
    });
  } catch (error: any) {
    console.error("Error updating AX model:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update model" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/ax-models
 * Delete an AX model configuration
 */
export async function DELETE(request: NextRequest) {
  const { isAdmin, error } = await checkAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { success: false, error: error || "Unauthorized" },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Model ID required" },
        { status: 400 }
      );
    }

    const deleted = await deleteAXModelConfig(parseInt(id, 10));

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Model not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      deleted: true
    });
  } catch (error: any) {
    console.error("Error deleting AX model:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete model" },
      { status: 500 }
    );
  }
}
