"use strict";
/**
 * SSR (Semantic Similarity Rating) Calculator
 * Based on "LLMs Reproduce Human Purchase Intent via Semantic Similarity Elicitation of Likert Ratings"
 * (arXiv:2510.08338v1)
 *
 * Methodology:
 * 1. Generate textual response about purchase intent
 * 2. Convert response to embedding vector
 * 3. Calculate cosine similarity to reference anchors
 * 4. Create probability distribution over Likert scale (1-5)
 * 5. Calculate mean purchase intent
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateSSR = calculateSSR;
exports.getAnchorFromSSRScore = getAnchorFromSSRScore;
exports.compareMethodologies = compareMethodologies;
const reference_anchors_1 = require("./reference-anchors");
// Singleton pattern: Cache the model pipeline to avoid reloading
let embedderPromise = null;
async function getEmbedder() {
    if (!embedderPromise) {
        embedderPromise = (async () => {
            // Using Xenova/all-MiniLM-L6-v2 - lightweight, fast, and effective for semantic similarity
            // Model is ~25MB and will be downloaded/cached on first run
            const { pipeline } = await Promise.resolve().then(() => __importStar(require("@xenova/transformers")));
            return pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
        })();
    }
    return embedderPromise;
}
/**
 * Calculate cosine similarity between two vectors
 * Formula: γ(a, b) = (a · b) / (|a| |b|)
 */
function cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
        throw new Error("Vectors must have the same length");
    }
    // Dot product
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    // Magnitudes
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    if (magnitudeA === 0 || magnitudeB === 0) {
        return 0;
    }
    return dotProduct / (magnitudeA * magnitudeB);
}
/**
 * Get embedding vector using Transformers.js (local, no API key needed!)
 */
async function getEmbedding(text) {
    try {
        const extractor = await getEmbedder();
        // Generate embedding using the local model
        const output = await extractor(text, { pooling: 'mean', normalize: true });
        // Convert to regular array
        const embedding = Array.from(output.data);
        return embedding;
    }
    catch (error) {
        console.error("Error getting embedding:", error);
        throw new Error("Failed to generate embedding");
    }
}
/**
 * Calculate SSR score and probability distribution
 */
async function calculateSSR(textualResponse) {
    try {
        // Get embedding for the textual response
        const responseEmbedding = await getEmbedding(textualResponse);
        // Get embeddings for all reference anchors
        const anchorStatements = (0, reference_anchors_1.getAllAnchorStatements)();
        const anchorEmbeddings = await Promise.all(anchorStatements.map((statement) => getEmbedding(statement)));
        // Calculate cosine similarity to each anchor
        const similarities = anchorEmbeddings.map((anchorEmbed, index) => ({
            anchor: reference_anchors_1.REFERENCE_ANCHORS[index],
            similarity: cosineSimilarity(responseEmbedding, anchorEmbed),
        }));
        // Group by tier and average
        const tierSimilarities = {
            low: similarities.filter((s) => s.anchor.tier === "low"),
            middle: similarities.filter((s) => s.anchor.tier === "middle"),
            high: similarities.filter((s) => s.anchor.tier === "high"),
        };
        const avgSimilarities = {
            low: tierSimilarities.low.reduce((sum, s) => sum + s.similarity, 0) / tierSimilarities.low.length,
            middle: tierSimilarities.middle.reduce((sum, s) => sum + s.similarity, 0) / tierSimilarities.middle.length,
            high: tierSimilarities.high.reduce((sum, s) => sum + s.similarity, 0) / tierSimilarities.high.length,
        };
        // Map to Likert scale distribution
        // Low tier → Likert 1-2, Middle → Likert 3, High → Likert 4-5
        const epsilon = 0.001; // Small constant to prevent division by zero
        const minSimilarity = Math.min(avgSimilarities.low, avgSimilarities.middle, avgSimilarities.high);
        const maxSimilarity = Math.max(avgSimilarities.low, avgSimilarities.middle, avgSimilarities.high);
        const range = maxSimilarity - minSimilarity + epsilon;
        // Range-normalize to [0, 1] - preserves relative spread and prevents compression
        const adjustedLow = (avgSimilarities.low - minSimilarity) / range;
        const adjustedMiddle = (avgSimilarities.middle - minSimilarity) / range;
        const adjustedHigh = (avgSimilarities.high - minSimilarity) / range;
        // Distribute across Likert scale
        // Low tier gets split between ratings 1 and 2
        // Middle tier goes to rating 3
        // High tier gets split between ratings 4 and 5
        const rating1 = adjustedLow * 0.6;
        const rating2 = adjustedLow * 0.4;
        const rating3 = adjustedMiddle;
        const rating4 = adjustedHigh * 0.5;
        const rating5 = adjustedHigh * 0.5;
        // Normalize to probability distribution (sum = 1)
        const total = rating1 + rating2 + rating3 + rating4 + rating5;
        const distribution = {
            rating1: rating1 / total,
            rating2: rating2 / total,
            rating3: rating3 / total,
            rating4: rating4 / total,
            rating5: rating5 / total,
        };
        // Calculate mean purchase intent (PI = Σ(i × p(i)))
        const meanIntent = 1 * distribution.rating1 +
            2 * distribution.rating2 +
            3 * distribution.rating3 +
            4 * distribution.rating4 +
            5 * distribution.rating5;
        // Convert to 0-100 scale
        const ssrScore = ((meanIntent - 1) / 4) * 100;
        // Calculate confidence using BOTH entropy and margin metrics
        // Entropy: Measures overall distribution spread
        const entropy = -Object.values(distribution).reduce((sum, p) => sum + (p > 0 ? p * Math.log2(p) : 0), 0);
        const maxEntropy = Math.log2(5); // Maximum entropy for 5 categories
        const entropyConfidence = ((maxEntropy - entropy) / maxEntropy) * 100;
        // Margin: Difference between top 2 probabilities (higher = more decisive)
        const sortedProbs = Object.values(distribution).sort((a, b) => b - a);
        const margin = sortedProbs[0] - sortedProbs[1];
        const marginConfidence = margin * 100; // Convert to percentage
        // Combined confidence: Average of both metrics for robust measurement
        const confidence = (entropyConfidence + marginConfidence) / 2;
        return {
            ssrScore: Math.round(ssrScore),
            ssrConfidence: Math.round(confidence),
            ssrDistribution: distribution,
            anchorSimilarities: [
                { tier: "low", similarity: avgSimilarities.low },
                { tier: "middle", similarity: avgSimilarities.middle },
                { tier: "high", similarity: avgSimilarities.high },
            ],
            marginConfidence: Math.round(marginConfidence), // Return margin separately for debugging
        };
    }
    catch (error) {
        console.error("SSR calculation error:", error);
        throw error;
    }
}
/**
 * Determine anchor tier from SSR score
 */
function getAnchorFromSSRScore(ssrScore) {
    if (ssrScore <= 33)
        return "low";
    if (ssrScore <= 66)
        return "middle";
    return "high";
}
/**
 * Compare factor-based and SSR methodologies
 */
function compareMethodologies(factorScore, ssrScore) {
    const difference = Math.abs(factorScore - ssrScore);
    let agreement;
    let confidenceLevel;
    let explanation;
    if (difference <= 10) {
        agreement = "high";
        confidenceLevel = 95;
        explanation =
            "Both methodologies strongly agree. The factor-based analysis and demographic-informed SSR prediction align closely, indicating high confidence in the purchase intent assessment.";
    }
    else if (difference <= 25) {
        agreement = "medium";
        confidenceLevel = 75;
        explanation =
            "Moderate agreement between methodologies. While both approaches point in the same general direction, there are some differences. The SSR method's demographic focus may reveal insights not captured by factor analysis alone.";
    }
    else {
        agreement = "low";
        confidenceLevel = 50;
        explanation =
            "Significant disagreement between methodologies. The factor-based analysis and SSR prediction differ substantially. This suggests demographic factors may strongly influence purchase intent in ways not fully captured by product factors alone. Consider weighing the SSR score more heavily as it accounts for human behavioral patterns.";
    }
    return { agreement, confidenceLevel, explanation };
}
