import { NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";
import { validateApiKey } from "@/lib/db";
import { runScenario, type JudgeCriterion } from "@/lib/ax-scenario";

/**
 * Tier 4: Run an agent task scenario against a site and judge the transcript.
 *
 * POST /api/scenario
 *   { "url": "https://example.com",
 *     "task": "Find the pricing for the Pro plan",
 *     "checks": [ { "check": "Agent located the Pro price", "weight": 1 } ] }
 *
 * Auth: signed-in user OR Authorization: Bearer axk_... (API key).
 * Note: this runs a bounded agent loop; for heavy use run it via the worker.
 */
export const maxDuration = 60; // allow the agent loop time on platforms that honor this

function getBearer(request: Request): string | null {
  const auth = request.headers.get("authorization") || request.headers.get("Authorization");
  const m = auth?.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

export async function POST(request: Request) {
  try {
    // Auth: Stack session or API key.
    const user = await stackServerApp.getUser().catch(() => null);
    let authorized = !!user;
    if (!authorized) {
      const key = getBearer(request);
      if (key) authorized = !!(await validateApiKey(key));
    }
    if (!authorized) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { url, task, checks } = body as { url?: string; task?: string; checks?: JudgeCriterion[] };

    if (!url || !task) {
      return NextResponse.json({ error: "url and task are required" }, { status: 400 });
    }

    let normalized = url.trim();
    if (!normalized.match(/^https?:\/\//i)) normalized = "https://" + normalized;
    try {
      new URL(normalized);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const result = await runScenario(normalized, task, Array.isArray(checks) ? checks : []);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Scenario error:", error);
    return NextResponse.json(
      { error: "Scenario failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
