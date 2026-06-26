/**
 * Tier 4: Agent Task Scenarios (axis-style evaluation)
 *
 * Instead of probing static signals (Tier 1), this RUNS an AI agent against a
 * task on the target site, captures the full transcript, and has an LLM judge
 * grade it across the four dimensions netlify/axis uses:
 *
 *   Goal Achievement  0.40   — did the agent finish the task (per rubric)?
 *   Environment       0.20   — quality of local/tool execution
 *   Service           0.20   — quality of the site/API responses
 *   Agent             0.20   — quality of the agent's own decisions
 *
 * The composite is the weighted sum (0-100). Bounded tool iterations keep it
 * runnable inside a serverless function; heavy use should run via the worker.
 */

import Anthropic from "@anthropic-ai/sdk";

// axis DEFAULT_WEIGHTS
export const SCENARIO_WEIGHTS = {
  goal: 0.4,
  environment: 0.2,
  service: 0.2,
  agent: 0.2,
} as const;

export interface JudgeCriterion {
  check: string;
  weight?: number;
}

export interface ScenarioDimensionScores {
  goal: number;
  environment: number;
  service: number;
  agent: number;
}

export interface TranscriptEntry {
  role: "user" | "assistant" | "tool";
  content: string;
}

export interface ScenarioResult {
  url: string;
  task: string;
  composite: number;
  dimensions: ScenarioDimensionScores;
  judgeReasoning: string;
  transcript: TranscriptEntry[];
  toolCalls: number;
  weights: typeof SCENARIO_WEIGHTS;
  error?: string;
}

const AGENT_MODEL = "claude-opus-4-8";
const MAX_TOOL_ITERATIONS = 4;
const FETCH_TIMEOUT_MS = 8000;
const AGENT_USER_AGENT =
  "Mozilla/5.0 (compatible; AX-Scenario-Agent/1.0; +https://2031ai.com)";

const FETCH_TOOL: Anthropic.Tool = {
  name: "fetch_url",
  description:
    "Fetch the text content of a page on the target website. Provide an absolute URL on the same site.",
  input_schema: {
    type: "object",
    properties: {
      url: { type: "string", description: "Absolute URL to fetch (must be on the target site)" },
    },
    required: ["url"],
  },
};

/** Fetch a URL, restricted to the target origin, returning trimmed text. */
async function fetchForAgent(targetOrigin: string, rawUrl: string): Promise<string> {
  let url: URL;
  try {
    url = new URL(rawUrl, targetOrigin);
  } catch {
    return "ERROR: invalid URL";
  }
  if (url.origin !== targetOrigin) {
    return `ERROR: refusing to fetch off-site URL (${url.origin}). Only ${targetOrigin} is allowed.`;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { "User-Agent": AGENT_USER_AGENT, Accept: "text/html, text/markdown, text/plain" },
      redirect: "follow",
    });
    const body = await res.text();
    const text = body
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const status = `HTTP ${res.status} ${res.headers.get("content-type") || ""}`;
    return `${status}\n${text.slice(0, 4000)}`;
  } catch (e) {
    return `ERROR fetching ${url.toString()}: ${e instanceof Error ? e.message : "unknown"}`;
  } finally {
    clearTimeout(timer);
  }
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * Run an agent against a task on the site, then judge the transcript.
 * Never throws — failures are returned in `error` with zeroed scores.
 */
export async function runScenario(
  url: string,
  task: string,
  checks: JudgeCriterion[] = []
): Promise<ScenarioResult> {
  const weights = SCENARIO_WEIGHTS;
  const base: ScenarioResult = {
    url,
    task,
    composite: 0,
    dimensions: { goal: 0, environment: 0, service: 0, agent: 0 },
    judgeReasoning: "",
    transcript: [],
    toolCalls: 0,
    weights,
  };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ...base, error: "ANTHROPIC_API_KEY not configured" };

  let targetOrigin: string;
  try {
    targetOrigin = new URL(url).origin;
  } catch {
    return { ...base, error: "Invalid target URL" };
  }

  const anthropic = new Anthropic({ apiKey });
  const transcript: TranscriptEntry[] = [];
  let toolCalls = 0;

  const systemPrompt = `You are an autonomous AI agent acting as a real user of a website. Your job is to accomplish the given task using ONLY the fetch_url tool to read pages on the site (${targetOrigin}). Reason step by step, fetch the pages you need, and finish with a concise answer describing what you found and whether you completed the task. Do not invent information you did not fetch.`;

  const userTask = `Target site: ${url}\n\nTask: ${task}`;
  transcript.push({ role: "user", content: userTask });

  const messages: Anthropic.MessageParam[] = [{ role: "user", content: userTask }];

  try {
    for (let i = 0; i <= MAX_TOOL_ITERATIONS; i++) {
      const response = await anthropic.messages.create({
        model: AGENT_MODEL,
        max_tokens: 1200,
        system: systemPrompt,
        tools: [FETCH_TOOL],
        messages,
      });

      // Record assistant text
      const assistantText = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      if (assistantText) transcript.push({ role: "assistant", content: assistantText });

      messages.push({ role: "assistant", content: response.content });

      if (response.stop_reason !== "tool_use") break;

      // Execute every tool call in this turn
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type !== "tool_use") continue;
        toolCalls++;
        const input = block.input as { url?: string };
        const fetched = await fetchForAgent(targetOrigin, input.url || url);
        transcript.push({ role: "tool", content: `fetch_url(${input.url}) -> ${fetched.slice(0, 500)}` });
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: fetched,
        });
      }
      messages.push({ role: "user", content: toolResults });
      if (i === MAX_TOOL_ITERATIONS) break;
    }

    // Judge the transcript across the four axis dimensions.
    const judged = await judgeTranscript(anthropic, url, task, checks, transcript);
    const dimensions = judged.dimensions;
    const composite = clamp(
      dimensions.goal * weights.goal +
        dimensions.environment * weights.environment +
        dimensions.service * weights.service +
        dimensions.agent * weights.agent
    );

    return {
      ...base,
      composite,
      dimensions,
      judgeReasoning: judged.reasoning,
      transcript,
      toolCalls,
    };
  } catch (e) {
    return { ...base, transcript, toolCalls, error: e instanceof Error ? e.message : "Agent run failed" };
  }
}

async function judgeTranscript(
  anthropic: Anthropic,
  url: string,
  task: string,
  checks: JudgeCriterion[],
  transcript: TranscriptEntry[]
): Promise<{ dimensions: ScenarioDimensionScores; reasoning: string }> {
  const rubric =
    checks.length > 0
      ? checks.map((c, i) => `${i + 1}. (weight ${c.weight ?? 1}) ${c.check}`).join("\n")
      : "1. The agent accomplished the stated task using information actually found on the site.";

  const transcriptText = transcript
    .map((t) => `[${t.role.toUpperCase()}] ${t.content}`)
    .join("\n\n")
    .slice(0, 12000);

  const prompt = `You are an impartial judge grading how well an AI agent performed a task on a website. Grade FOUR independent dimensions, each 0-100:

- goal: Did the agent achieve the task? Judge against this rubric:\n${rubric}
- environment: Quality of tool execution (did fetches succeed, were errors handled, any flakiness?).
- service: Quality of the website's responses (did pages load, return useful content, or error/timeout?).
- agent: Quality of the agent's decisions (sensible tool use, no redundant or wasteful calls, coherent plan).

Target site: ${url}
Task: ${task}

TRANSCRIPT:
${transcriptText}

Respond with ONLY valid JSON:
{"goal": <0-100>, "environment": <0-100>, "service": <0-100>, "agent": <0-100>, "reasoning": "<2-3 sentences>"}`;

  const res = await anthropic.messages.create({
    model: AGENT_MODEL,
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  const text = res.content[0].type === "text" ? res.content[0].text : "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    return {
      dimensions: { goal: 0, environment: 0, service: 0, agent: 0 },
      reasoning: "Judge returned no parseable score.",
    };
  }
  try {
    const parsed = JSON.parse(match[0]);
    return {
      dimensions: {
        goal: clamp(parsed.goal ?? 0),
        environment: clamp(parsed.environment ?? 0),
        service: clamp(parsed.service ?? 0),
        agent: clamp(parsed.agent ?? 0),
      },
      reasoning: parsed.reasoning ?? "",
    };
  } catch {
    return {
      dimensions: { goal: 0, environment: 0, service: 0, agent: 0 },
      reasoning: "Judge returned malformed JSON.",
    };
  }
}
