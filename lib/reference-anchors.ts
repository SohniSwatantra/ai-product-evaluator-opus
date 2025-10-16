/**
 * Reference Anchor Statements for SSR Methodology
 * Based on "LLMs Reproduce Human Purchase Intent via Semantic Similarity Elicitation of Likert Ratings"
 * (arXiv:2510.08338v1)
 *
 * Three-tier anchor system:
 * - LOW (0-33%): Purchase unlikely
 * - MIDDLE (34-66%): Uncertain/indifferent
 * - HIGH (67-100%): Strong purchase intent
 *
 * Each tier has 5 variations to capture semantic nuances
 */

export interface ReferenceAnchor {
  tier: "low" | "middle" | "high";
  statement: string;
  likertRange: [number, number]; // Corresponding Likert scale range (1-5)
}

export const REFERENCE_ANCHORS: ReferenceAnchor[] = [
  // LOW TIER ANCHORS (Likert 1-2, 0-33% probability)
  {
    tier: "low",
    statement: "I definitely would not purchase this product. It does not meet my needs or expectations at all.",
    likertRange: [1, 2],
  },
  {
    tier: "low",
    statement: "This product is not appealing to me. I see no reason to buy it given the alternatives available.",
    likertRange: [1, 2],
  },
  {
    tier: "low",
    statement: "I am very unlikely to purchase this. The product does not align with what I'm looking for.",
    likertRange: [1, 2],
  },
  {
    tier: "low",
    statement: "This is not a product I would consider buying. It fails to address my requirements.",
    likertRange: [1, 2],
  },
  {
    tier: "low",
    statement: "I have no interest in purchasing this product. It doesn't offer what I need.",
    likertRange: [1, 2],
  },

  // MIDDLE TIER ANCHORS (Likert 3, 34-66% probability)
  {
    tier: "middle",
    statement: "I'm uncertain about this product. It has some appealing features but also some concerns.",
    likertRange: [3, 3],
  },
  {
    tier: "middle",
    statement: "I'm neutral towards this product. It neither strongly appeals to me nor turns me away.",
    likertRange: [3, 3],
  },
  {
    tier: "middle",
    statement: "I might consider this product. I need more information before making a decision.",
    likertRange: [3, 3],
  },
  {
    tier: "middle",
    statement: "I'm indifferent about purchasing this. The product has both pros and cons that balance out.",
    likertRange: [3, 3],
  },
  {
    tier: "middle",
    statement: "I'm on the fence about this product. It could work for me, but I'm not fully convinced.",
    likertRange: [3, 3],
  },

  // HIGH TIER ANCHORS (Likert 4-5, 67-100% probability)
  {
    tier: "high",
    statement: "I would definitely purchase this product. It meets all my needs and expectations perfectly.",
    likertRange: [4, 5],
  },
  {
    tier: "high",
    statement: "This product is very appealing to me. I can see myself buying it soon.",
    likertRange: [4, 5],
  },
  {
    tier: "high",
    statement: "I'm highly likely to purchase this. The product aligns excellently with what I'm looking for.",
    likertRange: [4, 5],
  },
  {
    tier: "high",
    statement: "This is exactly the kind of product I would buy. It offers great value and meets my requirements.",
    likertRange: [4, 5],
  },
  {
    tier: "high",
    statement: "I have strong interest in purchasing this product. It addresses my needs better than alternatives.",
    likertRange: [4, 5],
  },
];

/**
 * Get reference anchors by tier
 */
export function getAnchorsByTier(tier: "low" | "middle" | "high"): ReferenceAnchor[] {
  return REFERENCE_ANCHORS.filter((anchor) => anchor.tier === tier);
}

/**
 * Get all reference anchor statements as an array
 */
export function getAllAnchorStatements(): string[] {
  return REFERENCE_ANCHORS.map((anchor) => anchor.statement);
}
