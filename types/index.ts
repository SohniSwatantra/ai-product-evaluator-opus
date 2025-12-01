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

export interface AgentExperience {
  axScore: number;
  anps: number; // Agent Net Promoter Score (-100 to 100)
  factors: AXFactor[];
  agentAccessibility: string;
  recommendations: string[];
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
