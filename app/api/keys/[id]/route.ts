import { NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";
import { revokeApiKey } from "@/lib/db";

/**
 * Tier 3: Revoke an API key.
 * DELETE /api/keys/[id]
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await stackServerApp.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const keyId = parseInt(id);
  if (isNaN(keyId)) return NextResponse.json({ error: "Invalid key id" }, { status: 400 });

  const ok = await revokeApiKey(user.id, keyId);
  if (!ok) return NextResponse.json({ error: "Key not found" }, { status: 404 });
  return NextResponse.json({ revoked: true });
}
