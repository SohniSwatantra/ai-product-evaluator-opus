"use client";

import { useState, useEffect } from "react";
import { Search, Coins, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlowingShadow } from "@/components/ui/glowing-shadow";
import { DemographicsForm } from "@/components/demographics-form";
import { QuantumPulseLoader } from "@/components/ui/quantum-pulse-loader";
import { PricingModal } from "@/components/credits/pricing-modal";
import { type Demographics } from "@/types";
import { useUser } from "@stackframe/stack";

interface ProductUrlFormProps {
  onAnalyze: (url: string, demographics: Demographics) => void;
  isAnalyzing: boolean;
}

const CREDIT_COST = 1; // Base evaluation costs 1 credit

export function ProductUrlForm({ onAnalyze, isAnalyzing }: ProductUrlFormProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [demographics, setDemographics] = useState<Demographics>({
    ageRange: "",
    gender: "",
    incomeTier: "",
    region: "",
  });
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const user = useUser();

  // Fetch credit balance when user is logged in
  useEffect(() => {
    if (user) {
      fetchCreditBalance();
    }
  }, [user]);

  const fetchCreditBalance = async () => {
    try {
      const response = await fetch("/api/user/credits");
      const data = await response.json();
      if (data.success) {
        setCreditBalance(data.balance);
      }
    } catch (error) {
      console.error("Error fetching credit balance:", error);
    }
  };

  const hasInsufficientCredits = user && creditBalance !== null && creditBalance < CREDIT_COST;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Check if user has enough credits (only for signed-in users)
    if (hasInsufficientCredits) {
      setShowPricingModal(true);
      return;
    }

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
      const urlObj = new URL(normalizedUrl);

      // Check for suspicious/malformed URLs (e.g., https://https.com//example.com/)
      const suspiciousDomains = ['https.com', 'http.com', 'www.com'];
      if (suspiciousDomains.includes(urlObj.hostname.toLowerCase())) {
        setError("Invalid URL format. Please check your URL and try again.");
        return;
      }

      // Check for double slashes in path (excluding protocol)
      if (urlObj.pathname.includes('//')) {
        setError("Invalid URL format. Please remove any double slashes from the URL.");
        return;
      }

      // Check if hostname looks valid (has at least one dot and valid TLD)
      if (!urlObj.hostname.includes('.') || urlObj.hostname.startsWith('.') || urlObj.hostname.endsWith('.')) {
        setError("Please enter a valid domain (e.g., example.com)");
        return;
      }
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

            {/* Credit Cost Info */}
            {user && creditBalance !== null && (
              <div className={cn(
                "flex items-center justify-between p-3 rounded-xl border",
                hasInsufficientCredits
                  ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                  : "bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
              )}>
                <div className="flex items-center gap-2">
                  <Coins className={cn(
                    "w-4 h-4",
                    hasInsufficientCredits ? "text-red-500" : "text-amber-500"
                  )} />
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    Cost: <span className="font-semibold">{CREDIT_COST} credit</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    Balance: <span className={cn(
                      "font-semibold",
                      hasInsufficientCredits ? "text-red-500" : "text-green-600 dark:text-green-400"
                    )}>{creditBalance}</span>
                  </span>
                  {hasInsufficientCredits && (
                    <button
                      type="button"
                      onClick={() => setShowPricingModal(true)}
                      className="text-xs px-2 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Buy Credits
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Insufficient Credits Warning */}
            {hasInsufficientCredits && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  You need at least {CREDIT_COST} credit to run an analysis.{" "}
                  <button
                    type="button"
                    onClick={() => setShowPricingModal(true)}
                    className="font-semibold underline hover:no-underline"
                  >
                    Get more credits
                  </button>
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isAnalyzing || hasInsufficientCredits}
              className={cn(
                "w-full py-4 rounded-2xl font-semibold text-lg",
                "bg-[#459A9A] text-black",
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
            <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
              Analysis takes about ~ 2 mins
            </p>
          </form>
        </div>
      </GlowingShadow>

      {/* Pricing Modal */}
      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        onSuccess={() => {
          setShowPricingModal(false);
          fetchCreditBalance();
        }}
      />
    </section>
  );
}
