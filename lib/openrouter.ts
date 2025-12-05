/**
 * OpenRouter API integration for multi-model AX evaluations
 */

export interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenRouterError {
  error: {
    message: string;
    type: string;
    code: string;
  };
}

/**
 * Call OpenRouter API with a specific model
 */
export async function callOpenRouter(
  modelId: string,
  prompt: string,
  maxTokens: number = 2000
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://2031ai.com",
      "X-Title": "2031ai - AX Analysis"
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: maxTokens,
      temperature: 0.3, // Lower temperature for more consistent evaluations
    }),
  });

  if (!response.ok) {
    const errorData = await response.json() as OpenRouterError;
    throw new Error(`OpenRouter API error: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json() as OpenRouterResponse;

  if (!data.choices || data.choices.length === 0) {
    throw new Error("No response from OpenRouter API");
  }

  return data.choices[0].message.content;
}

/**
 * Create AX evaluation prompt for a given URL and website data
 */
export function createAXEvaluationPrompt(
  url: string,
  websiteSnapshot?: {
    productName?: string;
    description?: string;
    keyFeatures?: string[];
  }
): string {
  const productInfo = websiteSnapshot ? `
Product Name: ${websiteSnapshot.productName || 'Unknown'}
Description: ${websiteSnapshot.description || 'Not available'}
Key Features: ${websiteSnapshot.keyFeatures?.join(', ') || 'Not available'}
` : '';

  return `You are an AI Agent Experience (AX) evaluator. Analyze the following website/product from the perspective of how easily AI agents (like ChatGPT, Claude, Perplexity) can access, understand, and utilize the information on this website.

Website URL: ${url}
${productInfo}

Evaluate the website on these 7 factors, scoring each from 0-100:

1. **Structured Data** - Presence of Schema.org markup, JSON-LD, Open Graph tags, and other machine-readable metadata
2. **Semantic HTML** - Proper heading hierarchy, ARIA labels, semantic elements (nav, main, article, etc.)
3. **Meta Tags Quality** - Title, description, keywords, and other meta information quality and completeness
4. **Content Accessibility** - Presence of robots.txt allowing crawling, sitemap.xml, RSS feeds, API documentation
5. **API Availability** - Availability of REST/GraphQL APIs, MCP servers, or other programmatic access methods
6. **Content Clarity** - How clear and unambiguous the value proposition and product information is for AI parsing
7. **Agent Interaction** - Presence of chat widgets, structured FAQs, forms that AI could potentially interact with

For each factor, provide:
- A score (0-100)
- A status: "excellent" (70-100), "good" (40-69), or "needs-improvement" (0-39)
- A brief description of your findings

Also provide:
- An overall AX Score (weighted average)
- Agent accessibility analysis (2-3 sentences describing how accessible this site is to AI agents)
- 3-5 specific recommendations to improve AX

Respond in this exact JSON format:
{
  "axScore": <number 0-100>,
  "factors": [
    {
      "name": "Structured Data",
      "score": <number>,
      "status": "<excellent|good|needs-improvement>",
      "description": "<brief description>"
    },
    ... (all 7 factors)
  ],
  "agentAccessibility": "<2-3 sentences>",
  "recommendations": ["<recommendation 1>", "<recommendation 2>", ...]
}

IMPORTANT: Return ONLY valid JSON, no markdown formatting or explanation text.`;
}

/**
 * Parse AX evaluation response from model
 */
export function parseAXResponse(response: string): {
  axScore: number;
  anps: number;
  factors: {
    name: string;
    score: number;
    status: "excellent" | "good" | "needs-improvement";
    description: string;
  }[];
  agentAccessibility: string;
  recommendations: string[];
} | null {
  try {
    // Remove any markdown code blocks if present
    let cleanedResponse = response.trim();
    if (cleanedResponse.startsWith("```json")) {
      cleanedResponse = cleanedResponse.slice(7);
    }
    if (cleanedResponse.startsWith("```")) {
      cleanedResponse = cleanedResponse.slice(3);
    }
    if (cleanedResponse.endsWith("```")) {
      cleanedResponse = cleanedResponse.slice(0, -3);
    }
    cleanedResponse = cleanedResponse.trim();

    const parsed = JSON.parse(cleanedResponse);

    // Calculate ANPS from AX score
    const axScore = Math.round(parsed.axScore || 0);
    let anps: number;

    if (axScore >= 75) {
      // Promoter range: 50 to 100
      anps = Math.round(50 + ((axScore - 75) / 25) * 50);
    } else if (axScore >= 50) {
      // Passive range: -10 to 49
      anps = Math.round(-10 + ((axScore - 50) / 25) * 59);
    } else {
      // Detractor range: -100 to -11
      anps = Math.round(-100 + (axScore / 50) * 89);
    }

    return {
      axScore,
      anps,
      factors: parsed.factors || [],
      agentAccessibility: parsed.agentAccessibility || "",
      recommendations: parsed.recommendations || []
    };
  } catch (error) {
    console.error("Error parsing AX response:", error);
    return null;
  }
}
