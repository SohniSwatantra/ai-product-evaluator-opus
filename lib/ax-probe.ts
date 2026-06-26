/**
 * Agent-Readiness Probe (Tier 1: Measured AX)
 *
 * Performs REAL HTTP checks against a site to measure how agent-ready it is,
 * instead of asking an LLM to guess. Inspired by netlify/axis and Netlify's
 * Agent Experience (AX) guidance (llms.txt, robots.txt rules for AI agents,
 * content negotiation, Schema.org structured data, AGENTS.md).
 *
 * Runs in a Node context (the GitHub Actions worker) using global `fetch`.
 * Every check is best-effort and never throws — failures are recorded in
 * `errors[]` and the affected signal is treated as "not present".
 */

import type {
  MeasuredSignals,
  MeasuredFactorScores,
  RobotsAgentRule,
} from "@/types";

export type { MeasuredSignals, MeasuredFactorScores, RobotsAgentRule };

// Known AI-agent crawler user-agents we look for in robots.txt
const AI_AGENT_USER_AGENTS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "Google-Extended",
  "CCBot",
  "Applebot-Extended",
  "Bytespider",
  "Amazonbot",
  "cohere-ai",
];

const PROBE_TIMEOUT_MS = 8000;
const PROBE_USER_AGENT =
  "Mozilla/5.0 (compatible; AX-Evaluator/1.0; +https://2031ai.com)";

async function timedFetch(
  url: string,
  init: RequestInit = {}
): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": PROBE_USER_AGENT, ...(init.headers || {}) },
    });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** HEAD-like presence + size check via GET (HEAD is unreliable on many CDNs). */
async function checkResource(
  url: string,
  errors: string[]
): Promise<{ present: boolean; bytes: number; contentType: string | null }> {
  const res = await timedFetch(url);
  if (!res) {
    errors.push(`Request failed: ${url}`);
    return { present: false, bytes: 0, contentType: null };
  }
  if (!res.ok) {
    return { present: false, bytes: 0, contentType: res.headers.get("content-type") };
  }
  const contentType = res.headers.get("content-type");
  // A site that serves its SPA index.html for every unknown path will return 200
  // for /llms.txt. Treat HTML responses to text-file probes as "not present".
  const looksHtml = (contentType || "").includes("text/html");
  let body = "";
  try {
    body = await res.text();
  } catch {
    /* ignore */
  }
  if (looksHtml) {
    return { present: false, bytes: body.length, contentType };
  }
  return { present: body.trim().length > 0, bytes: body.length, contentType };
}

/**
 * Minimal robots.txt parser focused on whether named AI agents are blocked
 * from the whole site (Disallow: /). Falls back to the `*` group.
 */
function parseRobots(text: string): {
  agentRules: RobotsAgentRule[];
  hasSitemapDirective: boolean;
} {
  const lines = text.split(/\r?\n/);
  // group user-agent -> set of disallow paths
  const groups: Record<string, string[]> = {};
  let currentAgents: string[] = [];
  let sawSitemap = false;

  for (const raw of lines) {
    const line = raw.split("#")[0].trim();
    if (!line) continue;
    const [rawKey, ...rest] = line.split(":");
    const key = rawKey.trim().toLowerCase();
    const value = rest.join(":").trim();
    if (key === "user-agent") {
      currentAgents = [value.toLowerCase()];
      if (!groups[value.toLowerCase()]) groups[value.toLowerCase()] = [];
    } else if (key === "disallow") {
      for (const a of currentAgents) {
        if (!groups[a]) groups[a] = [];
        groups[a].push(value);
      }
    } else if (key === "sitemap") {
      sawSitemap = true;
    }
  }

  const isBlocked = (agent: string): boolean => {
    const rules = groups[agent.toLowerCase()] ?? groups["*"] ?? [];
    // Blocked from whole site if there is a bare "Disallow: /"
    return rules.some((r) => r === "/");
  };

  const agentRules: RobotsAgentRule[] = AI_AGENT_USER_AGENTS.filter(
    (a) => groups[a.toLowerCase()] !== undefined || groups["*"] !== undefined
  ).map((a) => ({ userAgent: a, disallowed: isBlocked(a) }));

  return { agentRules, hasSitemapDirective: sawSitemap };
}

/** Extract Schema.org @type values from inline JSON-LD blocks in the HTML. */
function parseJsonLd(html: string): { blocks: number; types: string[] } {
  const types = new Set<string>();
  let blocks = 0;
  const regex =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    blocks++;
    try {
      const json = JSON.parse(match[1].trim());
      collectTypes(json, types);
    } catch {
      /* malformed JSON-LD block — count it but skip types */
    }
  }
  return { blocks, types: Array.from(types) };
}

function collectTypes(node: unknown, out: Set<string>): void {
  if (!node) return;
  if (Array.isArray(node)) {
    node.forEach((n) => collectTypes(n, out));
    return;
  }
  if (typeof node === "object") {
    const obj = node as Record<string, unknown>;
    const t = obj["@type"];
    if (typeof t === "string") out.add(t);
    else if (Array.isArray(t)) t.forEach((x) => typeof x === "string" && out.add(x));
    if (obj["@graph"]) collectTypes(obj["@graph"], out);
  }
}

/**
 * Probe a URL for agent-readiness. `html` (if provided from the scraper) is
 * reused to detect structured data without a second page fetch.
 */
export async function probeAgentReadiness(
  url: string,
  html?: string
): Promise<MeasuredSignals> {
  const errors: string[] = [];
  let origin: string;
  try {
    origin = new URL(url).origin;
  } catch {
    origin = url;
  }

  const signals: MeasuredSignals = {
    checkedAt: new Date().toISOString(),
    origin,
    llmsTxt: { present: false, url: `${origin}/llms.txt`, bytes: 0 },
    llmsFullTxt: { present: false, bytes: 0 },
    wellKnownLlmsTxt: { present: false },
    agentsMd: { present: false, bytes: 0 },
    robotsTxt: {
      present: false,
      allowsAiAgents: true,
      agentRules: [],
      hasSitemapDirective: false,
    },
    sitemapXml: { present: false },
    contentNegotiation: {
      supportsMarkdown: false,
      supportsPlainText: false,
      markdownContentType: null,
      htmlContentType: null,
    },
    structuredData: { jsonLdBlocks: 0, schemaTypes: [], hasOpenGraph: false },
    apiSurface: { hasOpenApi: false, hasWellKnown: false },
    errors,
  };

  // Run all independent network probes in parallel.
  const [
    llms,
    llmsFull,
    wellKnown,
    agents,
    robotsRes,
    sitemap,
    openapi,
    wellKnownRoot,
    mdNeg,
    htmlNeg,
  ] = await Promise.all([
    checkResource(`${origin}/llms.txt`, errors),
    checkResource(`${origin}/llms-full.txt`, errors),
    checkResource(`${origin}/.well-known/llms.txt`, errors),
    checkResource(`${origin}/AGENTS.md`, errors),
    timedFetch(`${origin}/robots.txt`),
    checkResource(`${origin}/sitemap.xml`, errors),
    checkResource(`${origin}/openapi.json`, errors),
    timedFetch(`${origin}/.well-known/`),
    timedFetch(url, { headers: { Accept: "text/markdown, text/plain" } }),
    timedFetch(url, { headers: { Accept: "text/html" } }),
  ]);

  signals.llmsTxt.present = llms.present;
  signals.llmsTxt.bytes = llms.bytes;
  signals.llmsFullTxt = { present: llmsFull.present, bytes: llmsFull.bytes };
  signals.wellKnownLlmsTxt.present = wellKnown.present;
  signals.agentsMd = { present: agents.present, bytes: agents.bytes };
  signals.sitemapXml.present = sitemap.present;
  signals.apiSurface.hasOpenApi = openapi.present;
  signals.apiSurface.hasWellKnown = !!wellKnownRoot && wellKnownRoot.ok;

  // robots.txt
  if (robotsRes && robotsRes.ok) {
    const robotsText = await robotsRes.text().catch(() => "");
    const ct = robotsRes.headers.get("content-type") || "";
    if (robotsText.trim() && !ct.includes("text/html")) {
      const parsed = parseRobots(robotsText);
      const blockedCount = parsed.agentRules.filter((r) => r.disallowed).length;
      signals.robotsTxt = {
        present: true,
        allowsAiAgents:
          parsed.agentRules.length === 0 ? true : blockedCount < parsed.agentRules.length,
        agentRules: parsed.agentRules,
        hasSitemapDirective: parsed.hasSitemapDirective,
      };
    }
  }

  // Content negotiation: did the markdown request return a non-HTML representation?
  if (mdNeg) {
    const mdCt = mdNeg.headers.get("content-type");
    signals.contentNegotiation.markdownContentType = mdCt;
    signals.contentNegotiation.supportsMarkdown =
      !!mdCt && (mdCt.includes("markdown") || mdCt.includes("text/x-markdown"));
    signals.contentNegotiation.supportsPlainText =
      !!mdCt && mdCt.includes("text/plain");
  }
  if (htmlNeg) {
    signals.contentNegotiation.htmlContentType =
      htmlNeg.headers.get("content-type");
  }

  // Structured data — prefer the already-scraped HTML; fall back to a fetch.
  let pageHtml = html;
  if (!pageHtml) {
    const res = await timedFetch(url);
    pageHtml = res ? await res.text().catch(() => "") : "";
  }
  if (pageHtml) {
    const ld = parseJsonLd(pageHtml);
    signals.structuredData.jsonLdBlocks = ld.blocks;
    signals.structuredData.schemaTypes = ld.types;
    signals.structuredData.hasOpenGraph = /property=["']og:/i.test(pageHtml);
  }

  return signals;
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** Turn measured signals into 0-100 sub-scores for the verifiable AX factors. */
export function computeMeasuredFactorScores(
  s: MeasuredSignals
): MeasuredFactorScores {
  // Structured Data
  let structured = 20;
  if (s.structuredData.jsonLdBlocks > 0) structured += 40;
  if (s.structuredData.schemaTypes.length > 0) structured += 20;
  if (s.structuredData.hasOpenGraph) structured += 20;

  // Content Accessibility (robots permits agents + sitemap discoverability)
  let accessibility = 40;
  if (s.robotsTxt.present) {
    accessibility += s.robotsTxt.allowsAiAgents ? 30 : -25;
  }
  if (s.sitemapXml.present || s.robotsTxt.hasSitemapDirective) accessibility += 20;

  // Content Negotiation (the agent-native formats)
  let negotiation = 10;
  if (s.llmsTxt.present) negotiation += 40;
  if (s.llmsFullTxt.present || s.wellKnownLlmsTxt.present) negotiation += 10;
  if (s.contentNegotiation.supportsMarkdown) negotiation += 25;
  else if (s.contentNegotiation.supportsPlainText) negotiation += 10;
  if (s.agentsMd.present) negotiation += 10;

  // API Availability (hard to fully measure; reward discoverable surfaces)
  let api = 20;
  if (s.apiSurface.hasOpenApi) api += 50;
  if (s.apiSurface.hasWellKnown) api += 15;

  return {
    structuredData: clamp(structured),
    contentAccessibility: clamp(accessibility),
    contentNegotiation: clamp(negotiation),
    apiAvailability: clamp(api),
  };
}

/**
 * Human/LLM-readable summary of the MEASURED facts, injected into the AX prompt
 * so the model stops guessing and only writes narrative + recommendations.
 */
export function buildMeasuredSignalsSummary(s: MeasuredSignals): string {
  const yn = (b: boolean) => (b ? "YES" : "NO");
  const blockedAgents = s.robotsTxt.agentRules
    .filter((r) => r.disallowed)
    .map((r) => r.userAgent);

  return `**MEASURED SIGNALS (verified by real HTTP requests — treat as ground truth):**
- llms.txt present: ${yn(s.llmsTxt.present)}${s.llmsTxt.present ? ` (${s.llmsTxt.bytes} bytes)` : ""}
- llms-full.txt present: ${yn(s.llmsFullTxt.present)}
- /.well-known/llms.txt present: ${yn(s.wellKnownLlmsTxt.present)}
- AGENTS.md present: ${yn(s.agentsMd.present)}
- robots.txt present: ${yn(s.robotsTxt.present)}; allows AI agents: ${yn(s.robotsTxt.allowsAiAgents)}${blockedAgents.length ? `; blocked: ${blockedAgents.join(", ")}` : ""}
- sitemap.xml present: ${yn(s.sitemapXml.present || s.robotsTxt.hasSitemapDirective)}
- Content negotiation (Accept: text/markdown): served ${s.contentNegotiation.markdownContentType || "no response"} → markdown supported: ${yn(s.contentNegotiation.supportsMarkdown)}
- Schema.org JSON-LD blocks: ${s.structuredData.jsonLdBlocks}${s.structuredData.schemaTypes.length ? ` (types: ${s.structuredData.schemaTypes.join(", ")})` : ""}
- Open Graph tags: ${yn(s.structuredData.hasOpenGraph)}
- OpenAPI (/openapi.json): ${yn(s.apiSurface.hasOpenApi)}

Use these measured facts for Structured Data, Content Accessibility, Content Negotiation, and API Availability. Do NOT contradict them. For the remaining factors (Semantic HTML, Meta Tags Quality, Content Clarity, Agent Interaction), reason from the page content provided.`;
}
