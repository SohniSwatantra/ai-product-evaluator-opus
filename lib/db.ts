/**
 * Database connection and queries for Neon PostgreSQL
 */

import { neon } from "@neondatabase/serverless";
import type { ProductEvaluation } from "@/types";

// Initialize Neon client
const sql = neon(process.env.DATABASE_URL || "");

/**
 * Initialize database schema
 * Creates the evaluations table if it doesn't exist
 */
export async function initDatabase() {
  try {
    // Create evaluations table
    await sql`
      CREATE TABLE IF NOT EXISTS evaluations (
        id SERIAL PRIMARY KEY,
        url TEXT NOT NULL,
        overall_score INTEGER NOT NULL,
        buying_intent_probability INTEGER NOT NULL,
        purchase_intent_anchor TEXT NOT NULL,
        target_demographics JSONB NOT NULL,
        product_attributes JSONB NOT NULL,
        factors JSONB NOT NULL,
        analysis TEXT NOT NULL,
        demographic_impact TEXT NOT NULL,
        recommendations JSONB NOT NULL,
        ssr_score INTEGER,
        ssr_confidence INTEGER,
        ssr_margin_confidence INTEGER,
        ssr_distribution JSONB,
        textual_analysis TEXT,
        methodology_comparison JSONB,
        ax_score INTEGER,
        anps INTEGER,
        ax_factors JSONB,
        agent_accessibility TEXT,
        ax_recommendations JSONB,
        sectioned_recommendations JSONB,
        website_snapshot JSONB,
        user_id TEXT,
        timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    // Create evaluation jobs table for async processing
    await sql`
      CREATE TABLE IF NOT EXISTS evaluation_jobs (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        demographics JSONB NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        result JSONB,
        error TEXT,
        user_id TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMP
      )
    `;

    // Create indices for faster queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_evaluations_timestamp ON evaluations(timestamp DESC)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_evaluations_user_id ON evaluations(user_id)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_jobs_status ON evaluation_jobs(status)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON evaluation_jobs(created_at DESC)
    `;

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}

/**
 * Save a product evaluation to the database
 */
export async function saveEvaluation(evaluation: ProductEvaluation, userId?: string | null): Promise<number> {
  try {
    const result = await sql`
      INSERT INTO evaluations (
        url,
        overall_score,
        buying_intent_probability,
        purchase_intent_anchor,
        target_demographics,
        product_attributes,
        factors,
        analysis,
        demographic_impact,
        recommendations,
        ssr_score,
        ssr_confidence,
        ssr_margin_confidence,
        ssr_distribution,
        textual_analysis,
        methodology_comparison,
        ax_score,
        anps,
        ax_factors,
        agent_accessibility,
        ax_recommendations,
        sectioned_recommendations,
        website_snapshot,
        user_id,
        timestamp
      ) VALUES (
        ${evaluation.url},
        ${evaluation.overallScore},
        ${evaluation.buyingIntentProbability},
        ${evaluation.purchaseIntentAnchor},
        ${JSON.stringify(evaluation.targetDemographics)},
        ${JSON.stringify(evaluation.productAttributes)},
        ${JSON.stringify(evaluation.factors)},
        ${evaluation.analysis},
        ${evaluation.demographicImpact},
        ${JSON.stringify(evaluation.recommendations)},
        ${evaluation.ssrScore || null},
        ${evaluation.ssrConfidence || null},
        ${evaluation.ssrMarginConfidence || null},
        ${evaluation.ssrDistribution ? JSON.stringify(evaluation.ssrDistribution) : null},
        ${evaluation.textualAnalysis || null},
        ${evaluation.methodologyComparison ? JSON.stringify(evaluation.methodologyComparison) : null},
        ${evaluation.agentExperience?.axScore || null},
        ${evaluation.agentExperience?.anps || null},
        ${evaluation.agentExperience ? JSON.stringify(evaluation.agentExperience.factors) : null},
        ${evaluation.agentExperience?.agentAccessibility || null},
        ${evaluation.agentExperience ? JSON.stringify(evaluation.agentExperience.recommendations) : null},
        ${evaluation.sectionedRecommendations ? JSON.stringify(evaluation.sectionedRecommendations) : null},
        ${evaluation.websiteSnapshot ? JSON.stringify(evaluation.websiteSnapshot) : null},
        ${userId || null},
        ${evaluation.timestamp}
      )
      RETURNING id
    `;

    const id = result[0]?.id;
    console.log(`Saved evaluation with ID: ${id}${userId ? ` for user: ${userId}` : ' (anonymous)'}`);
    return id;
  } catch (error) {
    console.error("Error saving evaluation:", error);
    throw error;
  }
}

/**
 * Get all evaluations, ordered by timestamp (most recent first)
 */
export async function getAllEvaluations(limit: number = 50): Promise<ProductEvaluation[]> {
  try {
    const results = await sql`
      SELECT
        id,
        url,
        overall_score,
        buying_intent_probability,
        purchase_intent_anchor,
        target_demographics,
        product_attributes,
        factors,
        analysis,
        demographic_impact,
        recommendations,
        ssr_score,
        ssr_confidence,
        ssr_margin_confidence,
        ssr_distribution,
        textual_analysis,
        methodology_comparison,
        ax_score,
        anps,
        ax_factors,
        agent_accessibility,
        ax_recommendations,
        sectioned_recommendations,
        website_snapshot,
        timestamp
      FROM evaluations
      ORDER BY timestamp DESC
      LIMIT ${limit}
    `;

    return results.map((row: any) => {
      // Transform legacy demographics format to current format
      let demographics = row.target_demographics;
      if (demographics && (!demographics.ageRange || !demographics.incomeTier)) {
        // Legacy format detected (missing new fields) - transform to new format
        demographics = {
          ageRange: demographics.age || demographics.ageRange || "25-34",
          gender: demographics.gender || "all",
          incomeTier: demographics.income || demographics.incomeTier || "medium",
          region: demographics.region || "north-america",
          ...(demographics.ethnicity && { ethnicity: demographics.ethnicity }),
        };
      }

      const evaluation: ProductEvaluation = {
        url: row.url,
        overallScore: row.overall_score,
        buyingIntentProbability: row.buying_intent_probability,
        purchaseIntentAnchor: row.purchase_intent_anchor,
        targetDemographics: demographics,
        productAttributes: row.product_attributes,
        factors: row.factors,
        analysis: row.analysis,
        demographicImpact: row.demographic_impact,
        recommendations: row.recommendations,
        ssrScore: row.ssr_score,
        ssrConfidence: row.ssr_confidence,
        ssrMarginConfidence: row.ssr_margin_confidence,
        ssrDistribution: row.ssr_distribution,
        textualAnalysis: row.textual_analysis,
        methodologyComparison: row.methodology_comparison,
        timestamp: row.timestamp,
      };

      // Add AX data if available
      if (row.ax_score && row.anps && row.ax_factors) {
        evaluation.agentExperience = {
          axScore: row.ax_score,
          anps: row.anps,
          factors: row.ax_factors,
          agentAccessibility: row.agent_accessibility || "",
          recommendations: row.ax_recommendations || [],
        };
      }

      // Add section recommendations if available
      if (row.sectioned_recommendations) {
        evaluation.sectionedRecommendations = row.sectioned_recommendations;
      }

      // Add website snapshot if available
      if (row.website_snapshot) {
        evaluation.websiteSnapshot = row.website_snapshot;
      }

      return evaluation;
    });
  } catch (error) {
    console.error("Error fetching evaluations:", error);
    throw error;
  }
}

/**
 * Get a single evaluation by ID
 */
export async function getEvaluationById(id: number): Promise<ProductEvaluation | null> {
  try {
    const results = await sql`
      SELECT
        id,
        url,
        overall_score,
        buying_intent_probability,
        purchase_intent_anchor,
        target_demographics,
        product_attributes,
        factors,
        analysis,
        demographic_impact,
        recommendations,
        ssr_score,
        ssr_confidence,
        ssr_margin_confidence,
        ssr_distribution,
        textual_analysis,
        methodology_comparison,
        ax_score,
        anps,
        ax_factors,
        agent_accessibility,
        ax_recommendations,
        sectioned_recommendations,
        website_snapshot,
        timestamp
      FROM evaluations
      WHERE id = ${id}
    `;

    if (results.length === 0) {
      return null;
    }

    const row = results[0];

    // Transform legacy demographics format to current format
    let demographics = row.target_demographics;
    if (demographics && (!demographics.ageRange || !demographics.incomeTier)) {
      // Legacy format detected (missing new fields) - transform to new format
      demographics = {
        ageRange: demographics.age || demographics.ageRange || "25-34",
        gender: demographics.gender || "all",
        incomeTier: demographics.income || demographics.incomeTier || "medium",
        region: demographics.region || "north-america",
        ...(demographics.ethnicity && { ethnicity: demographics.ethnicity }),
      };
    }

    const evaluation: ProductEvaluation = {
      url: row.url,
      overallScore: row.overall_score,
      buyingIntentProbability: row.buying_intent_probability,
      purchaseIntentAnchor: row.purchase_intent_anchor,
      targetDemographics: demographics,
      productAttributes: row.product_attributes,
      factors: row.factors,
      analysis: row.analysis,
      demographicImpact: row.demographic_impact,
      recommendations: row.recommendations,
      ssrScore: row.ssr_score,
      ssrConfidence: row.ssr_confidence,
      ssrMarginConfidence: row.ssr_margin_confidence,
      ssrDistribution: row.ssr_distribution,
      textualAnalysis: row.textual_analysis,
      methodologyComparison: row.methodology_comparison,
      timestamp: row.timestamp,
    };

    // Add AX data if available
    if (row.ax_score && row.anps && row.ax_factors) {
      evaluation.agentExperience = {
        axScore: row.ax_score,
        anps: row.anps,
        factors: row.ax_factors,
        agentAccessibility: row.agent_accessibility || "",
        recommendations: row.ax_recommendations || [],
      };
    }

    // Add section recommendations if available
    if (row.sectioned_recommendations) {
      evaluation.sectionedRecommendations = row.sectioned_recommendations;
    }

    // Add website snapshot if available
    if (row.website_snapshot) {
      evaluation.websiteSnapshot = row.website_snapshot;
    }

    return evaluation;
  } catch (error) {
    console.error("Error fetching evaluation by ID:", error);
    throw error;
  }
}

/**
 * Delete an evaluation by ID
 */
export async function deleteEvaluation(id: number): Promise<boolean> {
  try {
    const result = await sql`
      DELETE FROM evaluations
      WHERE id = ${id}
      RETURNING id
    `;

    return result.length > 0;
  } catch (error) {
    console.error("Error deleting evaluation:", error);
    throw error;
  }
}

/**
 * Get evaluation statistics
 */
export async function getEvaluationStats() {
  try {
    const result = await sql`
      SELECT
        COUNT(*) as total_evaluations,
        AVG(overall_score) as avg_overall_score,
        AVG(buying_intent_probability) as avg_buying_intent,
        COUNT(CASE WHEN purchase_intent_anchor = 'high' THEN 1 END) as high_intent_count,
        COUNT(CASE WHEN purchase_intent_anchor = 'middle' THEN 1 END) as middle_intent_count,
        COUNT(CASE WHEN purchase_intent_anchor = 'low' THEN 1 END) as low_intent_count
      FROM evaluations
    `;

    return result[0];
  } catch (error) {
    console.error("Error fetching evaluation stats:", error);
    throw error;
  }
}

/**
 * Get all evaluations for a specific user
 */
export async function getEvaluationsByUserId(userId: string, limit: number = 50): Promise<(ProductEvaluation & { id?: number })[]> {
  try {
    const results = await sql`
      SELECT
        id,
        url,
        overall_score,
        buying_intent_probability,
        purchase_intent_anchor,
        target_demographics,
        product_attributes,
        factors,
        analysis,
        demographic_impact,
        recommendations,
        ssr_score,
        ssr_confidence,
        ssr_margin_confidence,
        ssr_distribution,
        textual_analysis,
        methodology_comparison,
        ax_score,
        anps,
        ax_factors,
        agent_accessibility,
        ax_recommendations,
        sectioned_recommendations,
        website_snapshot,
        timestamp
      FROM evaluations
      WHERE user_id = ${userId}
      ORDER BY timestamp DESC
      LIMIT ${limit}
    `;

    return results.map((row: any) => {
      // Transform legacy demographics format to current format
      let demographics = row.target_demographics;
      if (demographics && (!demographics.ageRange || !demographics.incomeTier)) {
        demographics = {
          ageRange: demographics.age || demographics.ageRange || "25-34",
          gender: demographics.gender || "all",
          incomeTier: demographics.income || demographics.incomeTier || "medium",
          region: demographics.region || "north-america",
          ...(demographics.ethnicity && { ethnicity: demographics.ethnicity }),
        };
      }

      const evaluation: ProductEvaluation & { id?: number } = {
        id: row.id,
        url: row.url,
        overallScore: row.overall_score,
        buyingIntentProbability: row.buying_intent_probability,
        purchaseIntentAnchor: row.purchase_intent_anchor,
        targetDemographics: demographics,
        productAttributes: row.product_attributes,
        factors: row.factors,
        analysis: row.analysis,
        demographicImpact: row.demographic_impact,
        recommendations: row.recommendations,
        ssrScore: row.ssr_score,
        ssrConfidence: row.ssr_confidence,
        ssrMarginConfidence: row.ssr_margin_confidence,
        ssrDistribution: row.ssr_distribution,
        textualAnalysis: row.textual_analysis,
        methodologyComparison: row.methodology_comparison,
        timestamp: row.timestamp,
      };

      // Add AX data if available
      if (row.ax_score && row.anps && row.ax_factors) {
        evaluation.agentExperience = {
          axScore: row.ax_score,
          anps: row.anps,
          factors: row.ax_factors,
          agentAccessibility: row.agent_accessibility || "",
          recommendations: row.ax_recommendations || [],
        };
      }

      // Add section recommendations if available
      if (row.sectioned_recommendations) {
        evaluation.sectionedRecommendations = row.sectioned_recommendations;
      }

      // Add website snapshot if available
      if (row.website_snapshot) {
        evaluation.websiteSnapshot = row.website_snapshot;
      }

      return evaluation;
    });
  } catch (error) {
    console.error("Error fetching user evaluations:", error);
    throw error;
  }
}

/**
 * Create a new evaluation job
 */
export async function createEvaluationJob(
  jobId: string,
  url: string,
  demographics: any,
  userId?: string | null
): Promise<string> {
  try {
    await sql`
      INSERT INTO evaluation_jobs (id, url, demographics, status, user_id)
      VALUES (${jobId}, ${url}, ${JSON.stringify(demographics)}, 'pending', ${userId || null})
    `;
    console.log(`Created evaluation job: ${jobId}`);
    return jobId;
  } catch (error) {
    console.error("Error creating evaluation job:", error);
    throw error;
  }
}

/**
 * Get evaluation job status
 */
export async function getEvaluationJob(jobId: string) {
  try {
    const results = await sql`
      SELECT id, url, demographics, status, result, error, created_at, updated_at, completed_at
      FROM evaluation_jobs
      WHERE id = ${jobId}
    `;

    if (results.length === 0) {
      return null;
    }

    return results[0];
  } catch (error) {
    console.error("Error fetching evaluation job:", error);
    throw error;
  }
}
