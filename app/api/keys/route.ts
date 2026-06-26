import { NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";
import { createApiKey, listApiKeys } from "@/lib/db";

/**
 * Tier 3: Manage API keys for the public scoring API.
 * GET  /api/keys        -> list the signed-in user's keys (prefixes only)
 * POST /api/keys {name} -> create a new key (returns plaintext ONCE)
 */
export async function GET() {
  const user = await stackServerApp.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const keys = await listApiKeys(user.id);
  return NextResponse.json({ keys });
}

export async function POST(request: Request) {
  const user = await stackServerApp.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let name = "API Key";
  try {
    const body = await request.json();
    if (body?.name && typeof body.name === "string") name = body.name.slice(0, 60);
  } catch {
    /* no body is fine */
  }

  const { key, record } = await createApiKey(user.id, name);
  // The plaintext key is returned exactly once and never stored.
  return NextResponse.json({ key, record });
}
