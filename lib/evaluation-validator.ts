import type { ProductEvaluation, EvaluationFactor, SectionRecommendation, Demographics, ProductAttributes } from "../types";

/**
 * Validates and normalizes evaluation data parsed from Claude responses.
 * This ensures all required fields exist with sensible defaults, handling
 * potential variations in model outputs.
 */
export function validateAndNormalizeEvaluation(parsed: any): ProductEvaluation {
  // Ensure factors array exists and has valid structure
  const factors: EvaluationFactor[] = Array.isArray(parsed.factors)
    ? parsed.factors.map((f: any) => ({
        name: f.name || "Unknown Factor",
        score: typeof f.score === "number" ? f.score : 50,
        weight: typeof f.weight === "number" ? f.weight : 0.167,
        description: f.description || "No description provided",
        impact: ["positive", "negative", "neutral"].includes(f.impact) ? f.impact : "neutral"
      }))
    : [];

  // Ensure recommendations array exists
  const recommendations: string[] = Array.isArray(parsed.recommendations)
    ? parsed.recommendations
    : [];

  // Ensure productAttributes exists with defaults
  const productAttributes: ProductAttributes = {
    category: parsed.productAttributes?.category || "Unknown",
    priceTier: ["low", "medium", "high", "premium"].includes(parsed.productAttributes?.priceTier)
      ? parsed.productAttributes.priceTier
      : "medium",
    conceptSource: parsed.productAttributes?.conceptSource || "Unknown"
  };

  // Ensure targetDemographics exists with defaults
  const targetDemographics: Demographics = {
    ageRange: parsed.targetDemographics?.ageRange || "25-34",
    gender: parsed.targetDemographics?.gender || "all",
    incomeTier: parsed.targetDemographics?.incomeTier || "medium",
    region: parsed.targetDemographics?.region || "north-america",
    ...(parsed.targetDemographics?.ethnicity && { ethnicity: parsed.targetDemographics.ethnicity })
  } as Demographics;

  // Validate sectionedRecommendations if present
  const sectionedRecommendations: SectionRecommendation[] | undefined = Array.isArray(parsed.sectionedRecommendations)
    ? parsed.sectionedRecommendations.map((section: any) => ({
        section: section.section || "Unknown Section",
        score: typeof section.score === "number" ? section.score : 50,
        issues: Array.isArray(section.issues) ? section.issues : [],
        recommendations: Array.isArray(section.recommendations) ? section.recommendations : [],
        impact: ["high", "medium", "low"].includes(section.impact) ? section.impact : "medium",
        screenshotPath: section.screenshotPath,
        isFallbackScreenshot: section.isFallbackScreenshot
      }))
    : undefined;

  // Validate websiteSnapshot if present
  const websiteSnapshot = parsed.websiteSnapshot ? {
    screenshotPath: parsed.websiteSnapshot.screenshotPath || "",
    heroScreenshotPath: parsed.websiteSnapshot.heroScreenshotPath,
    heroScreenshotBase64: parsed.websiteSnapshot.heroScreenshotBase64,
    productName: parsed.websiteSnapshot.productName || "Unknown Product",
    price: parsed.websiteSnapshot.price || "Price not available",
    rating: parsed.websiteSnapshot.rating || "No rating",
    reviewCount: parsed.websiteSnapshot.reviewCount || "0",
    description: parsed.websiteSnapshot.description || "",
    keyFeatures: Array.isArray(parsed.websiteSnapshot.keyFeatures) ? parsed.websiteSnapshot.keyFeatures : []
  } : undefined;

  return {
    id: parsed.id,
    url: parsed.url || "",
    overallScore: typeof parsed.overallScore === "number" ? parsed.overallScore : 50,
    buyingIntentProbability: typeof parsed.buyingIntentProbability === "number" ? parsed.buyingIntentProbability : 50,
    purchaseIntentAnchor: ["low", "middle", "high"].includes(parsed.purchaseIntentAnchor)
      ? parsed.purchaseIntentAnchor
      : "middle",
    targetDemographics,
    productAttributes,
    factors,
    analysis: parsed.analysis || "No analysis provided",
    demographicImpact: parsed.demographicImpact || "No demographic impact analysis provided",
    recommendations,
    sectionedRecommendations,
    timestamp: parsed.timestamp || new Date().toISOString(),
    userId: parsed.userId,
    // Optional SSR fields - pass through as-is
    ssrScore: parsed.ssrScore,
    ssrConfidence: parsed.ssrConfidence,
    ssrMarginConfidence: parsed.ssrMarginConfidence,
    ssrDistribution: parsed.ssrDistribution,
    textualAnalysis: parsed.textualAnalysis,
    methodologyComparison: parsed.methodologyComparison,
    // Optional AX and snapshot fields
    agentExperience: parsed.agentExperience,
    websiteSnapshot
  };
}
