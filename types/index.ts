export interface EvaluationFactor {
  name: string;
  score: number;
  weight: number;
  description: string;
  impact: "positive" | "negative" | "neutral";
}

export interface Demographics {
  ageRange: "18-24" | "25-34" | "35-44" | "45-54" | "55+";
  gender: "male" | "female" | "non-binary" | "all";
  incomeTier: "low" | "medium" | "high";
  region: "north-america" | "europe" | "asia" | "latin-america" | "africa" | "oceania";
  ethnicity?: string;
}

export interface ProductAttributes {
  category: string;
  priceTier: "low" | "medium" | "high" | "premium";
  conceptSource: string;
}

export type PurchaseIntentAnchor = "low" | "middle" | "high";

export interface SSRDistribution {
  rating1: number;
  rating2: number;
  rating3: number;
  rating4: number;
  rating5: number;
}

export interface MethodologyComparison {
  agreement: "high" | "medium" | "low";
  factorScore: number;
  ssrScore: number;
  confidenceLevel: number;
  explanation: string;
}

export interface AXFactor {
  name: string;
  score: number;
  status: "excellent" | "good" | "needs-improvement";
  description: string;
}

export interface ContentNegotiation {
  supportsMarkdown: boolean;
  supportsAgentFriendlyFormat: boolean;
  hasLlmsTxt: boolean;
  acceptHeaderBehavior: string;
  score: number;
  details: string;
}

export interface AgentExperience {
  axScore: number;
  anps: number; // Agent Net Promoter Score (-100 to 100)
  factors: AXFactor[];
  agentAccessibility: string;
  recommendations: string[];
  contentNegotiation?: ContentNegotiation; // New: Content negotiation support for agents
}

export interface SectionScreenshots {
  hero?: string;
  pricing?: string;
  socialProof?: string;
  trustSignals?: string;
  marketing?: string;
  features?: string;
}

export interface SectionRecommendation {
  section: string; // "Pricing", "Social Proof", "Trust Signals", etc.
  screenshotPath?: string;
  isFallbackScreenshot?: boolean; // True if using hero/fallback screenshot instead of section-specific
  score: number; // Section-specific score (0-100)
  issues: string[]; // What's wrong
  recommendations: string[]; // How to fix it
  impact: "high" | "medium" | "low"; // Priority
}

export interface WebsiteSnapshot {
  screenshotPath: string;
  heroScreenshotPath?: string; // Optional for backward compatibility with old evaluations
  heroScreenshotBase64?: string; // Optional base64 fallback for reliable rendering
  sectionScreenshots?: SectionScreenshots; // Section-specific screenshots
  productName: string;
  price: string;
  rating: string;
  reviewCount: string;
  description: string;
  keyFeatures: string[];
}

export interface ProductEvaluation {
  id?: number;
  url: string;
  overallScore: number;
  buyingIntentProbability: number;
  purchaseIntentAnchor: PurchaseIntentAnchor;
  targetDemographics: Demographics;
  productAttributes: ProductAttributes;
  factors: EvaluationFactor[];
  analysis: string;
  demographicImpact: string;
  recommendations: string[];
  sectionedRecommendations?: SectionRecommendation[]; // Section-by-section breakdown
  timestamp: string;
  userId?: string; // Owner of the evaluation
  // SSR Methodology (Paper 2) fields
  ssrScore?: number;
  ssrConfidence?: number;
  ssrMarginConfidence?: number;
  ssrDistribution?: SSRDistribution;
  textualAnalysis?: string;
  methodologyComparison?: MethodologyComparison;
  // Agent Experience (AX) fields
  agentExperience?: AgentExperience;
  // Website scraping fields
  websiteSnapshot?: WebsiteSnapshot;
}

export interface AnalysisRequest {
  productUrl: string;
  demographics: Demographics;
}

// AX Multi-Model Evaluation Types
export interface AXModelConfig {
  id?: number;
  model_id: string;
  display_name: string;
  provider: string;
  openrouter_model_id: string;
  is_enabled: boolean;
  sort_order: number;
  created_at?: string;
}

export interface AXModelEvaluation {
  id?: number;
  evaluation_id: number;
  model_id: string;
  ax_score: number | null;
  anps: number | null;
  ax_factors: AXFactor[] | null;
  agent_accessibility: string | null;
  ax_recommendations: string[] | null;
  raw_response: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string | null;
  created_at?: string;
  completed_at?: string | null;
}

export interface AXCouncilResult {
  id?: number;
  evaluation_id: number;
  final_ax_score: number;
  final_anps: number;
  model_scores: {
    model_id: string;
    display_name: string;
    ax_score: number;
    anps: number;
  }[];
  council_analysis: string;
  created_at?: string;
}
