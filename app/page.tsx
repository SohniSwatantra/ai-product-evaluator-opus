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
import Image from "next/image";

export default function Home() {
  const [evaluation, setEvaluation] = useState<ProductEvaluation | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

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
          setIsAnalyzing(false);
          setJobId(null);

          if (pollingInterval.current) {
            clearInterval(pollingInterval.current);
          }
        } else if (data.status === "failed") {
          // Job failed
          console.error("Evaluation failed:", data.error);
          setStatusMessage(`Error: ${data.error || "Unknown error occurred"}`);
          setIsAnalyzing(false);
          setJobId(null);

          if (pollingInterval.current) {
            clearInterval(pollingInterval.current);
          }
        } else {
          // Still processing
          setStatusMessage(getStatusMessage(data.status));
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

  const getStatusMessage = (status: string): string => {
    switch (status) {
      case "pending":
        return "Queuing evaluation...";
      case "processing":
        return "Analyzing product with AI (this may take 30-60 seconds)...";
      default:
        return "Processing...";
    }
  };

  const handleAnalyze = async (url: string, demographics: import("@/types").Demographics) => {
    setIsAnalyzing(true);
    setStatusMessage("Starting evaluation...");

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
        setStatusMessage(data.message || "Evaluation started...");
      } else {
        // Sync mode fallback (shouldn't happen in production)
        setEvaluation(data);
        setIsAnalyzing(false);
      }
    } catch (error) {
      console.error("Analysis failed:", error);
      setStatusMessage("Failed to start evaluation. Please try again.");
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
                onSelectEvaluation={(evaluation) => setEvaluation(evaluation)}
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
            <section className="-mt-32 mb-32">
              <ContainerScroll
                titleComponent={
                  <>
                    <h2 className="text-4xl font-semibold text-black dark:text-white">
                      See It In Action
                      <br />
                      <span className="text-4xl md:text-6xl font-bold mt-1 leading-none">
                        Real-Time Product Analysis
                      </span>
                    </h2>
                  </>
                }
              >
                <div className="w-full h-full bg-white dark:bg-neutral-900 rounded-2xl p-8">
                  <div className="space-y-6">
                    {/* Example Product Header */}
                    <div className="text-center pb-4 border-b border-black/10 dark:border-white/10">
                      <h3 className="text-2xl font-bold text-black dark:text-white mb-2">
                        Sample Analysis Result
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 font-mono mb-3">
                        example.com/premium-wireless-headphones
                      </p>
                      <div className="flex items-center justify-center gap-4 text-xs">
                        <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold">
                          Target: Female, 25-34, Medium Income
                        </span>
                        <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 font-semibold">
                          🟢 HIGH INTENT
                        </span>
                      </div>
                    </div>

                    {/* Score Cards */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-6 rounded-xl border-2 border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80">
                        <h4 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-2">Overall Score</h4>
                        <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                          78<span className="text-xl">/100</span>
                        </div>
                        <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div className="h-full bg-green-600 dark:bg-green-400" style={{ width: '78%' }} />
                        </div>
                      </div>

                      <div className="p-6 rounded-xl border-2 border-black/20 dark:border-white/20 bg-black/5 dark:bg-white/5">
                        <h4 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-2">Buying Intent</h4>
                        <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                          72<span className="text-xl">%</span>
                        </div>
                        <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div className="h-full bg-green-600 dark:bg-green-400" style={{ width: '72%' }} />
                        </div>
                      </div>
                    </div>

                    {/* Sample Factors */}
                    <div className="space-y-3">
                      <h4 className="text-lg font-semibold text-black dark:text-white">Evaluation Factors</h4>

                      <div className="p-4 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="text-sm font-semibold text-black dark:text-white">Social Proof</span>
                          </div>
                          <div className="px-2 py-1 rounded-full text-xs font-semibold text-green-600 dark:text-green-400 bg-green-500/10">
                            85/100
                          </div>
                        </div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">Strong ratings resonate well with 25-34 age group</p>
                      </div>

                      <div className="p-4 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Minus className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                            <span className="text-sm font-semibold text-black dark:text-white">Pricing</span>
                          </div>
                          <div className="px-2 py-1 rounded-full text-xs font-semibold text-yellow-600 dark:text-yellow-400 bg-yellow-500/10">
                            68/100
                          </div>
                        </div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">Competitive pricing with room for optimization</p>
                      </div>

                      <div className="p-4 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                            <span className="text-sm font-semibold text-black dark:text-white">Marketing Elements</span>
                          </div>
                          <div className="px-2 py-1 rounded-full text-xs font-semibold text-red-600 dark:text-red-400 bg-red-500/10">
                            45/100
                          </div>
                        </div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">Reduce aggressive marketing tactics</p>
                      </div>
                    </div>

                    {/* Sample Recommendation */}
                    <div className="p-4 rounded-xl border-2 border-black/20 dark:border-white/20 bg-black/5 dark:bg-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-black dark:text-white" />
                        <h4 className="text-sm font-semibold text-black dark:text-white">Demographic-Tailored Recommendation</h4>
                      </div>
                      <p className="text-xs text-neutral-700 dark:text-neutral-300">
                        Highlight peer reviews from similar demographics (females 25-34) to increase trust and conversion
                      </p>
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
            onNewAnalysis={() => setEvaluation(null)}
          />
        </main>
      )}
    </BackgroundGlow>
  );
}
