"use client";

import { useState } from "react";
import { X, Check, Loader2, Sparkles, Zap, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CREDIT_PACKS = [
  {
    id: "starter",
    name: "Starter",
    credits: 5,
    price: "$5",
    pricePerCredit: "$1.00",
    description: "Perfect for trying out",
    icon: Sparkles,
    popular: false,
    features: [
      "5 model runs",
      "Full evaluation reports",
      "AX Council access",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    credits: 20,
    price: "$15",
    pricePerCredit: "$0.75",
    description: "Best for regular users",
    icon: Zap,
    popular: true,
    savings: "Save 25%",
    features: [
      "20 model runs",
      "Full evaluation reports",
      "AX Council access",
      "Priority support",
    ],
  },
  {
    id: "agency",
    name: "Agency",
    credits: 100,
    price: "$50",
    pricePerCredit: "$0.50",
    description: "For teams and agencies",
    icon: Building2,
    popular: false,
    savings: "Save 50%",
    features: [
      "100 model runs",
      "Full evaluation reports",
      "AX Council access",
      "Priority support",
      "Team sharing (coming soon)",
    ],
  },
];

export function PricingModal({ isOpen, onClose, onSuccess }: PricingModalProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePurchase = async (packId: string) => {
    try {
      setLoading(packId);
      setError(null);

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });

      const data = await response.json();

      if (data.success && data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        setError(data.error || "Failed to create checkout session");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h2 className="text-2xl font-bold text-black dark:text-white">
              Get More Credits
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              1 Credit = 1 Model Run | AX Council is free when all models are run
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Pricing Cards */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {CREDIT_PACKS.map((pack) => {
            const Icon = pack.icon;
            return (
              <div
                key={pack.id}
                className={cn(
                  "relative p-6 rounded-2xl border-2 transition-all",
                  pack.popular
                    ? "border-purple-500 dark:border-purple-400 bg-purple-50/50 dark:bg-purple-900/20"
                    : "border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 hover:border-purple-300 dark:hover:border-purple-600"
                )}
              >
                {/* Popular Badge */}
                {pack.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-600 text-white text-xs font-semibold rounded-full">
                    Most Popular
                  </div>
                )}

                {/* Savings Badge */}
                {pack.savings && (
                  <div className="absolute top-4 right-4 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
                    {pack.savings}
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    "p-2 rounded-lg",
                    pack.popular
                      ? "bg-purple-500/20 text-purple-600 dark:text-purple-400"
                      : "bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400"
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-black dark:text-white">
                      {pack.name}
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {pack.description}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-black dark:text-white">
                      {pack.price}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {pack.credits} credits ({pack.pricePerCredit}/credit)
                  </p>
                </div>

                <ul className="space-y-2 mb-6">
                  {pack.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePurchase(pack.id)}
                  disabled={loading !== null}
                  className={cn(
                    "w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2",
                    pack.popular
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : "bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 text-white dark:text-black"
                  )}
                >
                  {loading === pack.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>Buy {pack.name}</>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <p className="text-center text-xs text-neutral-500 dark:text-neutral-400">
            Secure payments powered by Stripe. Credits never expire.
          </p>
        </div>
      </div>
    </div>
  );
}
