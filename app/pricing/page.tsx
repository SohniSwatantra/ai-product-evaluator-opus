"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { BackgroundGlow } from "@/components/ui/background-components";
import { Check, Loader2, Sparkles, Zap, Building2, CheckCircle, XCircle, Coins, ArrowRight, Gift, Ticket } from "lucide-react";
import { useUser } from "@stackframe/stack";
import { cn } from "@/lib/utils";
import { useCreditBalance } from "@/components/credits/credit-balance";

const CREDIT_PACKS = [
  {
    id: "starter",
    name: "Starter",
    credits: 30,
    price: "$29",
    pricePerCredit: "$0.97",
    description: "Perfect for trying out",
    icon: Sparkles,
    popular: false,
    color: "blue",
    features: [
      "30 model evaluation runs",
      "Full AI-powered reports",
      "AX Council aggregation",
      "7-factor analysis",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    credits: 60,
    price: "$49",
    pricePerCredit: "$0.82",
    description: "Best value for regular users",
    icon: Zap,
    popular: true,
    color: "purple",
    savings: "Save 18%",
    features: [
      "60 model evaluation runs",
      "Full AI-powered reports",
      "AX Council aggregation",
      "7-factor analysis",
      "Priority processing",
    ],
  },
  {
    id: "agency",
    name: "Agency",
    credits: 200,
    price: "$129",
    pricePerCredit: "$0.65",
    description: "For teams and agencies",
    icon: Building2,
    popular: false,
    color: "amber",
    savings: "Save 33%",
    features: [
      "200 model evaluation runs",
      "Full AI-powered reports",
      "AX Council aggregation",
      "7-factor analysis",
      "Priority processing",
      "Team sharing (coming soon)",
    ],
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const user = useUser();
  const { balance, loading: balanceLoading, refetch: refetchBalance } = useCreditBalance();

  // Voucher state
  const [voucherCode, setVoucherCode] = useState("");
  const [redeemingVoucher, setRedeemingVoucher] = useState(false);
  const [voucherMessage, setVoucherMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const success = searchParams.get("success") === "true";
  const canceled = searchParams.get("canceled") === "true";

  // Refresh balance on success
  useEffect(() => {
    if (success) {
      refetchBalance();
    }
  }, [success, refetchBalance]);

  const handleRedeemVoucher = async () => {
    if (!voucherCode.trim()) {
      setVoucherMessage({ type: 'error', text: 'Please enter a voucher code' });
      return;
    }

    if (!user) {
      window.location.href = "/handler/sign-in?redirect=/pricing";
      return;
    }

    try {
      setRedeemingVoucher(true);
      setVoucherMessage(null);

      const response = await fetch("/api/vouchers/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: voucherCode.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setVoucherMessage({ type: 'success', text: data.message });
        setVoucherCode("");
        refetchBalance();
      } else {
        setVoucherMessage({ type: 'error', text: data.error || 'Failed to redeem voucher' });
      }
    } catch (err: any) {
      setVoucherMessage({ type: 'error', text: err.message || 'Failed to redeem voucher' });
    } finally {
      setRedeemingVoucher(false);
    }
  };

  const handlePurchase = async (packId: string) => {
    if (!user) {
      // Redirect to sign in
      window.location.href = "/handler/sign-in?redirect=/pricing";
      return;
    }

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
    <BackgroundGlow>
      <Navbar />
      <main className="container mx-auto px-6 pt-32 pb-20">
        <div className="max-w-5xl mx-auto">
          {/* Free Credits Banner */}
          <div className="mb-8 p-4 rounded-2xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center gap-3">
            <Gift className="w-6 h-6 text-green-400" />
            <p className="text-lg font-semibold text-green-300">
              10 Free Credits to Start
              <span className="text-green-400/80 font-normal ml-2">
                — Good enough for 2 full evaluations with multi-models!
              </span>
            </p>
          </div>

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 text-purple-300 text-sm mb-4">
              <Coins className="w-4 h-4" />
              <span>Credit Pricing</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
              1 Credit = 1 Model Run. Run up to 5 models per evaluation.
              <br />
              <span className="text-purple-400">AX Council is free when all models are run!</span>
            </p>
          </div>

          {/* Success/Cancel Messages */}
          {success && (
            <div className="mb-8 p-4 rounded-xl bg-green-500/20 border border-green-500/50 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-300">Payment successful!</p>
                <p className="text-sm text-green-400/80">Your credits have been added to your account.</p>
              </div>
            </div>
          )}

          {canceled && (
            <div className="mb-8 p-4 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center gap-3">
              <XCircle className="w-6 h-6 text-amber-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-300">Payment canceled</p>
                <p className="text-sm text-amber-400/80">Your payment was canceled. No charges were made.</p>
              </div>
            </div>
          )}

          {/* Current Balance (if logged in) */}
          {user && (
            <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-amber-500/20">
                    <Coins className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-400">Current Balance</p>
                    <p className="text-3xl font-bold text-white">
                      {balanceLoading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <>{balance ?? 0} Credits</>
                      )}
                    </p>
                  </div>
                </div>
                <a
                  href="/"
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-colors"
                >
                  Start Analyzing
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}

          {/* Voucher Code Redemption */}
          <div className="mb-8 p-6 rounded-2xl border border-cyan-500/30 bg-cyan-500/10">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-cyan-500/20">
                  <Ticket className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Have a Voucher Code?</h3>
                  <p className="text-sm text-neutral-400">Redeem your voucher to get free credits</p>
                </div>
              </div>
              <div className="flex-1 w-full md:w-auto">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && handleRedeemVoucher()}
                    placeholder="Enter voucher code (e.g., BETA-XXXXXXXX)"
                    className="flex-1 px-4 py-3 rounded-lg bg-neutral-900 border border-white/10 text-white placeholder-neutral-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <button
                    onClick={handleRedeemVoucher}
                    disabled={redeemingVoucher}
                    className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {redeemingVoucher ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Redeem"
                    )}
                  </button>
                </div>
                {voucherMessage && (
                  <p className={cn(
                    "text-sm mt-2",
                    voucherMessage.type === 'success' ? "text-green-400" : "text-red-400"
                  )}>
                    {voucherMessage.text}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-8 p-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-300">
              {error}
            </div>
          )}

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CREDIT_PACKS.map((pack) => {
              const Icon = pack.icon;
              return (
                <div
                  key={pack.id}
                  className={cn(
                    "relative p-6 rounded-2xl border-2 transition-all",
                    pack.popular
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-white/10 bg-black/50 hover:border-purple-500/50"
                  )}
                >
                  {/* Popular Badge */}
                  {pack.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold rounded-full">
                      Most Popular
                    </div>
                  )}

                  {/* Savings Badge */}
                  {pack.savings && (
                    <div className="absolute top-4 right-4 px-2 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">
                      {pack.savings}
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-6">
                    <div className={cn(
                      "p-3 rounded-xl",
                      pack.popular
                        ? "bg-purple-500/30 text-purple-300"
                        : "bg-white/10 text-neutral-300"
                    )}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-white">
                        {pack.name}
                      </h3>
                      <p className="text-sm text-neutral-400">
                        {pack.description}
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-bold text-white">
                        {pack.price}
                      </span>
                    </div>
                    <p className="text-neutral-400 mt-1">
                      {pack.credits} credits <span className="text-neutral-500">({pack.pricePerCredit}/credit)</span>
                    </p>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {pack.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-neutral-300">
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handlePurchase(pack.id)}
                    disabled={loading !== null}
                    className={cn(
                      "w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2",
                      pack.popular
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                        : "bg-white hover:bg-neutral-100 text-black"
                    )}
                  >
                    {loading === pack.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        {user ? `Buy ${pack.name}` : "Sign in to Purchase"}
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* How Credits Work */}
          <div className="mt-16 p-8 rounded-2xl border border-white/10 bg-black/50">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              How Credits Work
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  1
                </div>
                <h3 className="font-semibold text-white mb-2">Base Evaluation</h3>
                <p className="text-sm text-neutral-400">
                  Initial analysis with Claude Opus 4.5 is <span className="text-green-400 font-semibold">1 credit</span>
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  2
                </div>
                <h3 className="font-semibold text-white mb-2">Additional Models</h3>
                <p className="text-sm text-neutral-400">
                  Each additional model (GPT-5.1, Gemini, etc.) costs <span className="text-purple-400 font-semibold">1 credit</span>
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  3
                </div>
                <h3 className="font-semibold text-white mb-2">AX Council</h3>
                <p className="text-sm text-neutral-400">
                  Run all 5 models and get AX Council aggregation <span className="text-amber-400 font-semibold">FREE</span>
                </p>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-12 text-center">
            <p className="text-neutral-400">
              Credits never expire. Secure payments powered by Stripe.
            </p>
            <p className="text-neutral-500 text-sm mt-2">
              Questions? Contact us at support@ai-product-evaluator.com
            </p>
          </div>
        </div>
      </main>
    </BackgroundGlow>
  );
}
