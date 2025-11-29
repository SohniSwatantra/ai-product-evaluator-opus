#!/usr/bin/env node

/**
 * GitHub Actions Worker Script (TypeScript)
 * Runs the full product evaluation pipeline and updates the evaluation_jobs table.
 *
 * The script mirrors the synchronous evaluation flow used locally so that the
 * Netlify build (and any other deployment that relies on GitHub Actions)
 * produces identical output – including SSR analysis, AX scoring, section
 * recommendations, and website snapshots.
 */

import Anthropic from "@anthropic-ai/sdk";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { neon } from "@neondatabase/serverless";
import { existsSync } from "fs";
import path from "path";
import { readFile, unlink } from "fs/promises";

import { calculateSSR, compareMethodologies, getAnchorFromSSRScore } from "../lib/ssr-calculator";
import { createAXEvaluationPrompt, parseAgentExperience } from "../lib/ax-evaluator";
import { scrapeWebsite, extractProductInfo } from "../lib/web-scraper";
import { saveEvaluation } from "../lib/db";
import type { Demographics, ProductEvaluation, SectionRecommendation } from "../types";

// ---------------------------------------------------------------------------
// Environment Variables
// ---------------------------------------------------------------------------

const PRODUCT_URL = process.env.PRODUCT_URL ?? "";
const DEMOGRAPHICS: Demographics = JSON.parse(process.env.DEMOGRAPHICS || "{}");
const JOB_ID = process.env.JOB_ID ?? "";
const DATABASE_URL = process.env.DATABASE_URL ?? "";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID ?? "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID ?? "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY ?? "";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME ?? "ai-evaluator-screenshots";

if (!PRODUCT_URL || !JOB_ID || !DATABASE_URL || !ANTHROPIC_API_KEY) {
  console.error("Missing required environment variables. Exiting.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

const sql = neon(DATABASE_URL);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

console.log(`🚀 Starting evaluation for job ${JOB_ID}`);
console.log(`   Product URL: ${PRODUCT_URL}`);
console.log(`   Demographics:`, DEMOGRAPHICS);

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

async function updateJobStatus(status: string, error: string | null = null) {
  try {
    await sql`
      UPDATE evaluation_jobs
      SET status = ${status},
          error = ${error},
          updated_at = NOW()
      WHERE id = ${JOB_ID}
    `;
    console.log(`✅ Job status updated to: ${status}`);
  } catch (err) {
    console.error("Failed to update job status:", err);
  }
}

async function fetchJobMetadata(): Promise<Record<string, any> | null> {
  try {
    const result = await sql`
      SELECT user_id
      FROM evaluation_jobs
      WHERE id = ${JOB_ID}
      LIMIT 1
    `;
    return result[0] ?? null;
  } catch (error) {
    console.error("Failed to fetch job metadata:", error);
    return null;
  }
}

async function uploadToR2(localPath: string, key: string): Promise<string | null> {
  try {
    const fileContent = await readFile(localPath);

    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: fileContent,
        ContentType: "image/png",
      })
    );

    const publicUrl = `https://pub-${R2_ACCOUNT_ID}.r2.dev/${key}`;
    console.log(`✅ Uploaded to R2: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error(`Failed to upload ${localPath} to R2:`, error);
    return null;
  }
}

function validateAndFixURL(url: string): string {
  let normalized = url.trim();

  if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
    normalized = `https://${normalized}`;
  }

  try {
    const urlObj = new URL(normalized);
    if (!urlObj.hostname.includes(".")) {
      urlObj.hostname = `${urlObj.hostname}.com`;
      normalized = urlObj.toString();
      console.log(`ℹ️ Auto-corrected URL to: ${normalized}`);
    }
    return normalized;
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }
}

function cleanAndParseJSON(text: string): ProductEvaluation {
  console.log(`📝 Parsing Claude response (${text.length} chars)`);
  console.log(`   First 200 chars: ${text.substring(0, 200).replace(/\n/g, "\\n")}`);

  let payload = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "");
  const jsonMatch = payload.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON object found in response");
  }

  let jsonStr = jsonMatch[0];

  try {
    return JSON.parse(jsonStr);
  } catch (err) {
    console.warn("⚠️ Initial JSON parse failed, attempting cleanup", err);
  }

  try {
    jsonStr = jsonStr
      .replace(/,(\s*[}\]])/g, "$1")
      .replace(/\n/g, " ")
      .replace(/\r/g, "")
      .replace(/\t/g, " ")
      .replace(/\s+/g, " ")
      .replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3')
      .replace(/'/g, '"')
      .replace(/:\s*([a-zA-Z][a-zA-Z0-9\s-]*?)(\s*[,}])/g, (match, value, ending) => {
        const trimmed = value.trim();
        if (["true", "false", "null"].includes(trimmed) || /^\d+(\.\d+)?$/.test(trimmed)) {
          return match;
        }
        return `: "${trimmed}"${ending}`;
      });

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("❌ Failed to parse evaluation JSON", error);
    throw new Error("Claude returned malformed JSON");
  }
}

function buildDemographicDescription(demographics: Demographics): string {
  return `
Target Customer Profile:
- Age: ${demographics.ageRange} years old
- Gender: ${demographics.gender}
- Income: ${
    demographics.incomeTier === "low"
      ? "Low (<$50k/year)"
      : demographics.incomeTier === "medium"
      ? "Medium ($50k-$100k/year)"
      : "High (>$100k/year)"
  }
- Region: ${demographics.region}
${demographics.ethnicity ? `- Ethnicity: ${demographics.ethnicity}` : ""}`.trim();
}

async function removeLocalFile(maybePath: string | null | undefined) {
  if (!maybePath) return;
  try {
    await unlink(maybePath);
  } catch {
    // Ignore – the file may already have been removed.
  }
}

function resolveScreenshotPath(localPath: string | undefined | null): string | null {
  if (!localPath) {
    return null;
  }

  // If it's an absolute filesystem path and exists, return it
  if (path.isAbsolute(localPath) && existsSync(localPath)) {
    return localPath;
  }

  // Remove leading slashes to get relative path
  const sanitized = localPath.replace(/^\/+/, "");

  // Try public/screenshots/ directory first (where web scraper saves files)
  const withPublic = path.join(process.cwd(), "public", sanitized);
  if (existsSync(withPublic)) {
    return withPublic;
  }

  // Try direct path from cwd
  const direct = path.join(process.cwd(), sanitized);
  if (existsSync(direct)) {
    return direct;
  }

  // Return the public path as fallback (even if doesn't exist yet)
  return withPublic;
}

// ---------------------------------------------------------------------------
// Main Evaluation Flow
// ---------------------------------------------------------------------------

async function runEvaluation() {
  await updateJobStatus("processing");

  const jobMeta = await fetchJobMetadata();
  const userId = jobMeta?.user_id ?? null;

  const validatedUrl = validateAndFixURL(PRODUCT_URL);

  console.log("🌐 Starting web scraping for:", validatedUrl);
  const scrapedData = await scrapeWebsite(validatedUrl, {
    timeout: 30000,
    fullPage: true,
    viewportWidth: 1920,
    viewportHeight: 1080,
  });

  if (scrapedData.error) {
    console.warn("⚠️ Web scraping reported an error:", scrapedData.error);
  } else {
    console.log("✅ Website scraped successfully");
    console.log("  - Title:", scrapedData.title);
    console.log("  - Screenshot:", scrapedData.screenshotPath);
  }

  const productInfo = extractProductInfo(scrapedData);
  const demographicDescription = buildDemographicDescription(DEMOGRAPHICS);

  const scrapedDataAppendix = buildScrapedDataAppendix(scrapedData, productInfo);

  const evaluationPrompt = `You are an AI agent evaluating products using a dual methodology combining insights from TWO research papers:
1. "What Is Your AI Agent Buying?" (arXiv:2508.02630) - Factor-based product analysis
2. "LLMs Reproduce Human Purchase Intent" (arXiv:2510.08338v1) - Demographics-driven intent prediction

**PRODUCT TO ANALYZE:** ${validatedUrl}

**TARGET CUSTOMER DEMOGRAPHICS:**
${demographicDescription}

**YOUR TASK:** Evaluate how likely THIS SPECIFIC demographic is to purchase from this product page.

## Research-Based Evaluation Framework:

### DEMOGRAPHICS IMPACT (Critical!)
Based on research findings, analyze how each demographic factor affects purchase intent:
- **Age**: Different age groups respond to different marketing approaches, trust signals, and price points
- **Gender**: Purchasing patterns and decision factors vary significantly by gender
- **Income**: Directly affects price sensitivity and value perception
- **Region**: Cultural and economic factors influence buying behavior
- **Ethnicity**: May affect brand affinity and trust signals

### PRODUCT ATTRIBUTES (Identify These)
1. **Category**: What type of product/service is this? (e.g., personal care, electronics, SaaS, fashion, food)
2. **Price Tier**: low (<$50), medium ($50-$200), high ($200-$1000), or premium (>$1000)
3. **Concept Source**: Is this an established brand, new startup, direct-to-consumer, or marketplace seller?

### 6 EVALUATION FACTORS (Score 0-100 each)
1. **Positioning** - Visibility, featured status, discoverability for THIS demographic
2. **Pricing** - Value perception and affordability for THIS income level
3. **Social Proof** - Reviews, ratings, testimonials relevant to THIS demographic
4. **Trust Signals** - Company reputation, guarantees, certifications that resonate with THIS audience
5. **Marketing Elements** - Advertising approach effectiveness for THIS demographic
6. **Authority Signals** - Awards, partnerships, endorsements that matter to THIS demographic

### THREE-TIER PURCHASE INTENT ANCHORS
Based on the research paper's methodology, classify purchase intent into one of three anchors:

🔴 **LOW ANCHOR (0-33%)**: "This demographic is UNLIKELY to purchase"
- Characteristics: Poor fit, major barriers, misaligned value proposition
- Customer would likely say: "No, I would not buy this"

🟡 **MIDDLE ANCHOR (34-66%)**: "This demographic is UNCERTAIN or INDIFFERENT"
- Characteristics: Some appeal but significant reservations, mixed signals
- Customer would likely say: "Maybe, I'm not sure" or "I need more information"

🟢 **HIGH ANCHOR (67-100%)**: "This demographic has STRONG PURCHASE INTENT"
- Characteristics: Strong fit, clear value, minimal barriers
- Customer would likely say: "Yes, I would likely buy this" or "I'm very interested"

**IMPORTANT**: Your anchor classification should heavily weight demographic fit!

## Required JSON Response Structure:
{
  "url": "${validatedUrl}",
  "overallScore": 75,
  "buyingIntentProbability": 68,
  "purchaseIntentAnchor": "middle",  // Must be: "low", "middle", or "high"
  "targetDemographics": {
    "ageRange": "${DEMOGRAPHICS.ageRange}",
    "gender": "${DEMOGRAPHICS.gender}",
    "incomeTier": "${DEMOGRAPHICS.incomeTier}",
    "region": "${DEMOGRAPHICS.region}"${DEMOGRAPHICS.ethnicity ? `,\n    "ethnicity": "${DEMOGRAPHICS.ethnicity}"` : ""}
  },
  "productAttributes": {
    "category": "Electronics",  // Identify the product category
    "priceTier": "medium",      // low, medium, high, or premium
    "conceptSource": "Established Brand"  // Type of seller/brand
  },
  "factors": [
    {
      "name": "Positioning",
      "score": 80,
      "weight": 0.15,
      "description": "How this factor affects THIS demographic specifically",
      "impact": "positive"
    },
    // ... all 6 factors (Positioning, Pricing, Social Proof, Trust Signals, Marketing Elements, Authority Signals)
  ],
  "analysis": "Overall evaluation paragraph explaining product-demographic fit",
  "demographicImpact": "Detailed analysis of how EACH demographic factor (age, gender, income, region) specifically influences purchase intent for this product. Explain WHY this demographic would or wouldn't buy.",
  "recommendations": [
    "Recommendation 1 tailored to improve conversion for THIS demographic",
    "Recommendation 2...",
    // 3-5 total recommendations
  ],
  "timestamp": "${new Date().toISOString()}"
}

**CRITICAL INSTRUCTIONS:**
1. The purchaseIntentAnchor MUST match the buyingIntentProbability: 0-33% = "low", 34-66% = "middle", 67-100% = "high"
2. The demographicImpact field is REQUIRED and must explain how EACH demographic factor affects purchase intent
3. All factor descriptions must be specific to the target demographic
4. Recommendations must be tailored to improve appeal for this specific demographic

---

${scrapedDataAppendix}
`;

  const evaluationResponse = await anthropic.messages.create({
    model: "claude-opus-4-5-20251101",
    max_tokens: 3000,
    messages: [{ role: "user", content: evaluationPrompt }],
  });

  const evaluationText =
    evaluationResponse.content[0].type === "text" ? evaluationResponse.content[0].text : "";

  const evaluation = cleanAndParseJSON(evaluationText);

  await enrichWithSSRAnalysis(evaluation, validatedUrl, demographicDescription);
  await enrichWithAXAnalysis(evaluation, validatedUrl);
  await enrichWithSectionRecommendations(evaluation, validatedUrl, demographicDescription, scrapedData, productInfo);

  if (!scrapedData.error) {
    evaluation.websiteSnapshot = {
      screenshotPath: scrapedData.screenshotPath,
      heroScreenshotPath: scrapedData.heroScreenshotPath,
      sectionScreenshots: scrapedData.sectionScreenshots,
      productName: productInfo.productName,
      price: productInfo.price,
      rating: productInfo.rating,
      reviewCount: productInfo.reviewCount,
      description: productInfo.description,
      keyFeatures: productInfo.keyFeatures,
    };
  }

  evaluation.url = validatedUrl;
  evaluation.targetDemographics = {
    ageRange: DEMOGRAPHICS.ageRange,
    gender: DEMOGRAPHICS.gender,
    incomeTier: DEMOGRAPHICS.incomeTier,
    region: DEMOGRAPHICS.region,
    ...(DEMOGRAPHICS.ethnicity ? { ethnicity: DEMOGRAPHICS.ethnicity } : {}),
  };
  evaluation.timestamp = new Date().toISOString();

  // Upload all screenshots to R2 and replace local paths with remote URLs.
  await pushScreenshotsToR2(evaluation, scrapedData);

  // Save evaluation to permanent table (used for history dashboards)
  try {
    await saveEvaluation(evaluation, userId);
    console.log("💾 Evaluation stored in evaluations table");
  } catch (error) {
    console.error("Failed to save evaluation to evaluations table:", error);
  }

  // Persist evaluation result in jobs table for frontend polling
  await sql`
    UPDATE evaluation_jobs
    SET status = 'completed',
        result = ${evaluation},
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = ${JOB_ID}
  `;

  console.log(`✅ Evaluation completed for job ${JOB_ID}`);
}

// ---------------------------------------------------------------------------
// Prompt Builders & Enrichments (borrowed from synchronous API flow)
// ---------------------------------------------------------------------------

function buildScrapedDataAppendix(
  scrapedData: Awaited<ReturnType<typeof scrapeWebsite>>,
  productInfo: ReturnType<typeof extractProductInfo>
): string {
  if (scrapedData.error) {
    return `
⚠️ Website scraping failed. Error: ${scrapedData.error}
Falling back to generic evaluation based on domain knowledge.
`;
  }

  return `
**Product Information:**
- Product Name: ${productInfo.productName}
- Price: ${productInfo.price}
- Rating: ${productInfo.rating}
- Reviews: ${productInfo.reviewCount}
- Description: ${productInfo.description}

**Key Features:**
${productInfo.keyFeatures.length > 0 ? productInfo.keyFeatures.map((f) => `- ${f}`).join("\n") : "- No key features extracted"}

**Social Proof (Factor 3: Reviews, ratings, testimonials):**
${scrapedData.socialProof?.starRating ? `- Star Rating: ${scrapedData.socialProof.starRating}/5 (Sentiment: ${scrapedData.socialProof.reviewSentiment})` : "- Star Rating: Not found"}
${scrapedData.socialProof?.userCount ? `- User Count: ${scrapedData.socialProof.userCount}` : ""}
${scrapedData.socialProof?.testimonials && scrapedData.socialProof.testimonials.length > 0 ? `- Customer Testimonials Found: ${scrapedData.socialProof.testimonials.length}\n  Sample: "${scrapedData.socialProof.testimonials[0].substring(0, 150)}..."` : "- No testimonials found"}
${scrapedData.socialProof?.verifiedBadges && scrapedData.socialProof.verifiedBadges.length > 0 ? `- Verified Badges: ${scrapedData.socialProof.verifiedBadges.join(", ")}` : ""}

**Trust Signals (Factor 4: Security, guarantees, certifications):**
${scrapedData.trustSignals?.securityBadges && scrapedData.trustSignals.securityBadges.length > 0 ? `- Security Badges: ${scrapedData.trustSignals.securityBadges.join(", ")}` : "- No security badges found"}
${scrapedData.trustSignals?.guarantees && scrapedData.trustSignals.guarantees.length > 0 ? `- Guarantees/Warranties: ${scrapedData.trustSignals.guarantees.slice(0, 3).join("; ")}` : "- No guarantees found"}
${scrapedData.trustSignals?.returnPolicy ? `- Return Policy: ${scrapedData.trustSignals.returnPolicy}` : "- Return policy not clearly stated"}
${scrapedData.trustSignals?.paymentMethods && scrapedData.trustSignals.paymentMethods.length > 0 ? `- Payment Methods: ${scrapedData.trustSignals.paymentMethods.join(", ")}` : ""}
${scrapedData.trustSignals?.certifications && scrapedData.trustSignals.certifications.length > 0 ? `- Certifications: ${scrapedData.trustSignals.certifications.join(", ")}` : ""}

**Authority Signals (Factor 6: Awards, partnerships, endorsements):**
${scrapedData.authoritySignals?.awards && scrapedData.authoritySignals.awards.length > 0 ? `- Awards: ${scrapedData.authoritySignals.awards.slice(0, 3).join(", ")}` : "- No awards found"}
${scrapedData.authoritySignals?.asSeenOn && scrapedData.authoritySignals.asSeenOn.length > 0 ? `- Featured In: ${scrapedData.authoritySignals.asSeenOn.slice(0, 5).join(", ")}` : "- No media mentions found"}
${scrapedData.authoritySignals?.partnerships && scrapedData.authoritySignals.partnerships.length > 0 ? `- Partnerships/Integrations: ${scrapedData.authoritySignals.partnerships.slice(0, 3).join(", ")}` : ""}
${scrapedData.authoritySignals?.expertEndorsements && scrapedData.authoritySignals.expertEndorsements.length > 0 ? `- Expert Endorsements: Found ${scrapedData.authoritySignals.expertEndorsements.length}` : ""}

**Marketing Elements (Factor 5: Advertising approach, CTAs, urgency):**
${scrapedData.marketingElements?.ctas && scrapedData.marketingElements.ctas.length > 0 ? `- Call-to-Actions: ${scrapedData.marketingElements.ctas.slice(0, 5).map((cta) => `"${cta.text}" (${cta.type})`).join(", ")}` : "- No clear CTAs found"}
${scrapedData.marketingElements?.urgencyMessages && scrapedData.marketingElements.urgencyMessages.length > 0 ? `- Urgency/Scarcity Messages: ${scrapedData.marketingElements.urgencyMessages.slice(0, 3).join("; ")}` : "- No urgency messaging detected"}
${scrapedData.marketingElements?.discounts && scrapedData.marketingElements.discounts.length > 0 ? `- Discounts/Promotions: ${scrapedData.marketingElements.discounts.slice(0, 3).join(", ")}` : ""}
${scrapedData.marketingElements?.countdowns ? "- ⚠️ Countdown Timer Detected (can create pressure)" : ""}
${scrapedData.marketingElements?.popups ? "- ⚠️ Popup/Modal Detected (can be intrusive)" : ""}

**Page Content (first 5000 chars):**
${scrapedData.visibleText.substring(0, 5000)}
`;
}

async function enrichWithSSRAnalysis(
  evaluation: ProductEvaluation,
  productUrl: string,
  demographicDescription: string
) {
  try {
    const prompt = `Based on the research paper "LLMs Reproduce Human Purchase Intent via Semantic Similarity Elicitation of Likert Ratings" (arXiv:2510.08338v1), provide a natural, detailed textual response about purchase intent for this product.

**PRODUCT:** ${productUrl}

**TARGET CUSTOMER:**
${demographicDescription}

**YOUR TASK:** Write a 2-3 paragraph textual response explaining how likely this specific demographic is to purchase this product. Write as if you ARE a person from this demographic sharing your honest thoughts about buying this product.

Consider:
- How well the product fits this demographic's needs and lifestyle
- Price affordability relative to this income level
- Whether the product appeals to this age group and gender
- Regional and cultural factors that might influence the decision
- Trust, brand perception, and social proof relevant to this demographic

Write naturally and conversationally. Be specific about WHY you would or wouldn't buy it. Don't use a rating scale - just explain your thoughts and feelings about purchasing this product.`;

    const response = await anthropic.messages.create({
      model: "claude-opus-4-5-20251101",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const textualAnalysis =
      response.content[0].type === "text" ? response.content[0].text : "";

    if (!textualAnalysis) {
      return;
    }

    const ssrResults = await calculateSSR(textualAnalysis);
    const comparison = compareMethodologies(evaluation.overallScore, ssrResults.ssrScore);

    evaluation.ssrScore = ssrResults.ssrScore;
    evaluation.ssrConfidence = ssrResults.ssrConfidence;
    evaluation.ssrMarginConfidence = ssrResults.marginConfidence;
    evaluation.ssrDistribution = ssrResults.ssrDistribution;
    evaluation.textualAnalysis = textualAnalysis;
    evaluation.methodologyComparison = {
      agreement: comparison.agreement,
      factorScore: evaluation.overallScore,
      ssrScore: ssrResults.ssrScore,
      confidenceLevel: comparison.confidenceLevel,
      explanation: comparison.explanation,
    };

    evaluation.buyingIntentProbability = ssrResults.ssrScore;
    evaluation.purchaseIntentAnchor = getAnchorFromSSRScore(ssrResults.ssrScore);
  } catch (error) {
    console.error("SSR calculation failed:", error);
  }
}

async function enrichWithAXAnalysis(evaluation: ProductEvaluation, productUrl: string) {
  try {
    const prompt = createAXEvaluationPrompt(productUrl);
    const response = await anthropic.messages.create({
      model: "claude-opus-4-5-20251101",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const agentExperience = parseAgentExperience(text);

    if (agentExperience) {
      evaluation.agentExperience = agentExperience;
    }
  } catch (error) {
    console.error("AX evaluation failed:", error);
  }
}

async function enrichWithSectionRecommendations(
  evaluation: ProductEvaluation,
  productUrl: string,
  demographicDescription: string,
  scrapedData: Awaited<ReturnType<typeof scrapeWebsite>>,
  productInfo: ReturnType<typeof extractProductInfo>
) {
  try {
    if (scrapedData.error || !scrapedData.sectionScreenshots) {
      return;
    }

    const prompt = `Based on your evaluation of ${productUrl} for the target demographic (${DEMOGRAPHICS.ageRange}, ${DEMOGRAPHICS.gender}, ${DEMOGRAPHICS.incomeTier} income), provide a detailed section-by-section breakdown of recommendations.

**YOUR TASK:** For each major section of the website, analyze what's working and what needs improvement. Focus on actionable, specific recommendations.

**EVALUATION FACTORS TO CONSIDER:**
1. **Positioning** (Score: ${evaluation.factors[0]?.score ?? 'N/A'}/100)
2. **Pricing** (Score: ${evaluation.factors[1]?.score ?? 'N/A'}/100)
3. **Social Proof** (Score: ${evaluation.factors[2]?.score ?? 'N/A'}/100)
4. **Trust Signals** (Score: ${evaluation.factors[3]?.score ?? 'N/A'}/100)
5. **Marketing Elements** (Score: ${evaluation.factors[4]?.score ?? 'N/A'}/100)
6. **Authority Signals** (Score: ${evaluation.factors[5]?.score ?? 'N/A'}/100)

**SCRAPED DATA SUMMARY:**
- Pricing: ${productInfo.price}
- Social Proof: ${scrapedData.socialProof?.starRating ? `${scrapedData.socialProof.starRating}/5 stars` : 'No rating'}, ${scrapedData.socialProof?.userCount || 'No user count'}
- Trust Signals: ${scrapedData.trustSignals?.guarantees?.length || 0} guarantees found, ${scrapedData.trustSignals?.securityBadges?.length || 0} security badges
- Marketing: ${scrapedData.marketingElements?.ctas?.length || 0} CTAs, ${scrapedData.marketingElements?.urgencyMessages?.length || 0} urgency messages
- Authority: ${scrapedData.authoritySignals?.awards?.length || 0} awards, ${scrapedData.authoritySignals?.asSeenOn?.length || 0} media mentions

**REQUIRED JSON RESPONSE:**
Return an array of section recommendations. Each section should include:
- section: The section name - **MUST use EXACTLY ONE of these names:**
  * "Pricing" (not "Price", "Pricing Section", or any variation)
  * "Social Proof" (not "Reviews", "Testimonials", or any variation)
  * "Trust Signals" (not "Trust", "Security", or any variation)
  * "Marketing Elements" (not "CTAs", "Call to Action", or any variation)
  * "Features" (not "Product Features", "Key Features", or any variation)
- score: The relevant factor score for that section (0-100)
- issues: Array of 2-4 specific problems found in this section
- recommendations: Array of 2-4 actionable improvements for this section
- impact: Priority level ("high", "medium", or "low")

**CRITICAL - SECTION NAMING:**
⚠️ The "section" field MUST use the EXACT names listed above. Do not use variations or abbreviations. This is required for screenshot mapping.

**IMPORTANT GUIDELINES:**
- Be specific and actionable (not generic advice)
- Focus on the target demographic's needs
- Prioritize high-impact changes
- Reference actual data from the scraped website
- Only include sections that are relevant and have actionable feedback

Example format:
[
  {
    "section": "Pricing",
    "score": 68,
    "issues": [
      "Price is buried below the fold and not immediately visible",
      "No comparison with competitors to justify the cost",
      "Lacks pricing tiers for different budgets"
    ],
    "recommendations": [
      "Move pricing information above the fold in the hero section",
      "Add a comparison table showing value vs. competitors",
      "Introduce tiered pricing options (Basic, Pro, Enterprise) to appeal to different income levels"
    ],
    "impact": "high"
  },
  {
    "section": "Social Proof",
    "score": 85,
    "issues": [
      "Testimonials lack demographic diversity",
      "No video testimonials to increase authenticity"
    ],
    "recommendations": [
      "Add testimonials from customers matching the target demographic (${DEMOGRAPHICS.ageRange}, ${DEMOGRAPHICS.gender})",
      "Include 2-3 short video testimonials for higher trust",
      "Display real-time user activity or purchase notifications"
    ],
    "impact": "medium"
  }
]

Provide 4-6 section recommendations focusing on the most impactful improvements for this specific demographic.`;

    const response = await anthropic.messages.create({
      model: "claude-opus-4-5-20251101",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const sectionJsonMatch = text.match(/\[[\s\S]*\]/);
    if (!sectionJsonMatch) {
      return;
    }

    const sectionedRecommendations: SectionRecommendation[] = JSON.parse(sectionJsonMatch[0]);

    const sectionNameMapping: Record<string, keyof NonNullable<typeof scrapedData.sectionScreenshots>> = {
      Pricing: "pricing",
      "Social Proof": "socialProof",
      "Trust Signals": "trustSignals",
      "Marketing Elements": "marketing",
      Features: "features",
      "Hero Section": "hero",
    };

    for (const section of sectionedRecommendations) {
      const key = sectionNameMapping[section.section];
      if (key && scrapedData.sectionScreenshots?.[key]) {
        section.screenshotPath = scrapedData.sectionScreenshots[key];
        section.isFallbackScreenshot = false;
      } else {
        section.screenshotPath = scrapedData.heroScreenshotPath || scrapedData.screenshotPath;
        section.isFallbackScreenshot = true;
      }
    }

    evaluation.sectionedRecommendations = sectionedRecommendations;
  } catch (error) {
    console.error("Section recommendations generation failed:", error);
  }
}

async function pushScreenshotsToR2(
  evaluation: ProductEvaluation,
  scrapedData: Awaited<ReturnType<typeof scrapeWebsite>>
) {
  const screenshotUploads: Array<{ localPath: string; assign: (url: string) => void }> = [];

  const baseKey = `${JOB_ID}/${Date.now()}`;

  if (evaluation.websiteSnapshot?.screenshotPath) {
    const local = evaluation.websiteSnapshot.screenshotPath;
    screenshotUploads.push({
      localPath: local,
      assign: (url) => {
        evaluation.websiteSnapshot!.screenshotPath = url;
      },
    });
  }

  if (evaluation.websiteSnapshot?.heroScreenshotPath) {
    const local = evaluation.websiteSnapshot.heroScreenshotPath;
    screenshotUploads.push({
      localPath: local,
      assign: (url) => {
        evaluation.websiteSnapshot!.heroScreenshotPath = url;
        if (scrapedData.sectionScreenshots?.hero) {
          scrapedData.sectionScreenshots.hero = url;
        }
      },
    });
  }

  if (evaluation.websiteSnapshot?.sectionScreenshots) {
    for (const [section, localPath] of Object.entries(evaluation.websiteSnapshot.sectionScreenshots)) {
      if (!localPath) continue;
      screenshotUploads.push({
        localPath,
        assign: (url) => {
          evaluation.websiteSnapshot!.sectionScreenshots![section as keyof typeof evaluation.websiteSnapshot.sectionScreenshots] =
            url;
        },
      });
    }
  }

  if (evaluation.sectionedRecommendations) {
    for (const recommendation of evaluation.sectionedRecommendations) {
      if (!recommendation.screenshotPath) continue;
      screenshotUploads.push({
        localPath: recommendation.screenshotPath,
        assign: (url) => {
          recommendation.screenshotPath = url;
        },
      });
    }
  }

  console.log(`📤 Uploading ${screenshotUploads.length} screenshots to R2...`);

  for (const [index, item] of screenshotUploads.entries()) {
    const resolvedPath = resolveScreenshotPath(item.localPath);
    console.log(`  [${index + 1}/${screenshotUploads.length}] Original path: ${item.localPath}`);
    console.log(`  [${index + 1}/${screenshotUploads.length}] Resolved path: ${resolvedPath}`);
    console.log(`  [${index + 1}/${screenshotUploads.length}] File exists: ${resolvedPath && existsSync(resolvedPath)}`);

    if (!resolvedPath || !existsSync(resolvedPath)) {
      console.log(`  [${index + 1}/${screenshotUploads.length}] ⚠️ Skipping - file not found`);
      continue;
    }

    const key = `${baseKey}/screenshot-${index}.png`;
    console.log(`  [${index + 1}/${screenshotUploads.length}] Uploading to R2 key: ${key}`);
    const uploaded = await uploadToR2(resolvedPath, key);
    if (uploaded) {
      console.log(`  [${index + 1}/${screenshotUploads.length}] ✅ Uploaded: ${uploaded}`);
      item.assign(uploaded);
      await removeLocalFile(resolvedPath);
    } else {
      console.log(`  [${index + 1}/${screenshotUploads.length}] ❌ Upload failed`);
    }
  }

  console.log(`📤 R2 upload complete`);
}

// ---------------------------------------------------------------------------
// Entrypoint
// ---------------------------------------------------------------------------

runEvaluation()
  .then(() => updateJobStatus("completed"))
  .catch(async (error) => {
    console.error("❌ Evaluation failed:", error);
    await updateJobStatus("failed", error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
