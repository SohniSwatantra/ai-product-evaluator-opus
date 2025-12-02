/**
 * Agent Experience (AX) Evaluator
 * Based on Matt Biilmann's ANPS (Agent Net Promoter Score) concept
 *
 * Evaluates how easily AI agents can access, understand, and interact with websites
 */

import type { AgentExperience, AXFactor } from "@/types";

/**
 * Calculate AX Score and ANPS from evaluation data
 * This would typically involve analyzing the website's structure, but since we can't
 * actually fetch URLs, we use AI analysis to evaluate agent-friendliness
 */
export function calculateAXScore(factors: AXFactor[]): { axScore: number; anps: number } {
  // Calculate weighted average of factors
  const axScore = Math.round(
    factors.reduce((sum, factor) => sum + factor.score, 0) / factors.length
  );

  // Calculate ANPS (Agent Net Promoter Score)
  // ANPS ranges from -100 to +100
  // Based on the AX score:
  // - 75-100: Promoter (+100 to +50)
  // - 50-74: Passive (+49 to -10)
  // - 0-49: Detractor (-11 to -100)
  let anps: number;

  if (axScore >= 75) {
    // Promoter range
    anps = Math.round(50 + ((axScore - 75) / 25) * 50);
  } else if (axScore >= 50) {
    // Passive range
    anps = Math.round(-10 + ((axScore - 50) / 25) * 59);
  } else {
    // Detractor range
    anps = Math.round(-100 + (axScore / 50) * 89);
  }

  return { axScore, anps };
}

/**
 * Get status label for a factor score
 */
export function getFactorStatus(score: number): "excellent" | "good" | "needs-improvement" {
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  return "needs-improvement";
}

/**
 * Get ANPS category label
 */
export function getANPSCategory(anps: number): "Promoter" | "Passive" | "Detractor" {
  if (anps >= 50) return "Promoter";
  if (anps >= -10) return "Passive";
  return "Detractor";
}

/**
 * Get color for AX score
 */
export function getAXScoreColor(score: number): string {
  if (score >= 75) return "#66ff96"; // Green
  if (score >= 50) return "#ffd93d"; // Yellow
  return "#ff6b6b"; // Red
}

/**
 * Parse agent experience from Claude's response
 * This function extracts AX evaluation from the AI's analysis
 */
export function parseAgentExperience(response: string): AgentExperience | null {
  try {
    // Try to extract JSON block
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const data = JSON.parse(jsonMatch[0]);

    // Calculate final scores
    const { axScore, anps } = calculateAXScore(data.factors);

    return {
      axScore,
      anps,
      factors: data.factors,
      agentAccessibility: data.agentAccessibility,
      recommendations: data.recommendations,
    };
  } catch (error) {
    console.error("Failed to parse agent experience:", error);
    return null;
  }
}

/**
 * Create AX evaluation prompt for Claude
 */
export function createAXEvaluationPrompt(productUrl: string): string {
  return `Evaluate the Agent Experience (AX) of this website: ${productUrl}

**What is Agent Experience (AX)?**
AX measures how easily AI agents (like ChatGPT, Claude, Perplexity) can access, read, understand, and interact with a website. Good AX means agents can quickly determine:
- What the product/service does
- Who it's for
- Key features and benefits
- How to get more information

**Evaluate these 7 Agent Experience factors (score each 0-100):**

1. **Structured Data** - Presence of Schema.org markup, JSON-LD, Open Graph tags, meta descriptions
2. **Semantic HTML** - Proper heading hierarchy (H1, H2, H3), semantic tags, ARIA labels
3. **Meta Tags Quality** - Clear, descriptive title, meta description, keywords
4. **Content Accessibility** - robots.txt allows agents, sitemap.xml exists, RSS/Atom feeds available
5. **API Availability** - REST APIs, GraphQL endpoints, MCP servers, or other programmatic access
6. **Content Clarity** - Purpose and value proposition clear in first 100 words, jargon-free language
7. **Agent Interaction** - Chat widgets, contact forms, feedback mechanisms, structured FAQs

**Return JSON in this exact format:**
{
  "factors": [
    {
      "name": "Structured Data",
      "score": 85,
      "status": "excellent",
      "description": "Has comprehensive Schema.org markup with Product schema"
    },
    {
      "name": "Semantic HTML",
      "score": 78,
      "status": "good",
      "description": "Good heading hierarchy, some semantic improvements needed"
    },
    {
      "name": "Meta Tags Quality",
      "score": 90,
      "status": "excellent",
      "description": "Clear, descriptive meta tags optimized for both humans and agents"
    },
    {
      "name": "Content Accessibility",
      "score": 72,
      "status": "good",
      "description": "Sitemap exists, robots.txt permits crawling, but no RSS feed"
    },
    {
      "name": "API Availability",
      "score": 45,
      "status": "needs-improvement",
      "description": "No public API or MCP server detected for agent access"
    },
    {
      "name": "Content Clarity",
      "score": 88,
      "status": "excellent",
      "description": "Purpose immediately clear, value proposition well-articulated"
    },
    {
      "name": "Agent Interaction",
      "score": 65,
      "status": "good",
      "description": "Contact form available, but lacks AI-friendly structured interaction"
    }
  ],
  "agentAccessibility": "Overall, this website provides GOOD agent experience with clear content structure and semantic markup. Agents can understand the core product offering within seconds. However, adding structured APIs and an MCP server would significantly improve programmatic access. The site follows web standards well, making it easy for agents to parse and extract information. Consider adding JSON-LD structured data for richer agent understanding.",
  "recommendations": [
    "Add Schema.org Product or Service schema with JSON-LD for rich structured data",
    "Implement an MCP (Model Context Protocol) server endpoint for direct agent access",
    "Create a public API or RSS feed for programmatic content consumption",
    "Add structured FAQs with Question schema markup for better agent comprehension",
    "Improve semantic HTML with more descriptive ARIA labels and landmarks",
    "Add a dedicated /api endpoint documentation page for agent developers"
  ]
}

**Important:** Since you cannot actually fetch the URL, use your knowledge about typical website patterns for this domain/type of product to provide realistic evaluation. Focus on what agents would typically need to understand the product effectively.`;
}

/**
 * Get color for AI provider (used in AX Council visualization)
 */
export function getProviderColor(provider: string): string {
  const colors: Record<string, string> = {
    'openai': '#10B981',      // Green
    'anthropic': '#8B5CF6',   // Purple
    'google': '#3B82F6',      // Blue
    'xai': '#EF4444',         // Red
    'council': '#F97316'      // Orange (for leader)
  };
  return colors[provider.toLowerCase()] || '#6B7280'; // Gray fallback
}

/**
 * Extract provider from model display name or model_id
 */
export function getProviderFromModel(modelId: string, displayName: string): string {
  const lowerName = (displayName + ' ' + modelId).toLowerCase();

  if (lowerName.includes('gpt') || lowerName.includes('openai')) return 'openai';
  if (lowerName.includes('claude') || lowerName.includes('anthropic')) return 'anthropic';
  if (lowerName.includes('gemini') || lowerName.includes('google')) return 'google';
  if (lowerName.includes('grok') || lowerName.includes('xai')) return 'xai';

  return 'unknown';
}
