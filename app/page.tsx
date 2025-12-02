"use client";

import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/navbar";
import { ProductUrlForm } from "@/components/product-url-form";
import { EvaluationDashboard } from "@/components/evaluation-dashboard";
import { EvaluationHistory } from "@/components/evaluation-history";
import { HeroSection } from "@/components/hero-section";
import { BackgroundGlow } from "@/components/ui/background-components";
import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { type ProductEvaluation } from "@/types";
import { Brain, Target, TrendingUp, Sparkles, BarChart3, Shield, TrendingDown, Minus } from "lucide-react";
import { useUser } from "@stackframe/stack";

const PENDING_EVALUATION_KEY = "pendingEvaluationJobId";

export default function Home() {
  const [evaluation, setEvaluation] = useState<ProductEvaluation | null>(null);
  const [isShowcaseView, setIsShowcaseView] = useState(false); // Track if viewing a showcase evaluation
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const user = useUser();
  const hasClaimedRef = useRef(false); // Prevent duplicate claim attempts

  // Check for pending evaluation to claim after sign-in
  useEffect(() => {
    const claimPendingEvaluation = async () => {
      // Only run if user is signed in and we haven't already claimed
      if (!user || hasClaimedRef.current) return;

      const pendingJobId = localStorage.getItem(PENDING_EVALUATION_KEY);
      if (!pendingJobId) return;

      hasClaimedRef.current = true; // Mark as attempted

      try {
        const response = await fetch("/api/evaluations/claim", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ jobId: pendingJobId }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.evaluation) {
            setEvaluation(data.evaluation);
            setIsShowcaseView(false); // This was their evaluation, not showcase
            console.log("Successfully claimed pending evaluation");
          }
        } else {
          console.log("Failed to claim evaluation - may already be claimed or not found");
        }
      } catch (error) {
        console.error("Error claiming pending evaluation:", error);
      } finally {
        // Clear localStorage regardless of success/failure
        localStorage.removeItem(PENDING_EVALUATION_KEY);
      }
    };

    claimPendingEvaluation();
  }, [user]);

  // Poll for job status
  useEffect(() => {
    if (!jobId || !isAnalyzing) {
      return;
    }

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/evaluate/status/${jobId}`);
        const data = await response.json();

        if (data.status === "completed" && data.result) {
          // Job completed successfully
          setEvaluation(data.result);
          setIsShowcaseView(false); // New analysis, not showcase
          setIsAnalyzing(false);
          setJobId(null);

          if (pollingInterval.current) {
            clearInterval(pollingInterval.current);
          }
        } else if (data.status === "failed") {
          // Job failed
          console.error("Evaluation failed:", data.error);
          setIsAnalyzing(false);
          setJobId(null);

          if (pollingInterval.current) {
            clearInterval(pollingInterval.current);
          }
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    };

    // Start polling every 3 seconds
    pollingInterval.current = setInterval(pollStatus, 3000);

    // Initial poll
    pollStatus();

    // Cleanup on unmount
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [jobId, isAnalyzing]);

  const handleAnalyze = async (url: string, demographics: import("@/types").Demographics) => {
    setIsAnalyzing(true);

    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productUrl: url, demographics }),
      });

      if (!response.ok) {
        throw new Error("Failed to start evaluation");
      }

      const data = await response.json();

      if (data.jobId) {
        // Async mode - start polling
        setJobId(data.jobId);

        // Store jobId in localStorage for non-signed-in users
        // This allows claiming the evaluation after sign-in
        if (!user) {
          localStorage.setItem(PENDING_EVALUATION_KEY, data.jobId);
        }
      } else {
        // Sync mode fallback (shouldn't happen in production)
        setEvaluation(data);
        setIsAnalyzing(false);
      }
    } catch (error) {
      console.error("Analysis failed:", error);
      setIsAnalyzing(false);
    }
  };

  const features = [
    {
      Icon: Brain,
      name: "AI-Powered Analysis",
      description: "Advanced algorithms evaluate products based on cutting-edge research from top universities",
      href: "#",
      cta: "Learn more",
      background: <div className="absolute inset-0 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-900 dark:to-neutral-800" />,
      className: "lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-2",
    },
    {
      Icon: Target,
      name: "Buying Intent Prediction",
      description: "Predict human purchase probability with precision using 6 research-backed evaluation factors",
      href: "#",
      cta: "Learn more",
      background: <div className="absolute inset-0 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-900 dark:to-neutral-800" />,
      className: "lg:row-start-1 lg:row-end-4 lg:col-start-2 lg:col-end-3",
    },
    {
      Icon: BarChart3,
      name: "Multi-Factor Scoring",
      description: "Position, price, ratings, reviews, sponsored tags, and platform endorsements analyzed",
      href: "#",
      cta: "Learn more",
      background: <div className="absolute inset-0 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-900 dark:to-neutral-800" />,
      className: "lg:col-start-1 lg:col-end-2 lg:row-start-2 lg:row-end-4",
    },
    {
      Icon: Sparkles,
      name: "Actionable Insights",
      description: "Get personalized recommendations to improve product appeal and conversion rates",
      href: "#",
      cta: "Learn more",
      background: <div className="absolute inset-0 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-900 dark:to-neutral-800" />,
      className: "lg:col-start-3 lg:col-end-4 lg:row-start-1 lg:row-end-2",
    },
    {
      Icon: Shield,
      name: "Research-Backed",
      description: "Based on peer-reviewed research from leading AI and e-commerce behavior studies",
      href: "#",
      cta: "Learn more",
      background: <div className="absolute inset-0 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-900 dark:to-neutral-800" />,
      className: "lg:col-start-3 lg:col-end-4 lg:row-start-2 lg:row-end-4",
    },
  ];

  return (
    <BackgroundGlow>
      <Navbar />

      {!evaluation ? (
        <>
          <main className="container mx-auto px-6 pt-32 pb-12">
            <HeroSection />

            <ProductUrlForm
              onAnalyze={handleAnalyze}
              isAnalyzing={isAnalyzing}
            />

            {/* Evaluation History */}
            <section className="mt-16 mb-10">
              <EvaluationHistory
                onSelectEvaluation={(evaluation) => {
                  setEvaluation(evaluation);
                  setIsShowcaseView(true); // Viewing from history = showcase
                }}
                limit={10}
              />
            </section>

            {/* Features Bento Grid */}
            <section className="mt-16 mb-10" id="features">
              <div className="text-center mb-6">
                <h2 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-2">
                  Powerful Features
                </h2>
                <p className="text-xl text-neutral-600 dark:text-neutral-400">
                  Everything you need to evaluate product buying potential
                </p>
              </div>
              <BentoGrid className="lg:grid-rows-3">
                {features.map((feature) => (
                  <BentoCard key={feature.name} {...feature} />
                ))}
              </BentoGrid>
            </section>

            {/* Scroll Animation Section */}
            <section className="-mt-16 md:-mt-32 mb-16 md:mb-32">
              <ContainerScroll
                titleComponent={
                  <>
                    <h2 className="text-2xl md:text-4xl font-semibold text-black dark:text-white">
                      See It In Action
                      <br />
                      <span className="text-2xl md:text-4xl lg:text-6xl font-bold mt-1 leading-none">
                        Real-Time Product Analysis
                      </span>
                    </h2>
                  </>
                }
              >
                <div className="w-full h-full bg-[#111111] rounded-xl md:rounded-2xl p-3 md:p-8 border border-white/10 overflow-y-auto">
                  <div className="space-y-4 md:space-y-8">
                    {/* Example Product Header */}
                    <div className="text-center">
                      <h3 className="text-lg md:text-2xl font-bold text-white mb-1 md:mb-2">
                        Sample Analysis Result
                      </h3>
                      <p className="text-xs md:text-sm text-neutral-400 font-mono mb-2 md:mb-4">
                        example.com/premium-wireless-headphones
                      </p>
                      <div className="flex items-center justify-center flex-wrap gap-2 md:gap-3 text-xs font-bold uppercase tracking-wider">
                        <span className="px-2 md:px-4 py-1 md:py-1.5 rounded-full bg-[#1E293B] text-[#60A5FA] border border-[#334155] text-[10px] md:text-xs">
                          Target: Female, 25-34, Medium Income
                        </span>
                        <span className="px-2 md:px-4 py-1 md:py-1.5 rounded-full bg-[#14532D] text-[#4ADE80] border border-[#166534] flex items-center gap-1 md:gap-2 text-[10px] md:text-xs">
                          <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[#4ADE80] animate-pulse"></span>
                          HIGH INTENT
                        </span>
                      </div>
                    </div>

                    {/* Score Cards */}
                    <div className="grid grid-cols-3 gap-2 md:gap-4">
                      {/* Overall Score */}
                      <div className="p-2 md:p-5 rounded-lg md:rounded-xl bg-black border border-white/10">
                        <h4 className="text-[10px] md:text-xs font-medium text-neutral-400 mb-1 md:mb-2">Overall Score</h4>
                        <div className="text-xl md:text-4xl font-bold text-[#4ADE80] mb-1 md:mb-3">
                          78<span className="text-xs md:text-lg text-neutral-500 font-normal">/100</span>
                        </div>
                        <div className="w-full h-1 md:h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                          <div className="h-full bg-[#4ADE80]" style={{ width: '78%' }} />
                        </div>
                      </div>

                      {/* Human Buying Intent */}
                      <div className="p-2 md:p-5 rounded-lg md:rounded-xl bg-[#1F1028] border border-[#581C87]">
                        <h4 className="text-[10px] md:text-xs font-medium text-[#E9D5FF] mb-1 md:mb-2">Human Buying Intent</h4>
                        <div className="text-xl md:text-4xl font-bold text-[#C084FC] mb-1 md:mb-3">
                          72<span className="text-xs md:text-lg text-[#7E22CE] font-normal">%</span>
                        </div>
                        <div className="w-full h-1 md:h-1.5 bg-[#3B0764] rounded-full overflow-hidden">
                          <div className="h-full bg-[#C084FC]" style={{ width: '72%' }} />
                        </div>
                      </div>

                      {/* Agent Experience */}
                      <div className="p-2 md:p-5 rounded-lg md:rounded-xl bg-[#0F172A] border border-[#1E40AF]">
                        <h4 className="text-[10px] md:text-xs font-medium text-[#BFDBFE] mb-1 md:mb-2">Agent Experience</h4>
                        <div className="text-xl md:text-4xl font-bold text-[#FACC15] mb-1 md:mb-3">
                          65<span className="text-xs md:text-lg text-[#1D4ED8] font-normal">%</span>
                        </div>
                        <div className="w-full h-1 md:h-1.5 bg-[#172554] rounded-full overflow-hidden">
                          <div className="h-full bg-[#FACC15]" style={{ width: '65%' }} />
                        </div>
                      </div>
                    </div>

                    {/* SSR Distribution - Hidden on mobile for space */}
                    <div className="hidden md:block p-6 rounded-xl bg-[#1A1A1A] border border-white/5">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-semibold text-white">SSR Distribution</h4>
                        <span className="text-xs text-neutral-500">Confidence: 92%</span>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-3 rounded-lg bg-[#0F0F0F] text-center border border-white/5">
                          <div className="text-xl font-bold text-[#4ADE80] mb-0.5">45%</div>
                          <div className="text-[10px] text-neutral-500 uppercase tracking-wide">High SSR</div>
                        </div>
                        <div className="p-3 rounded-lg bg-[#0F0F0F] text-center border border-white/5">
                          <div className="text-xl font-bold text-[#FACC15] mb-0.5">35%</div>
                          <div className="text-[10px] text-neutral-500 uppercase tracking-wide">Medium SSR</div>
                        </div>
                        <div className="p-3 rounded-lg bg-[#0F0F0F] text-center border border-white/5">
                          <div className="text-xl font-bold text-[#F87171] mb-0.5">20%</div>
                          <div className="text-[10px] text-neutral-500 uppercase tracking-wide">Low SSR</div>
                        </div>
                      </div>
                    </div>

                    {/* Evaluation Factors Header - Hidden on mobile for space */}
                    <div className="hidden md:block">
                      <h4 className="text-lg font-semibold text-white mb-4">Evaluation Factors</h4>
                      <div className="w-full h-12 bg-[#1A1A1A] rounded-lg border border-white/5 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </ContainerScroll>
            </section>
          </main>
        </>
      ) : (
        <main className="container mx-auto px-6 pt-32 pb-12">
          <EvaluationDashboard
            evaluation={evaluation}
            onNewAnalysis={() => {
              setEvaluation(null);
              setIsShowcaseView(false);
            }}
            isShowcase={isShowcaseView}
          />
        </main>
      )}
    </BackgroundGlow>
  );
}
