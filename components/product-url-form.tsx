"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlowingShadow } from "@/components/ui/glowing-shadow";
import { DemographicsForm } from "@/components/demographics-form";
import { QuantumPulseLoader } from "@/components/ui/quantum-pulse-loader";
import { type Demographics } from "@/types";

interface ProductUrlFormProps {
  onAnalyze: (url: string, demographics: Demographics) => void;
  isAnalyzing: boolean;
}

export function ProductUrlForm({ onAnalyze, isAnalyzing }: ProductUrlFormProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [demographics, setDemographics] = useState<Demographics>({
    ageRange: "",
    gender: "",
    incomeTier: "",
    region: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!url.trim()) {
      setError("Please enter a product URL");
      return;
    }

    // Normalize and validate URL
    let normalizedUrl = url.trim();
    try {
      // Auto-add https:// if no protocol specified
      if (!normalizedUrl.match(/^https?:\/\//i)) {
        normalizedUrl = 'https://' + normalizedUrl;
      }

      // Validate it's a proper URL
      new URL(normalizedUrl);
    } catch {
      setError("Please enter a valid URL (e.g., example.com or https://example.com)");
      return;
    }

    // Validate demographics
    if (!demographics.ageRange) {
      setError("Please select an age range for your target audience");
      return;
    }
    if (!demographics.gender) {
      setError("Please select a gender for your target audience");
      return;
    }
    if (!demographics.incomeTier) {
      setError("Please select an income level for your target audience");
      return;
    }
    if (!demographics.region) {
      setError("Please select a region for your target audience");
      return;
    }

    // Pass normalized URL with protocol to the API
    onAnalyze(normalizedUrl, demographics);
  };

  return (
    <section className="max-w-3xl mx-auto mt-8">
      <GlowingShadow
        glowColor="rgba(0, 0, 0, 0.2)"
        shadowIntensity="medium"
      >
        <div className="p-6 rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Product URL <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="e.g., amazon.com/product or https://example.com"
                  className={cn(
                    "w-full pl-12 pr-4 py-4 rounded-xl",
                    "border-2 border-black/10 dark:border-white/10",
                    "bg-white dark:bg-neutral-900",
                    "text-black dark:text-white placeholder:text-neutral-400",
                    "focus:border-black dark:focus:border-white focus:outline-none",
                    "transition-all",
                    error && "border-red-500 dark:border-red-500"
                  )}
                  disabled={isAnalyzing}
                />
              </div>
            </div>

            <DemographicsForm
              demographics={demographics}
              onChange={setDemographics}
              disabled={isAnalyzing}
            />

            {error && (
              <p className="text-red-500 text-sm mt-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={isAnalyzing}
              className={cn(
                "w-full py-4 rounded-xl font-semibold",
                "bg-black text-white dark:bg-white dark:text-black",
                "hover:opacity-90 transition-opacity",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "flex items-center justify-center gap-2"
              )}
            >
              {isAnalyzing ? (
                <QuantumPulseLoader />
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Analyze
                </>
              )}
            </button>
          </form>
        </div>
      </GlowingShadow>
    </section>
  );
}
