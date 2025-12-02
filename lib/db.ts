/**
 * Database connection and queries for Neon PostgreSQL
 */

import { neon } from "@neondatabase/serverless";
import type { ProductEvaluation, AXModelConfig, AXModelEvaluation, AXCouncilResult } from "@/types";

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

// ============================================
// AX Multi-Model Evaluation Functions
// ============================================

/**
 * Initialize AX model tables
 */
export async function initAXModelTables() {
  try {
    // Create ax_model_configs table
    await sql`
      CREATE TABLE IF NOT EXISTS ax_model_configs (
        id SERIAL PRIMARY KEY,
        model_id TEXT UNIQUE NOT NULL,
        display_name TEXT NOT NULL,
        provider TEXT NOT NULL,
        openrouter_model_id TEXT NOT NULL,
        is_enabled BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    // Create ax_model_evaluations table
    await sql`
      CREATE TABLE IF NOT EXISTS ax_model_evaluations (
        id SERIAL PRIMARY KEY,
        evaluation_id INTEGER NOT NULL,
        model_id TEXT NOT NULL,
        ax_score INTEGER,
        anps INTEGER,
        ax_factors JSONB,
        agent_accessibility TEXT,
        ax_recommendations JSONB,
        raw_response TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        error_message TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMP,
        UNIQUE(evaluation_id, model_id)
      )
    `;

    // Create ax_council_results table
    await sql`
      CREATE TABLE IF NOT EXISTS ax_council_results (
        id SERIAL PRIMARY KEY,
        evaluation_id INTEGER UNIQUE NOT NULL,
        final_ax_score INTEGER NOT NULL,
        final_anps INTEGER NOT NULL,
        model_scores JSONB NOT NULL,
        council_analysis TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    // Create indices
    await sql`
      CREATE INDEX IF NOT EXISTS idx_ax_model_evaluations_eval_id ON ax_model_evaluations(evaluation_id)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_ax_model_configs_enabled ON ax_model_configs(is_enabled)
    `;

    console.log("AX model tables initialized successfully");
  } catch (error) {
    console.error("Error initializing AX model tables:", error);
    throw error;
  }
}

/**
 * Get all enabled AX model configurations
 */
export async function getEnabledAXModelConfigs(): Promise<AXModelConfig[]> {
  try {
    const results = await sql`
      SELECT id, model_id, display_name, provider, openrouter_model_id, is_enabled, sort_order, created_at
      FROM ax_model_configs
      WHERE is_enabled = true
      ORDER BY sort_order ASC
    `;
    return results as AXModelConfig[];
  } catch (error) {
    console.error("Error fetching enabled AX model configs:", error);
    throw error;
  }
}

/**
 * Get all AX model configurations (for admin)
 */
export async function getAllAXModelConfigs(): Promise<AXModelConfig[]> {
  try {
    const results = await sql`
      SELECT id, model_id, display_name, provider, openrouter_model_id, is_enabled, sort_order, created_at
      FROM ax_model_configs
      ORDER BY sort_order ASC
    `;
    return results as AXModelConfig[];
  } catch (error) {
    console.error("Error fetching all AX model configs:", error);
    throw error;
  }
}

/**
 * Create a new AX model configuration
 */
export async function createAXModelConfig(config: Omit<AXModelConfig, 'id' | 'created_at'>): Promise<AXModelConfig> {
  try {
    const result = await sql`
      INSERT INTO ax_model_configs (model_id, display_name, provider, openrouter_model_id, is_enabled, sort_order)
      VALUES (${config.model_id}, ${config.display_name}, ${config.provider}, ${config.openrouter_model_id}, ${config.is_enabled}, ${config.sort_order})
      RETURNING id, model_id, display_name, provider, openrouter_model_id, is_enabled, sort_order, created_at
    `;
    return result[0] as AXModelConfig;
  } catch (error) {
    console.error("Error creating AX model config:", error);
    throw error;
  }
}

/**
 * Update an AX model configuration
 */
export async function updateAXModelConfig(id: number, config: Partial<AXModelConfig>): Promise<AXModelConfig | null> {
  try {
    const result = await sql`
      UPDATE ax_model_configs
      SET
        display_name = COALESCE(${config.display_name || null}, display_name),
        provider = COALESCE(${config.provider || null}, provider),
        openrouter_model_id = COALESCE(${config.openrouter_model_id || null}, openrouter_model_id),
        is_enabled = COALESCE(${config.is_enabled ?? null}, is_enabled),
        sort_order = COALESCE(${config.sort_order ?? null}, sort_order)
      WHERE id = ${id}
      RETURNING id, model_id, display_name, provider, openrouter_model_id, is_enabled, sort_order, created_at
    `;
    return result.length > 0 ? result[0] as AXModelConfig : null;
  } catch (error) {
    console.error("Error updating AX model config:", error);
    throw error;
  }
}

/**
 * Delete an AX model configuration
 */
export async function deleteAXModelConfig(id: number): Promise<boolean> {
  try {
    const result = await sql`
      DELETE FROM ax_model_configs
      WHERE id = ${id}
      RETURNING id
    `;
    return result.length > 0;
  } catch (error) {
    console.error("Error deleting AX model config:", error);
    throw error;
  }
}

/**
 * Get AX model evaluations for an evaluation
 */
export async function getAXModelEvaluations(evaluationId: number): Promise<AXModelEvaluation[]> {
  try {
    const results = await sql`
      SELECT id, evaluation_id, model_id, ax_score, anps, ax_factors, agent_accessibility,
             ax_recommendations, raw_response, status, error_message, created_at, completed_at
      FROM ax_model_evaluations
      WHERE evaluation_id = ${evaluationId}
      ORDER BY created_at ASC
    `;
    return results as AXModelEvaluation[];
  } catch (error) {
    console.error("Error fetching AX model evaluations:", error);
    throw error;
  }
}

/**
 * Get a single AX model evaluation
 */
export async function getAXModelEvaluation(evaluationId: number, modelId: string): Promise<AXModelEvaluation | null> {
  try {
    const results = await sql`
      SELECT id, evaluation_id, model_id, ax_score, anps, ax_factors, agent_accessibility,
             ax_recommendations, raw_response, status, error_message, created_at, completed_at
      FROM ax_model_evaluations
      WHERE evaluation_id = ${evaluationId} AND model_id = ${modelId}
    `;
    return results.length > 0 ? results[0] as AXModelEvaluation : null;
  } catch (error) {
    console.error("Error fetching AX model evaluation:", error);
    throw error;
  }
}

/**
 * Create or update an AX model evaluation
 */
export async function upsertAXModelEvaluation(evaluation: Omit<AXModelEvaluation, 'id' | 'created_at'>): Promise<AXModelEvaluation> {
  try {
    const result = await sql`
      INSERT INTO ax_model_evaluations (
        evaluation_id, model_id, ax_score, anps, ax_factors, agent_accessibility,
        ax_recommendations, raw_response, status, error_message, completed_at
      )
      VALUES (
        ${evaluation.evaluation_id},
        ${evaluation.model_id},
        ${evaluation.ax_score},
        ${evaluation.anps},
        ${evaluation.ax_factors ? JSON.stringify(evaluation.ax_factors) : null},
        ${evaluation.agent_accessibility},
        ${evaluation.ax_recommendations ? JSON.stringify(evaluation.ax_recommendations) : null},
        ${evaluation.raw_response},
        ${evaluation.status},
        ${evaluation.error_message || null},
        ${evaluation.completed_at || null}
      )
      ON CONFLICT (evaluation_id, model_id)
      DO UPDATE SET
        ax_score = EXCLUDED.ax_score,
        anps = EXCLUDED.anps,
        ax_factors = EXCLUDED.ax_factors,
        agent_accessibility = EXCLUDED.agent_accessibility,
        ax_recommendations = EXCLUDED.ax_recommendations,
        raw_response = EXCLUDED.raw_response,
        status = EXCLUDED.status,
        error_message = EXCLUDED.error_message,
        completed_at = EXCLUDED.completed_at
      RETURNING id, evaluation_id, model_id, ax_score, anps, ax_factors, agent_accessibility,
                ax_recommendations, raw_response, status, error_message, created_at, completed_at
    `;
    return result[0] as AXModelEvaluation;
  } catch (error) {
    console.error("Error upserting AX model evaluation:", error);
    throw error;
  }
}

/**
 * Get AX Council result for an evaluation
 */
export async function getAXCouncilResult(evaluationId: number): Promise<AXCouncilResult | null> {
  try {
    const results = await sql`
      SELECT id, evaluation_id, final_ax_score, final_anps, model_scores, council_analysis, created_at
      FROM ax_council_results
      WHERE evaluation_id = ${evaluationId}
    `;
    return results.length > 0 ? results[0] as AXCouncilResult : null;
  } catch (error) {
    console.error("Error fetching AX council result:", error);
    throw error;
  }
}

/**
 * Save AX Council result
 */
export async function saveAXCouncilResult(result: Omit<AXCouncilResult, 'id' | 'created_at'>): Promise<AXCouncilResult> {
  try {
    const dbResult = await sql`
      INSERT INTO ax_council_results (evaluation_id, final_ax_score, final_anps, model_scores, council_analysis)
      VALUES (
        ${result.evaluation_id},
        ${result.final_ax_score},
        ${result.final_anps},
        ${JSON.stringify(result.model_scores)},
        ${result.council_analysis}
      )
      ON CONFLICT (evaluation_id)
      DO UPDATE SET
        final_ax_score = EXCLUDED.final_ax_score,
        final_anps = EXCLUDED.final_anps,
        model_scores = EXCLUDED.model_scores,
        council_analysis = EXCLUDED.council_analysis
      RETURNING id, evaluation_id, final_ax_score, final_anps, model_scores, council_analysis, created_at
    `;
    return dbResult[0] as AXCouncilResult;
  } catch (error) {
    console.error("Error saving AX council result:", error);
    throw error;
  }
}

/**
 * Seed initial AX model configurations
 */
export async function seedAXModelConfigs(): Promise<void> {
  try {
    const existingConfigs = await getAllAXModelConfigs();
    if (existingConfigs.length > 0) {
      console.log("AX model configs already exist, skipping seed");
      return;
    }

    // Model IDs sourced from https://openrouter.ai/models
    const initialConfigs = [
      {
        model_id: "gpt-4o",
        display_name: "GPT-4o",
        provider: "OpenAI",
        openrouter_model_id: "openai/gpt-4o",
        is_enabled: true,
        sort_order: 1
      },
      {
        model_id: "gemini-2.0-flash",
        display_name: "Gemini 2.0 Flash",
        provider: "Google",
        openrouter_model_id: "google/gemini-2.0-flash-001",
        is_enabled: true,
        sort_order: 2
      },
      {
        model_id: "claude-3.5-sonnet",
        display_name: "Claude 3.5 Sonnet",
        provider: "Anthropic",
        openrouter_model_id: "anthropic/claude-3.5-sonnet",
        is_enabled: true,
        sort_order: 3
      },
      {
        model_id: "perplexity-sonar-pro",
        display_name: "Perplexity Sonar Pro",
        provider: "Perplexity",
        openrouter_model_id: "perplexity/sonar-pro",
        is_enabled: true,
        sort_order: 4
      }
    ];

    for (const config of initialConfigs) {
      await createAXModelConfig(config);
    }

    console.log("AX model configs seeded successfully");
  } catch (error) {
    console.error("Error seeding AX model configs:", error);
    throw error;
  }
}
