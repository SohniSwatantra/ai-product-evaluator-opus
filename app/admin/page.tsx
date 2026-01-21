"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { BackgroundGlow } from "@/components/ui/background-components";
import { Plus, Trash2, Save, Loader2, ArrowLeft, Power, GripVertical, Star, Coins, Ticket, Copy, Check, ToggleLeft, ToggleRight, Users, DollarSign, Percent } from "lucide-react";
import type { AXModelConfig } from "@/types";
import type { VoucherCode, ReferralCode, DiscountCode } from "@/lib/db";
import { cn } from "@/lib/utils";

export default function AdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [models, setModels] = useState<AXModelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newModel, setNewModel] = useState({
    model_id: "",
    display_name: "",
    provider: "",
    openrouter_model_id: "",
    is_enabled: true,
    sort_order: 0
  });

  // Credits state
  const [creditsInput, setCreditsInput] = useState<string>("300");
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);
  const [settingCredits, setSettingCredits] = useState(false);
  const [creditsMessage, setCreditsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Voucher state
  const [vouchers, setVouchers] = useState<VoucherCode[]>([]);
  const [voucherStats, setVoucherStats] = useState<{
    totalVouchers: number;
    activeVouchers: number;
    totalRedemptions: number;
    totalCreditsRedeemed: number;
  } | null>(null);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [showVoucherForm, setShowVoucherForm] = useState(false);
  const [newVoucher, setNewVoucher] = useState({
    credits_amount: 100,
    max_uses: "",
    expires_at: "",
    custom_code: ""
  });
  const [creatingVoucher, setCreatingVoucher] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Referral state
  const [referrals, setReferrals] = useState<ReferralCode[]>([]);
  const [referralStats, setReferralStats] = useState<{
    totalCodes: number;
    activeCodes: number;
    totalUses: number;
    totalSales: number;
    totalCommission: number;
  } | null>(null);
  const [loadingReferrals, setLoadingReferrals] = useState(false);
  const [showReferralForm, setShowReferralForm] = useState(false);
  const [newReferral, setNewReferral] = useState({
    owner_name: "",
    owner_email: "",
    discount_percent: 10,
    commission_percent: 20,
    max_uses: "",
    expires_at: "",
    custom_code: ""
  });
  const [creatingReferral, setCreatingReferral] = useState(false);
  const [referralError, setReferralError] = useState<string | null>(null);

  // Discount state
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [discountStats, setDiscountStats] = useState<{
    totalCodes: number;
    activeCodes: number;
    totalUses: number;
    totalDiscountGiven: number;
  } | null>(null);
  const [loadingDiscounts, setLoadingDiscounts] = useState(false);
  const [showDiscountForm, setShowDiscountForm] = useState(false);
  const [newDiscount, setNewDiscount] = useState({
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: 10,
    description: "",
    min_purchase_amount: "",
    max_uses: "",
    expires_at: "",
    custom_code: ""
  });
  const [creatingDiscount, setCreatingDiscount] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);

  useEffect(() => {
    checkAdminStatus();
    fetchCurrentBalance();
    fetchVouchers();
    fetchReferrals();
    fetchDiscounts();
  }, []);

  const fetchCurrentBalance = async () => {
    try {
      const response = await fetch("/api/user/credits");
      const data = await response.json();
      if (data.balance !== undefined) {
        setCurrentBalance(data.balance);
      }
    } catch (err) {
      console.error("Failed to fetch balance:", err);
    }
  };

  const handleSetCredits = async () => {
    const credits = parseInt(creditsInput, 10);
    if (isNaN(credits) || credits < 0) {
      setCreditsMessage({ type: 'error', text: 'Please enter a valid number' });
      return;
    }

    try {
      setSettingCredits(true);
      setCreditsMessage(null);
      const response = await fetch("/api/admin/set-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credits })
      });

      const data = await response.json();
      if (data.success) {
        setCurrentBalance(credits);
        setCreditsMessage({ type: 'success', text: `Credits set to ${credits}` });
      } else {
        setCreditsMessage({ type: 'error', text: data.error || 'Failed to set credits' });
      }
    } catch (err: any) {
      setCreditsMessage({ type: 'error', text: err.message || 'Failed to set credits' });
    } finally {
      setSettingCredits(false);
    }
  };

  const checkAdminStatus = async () => {
    try {
      const response = await fetch("/api/admin/check");
      const data = await response.json();

      if (!data.isAdmin) {
        router.push("/");
        return;
      }

      setIsAdmin(true);
      fetchModels();
    } catch (err) {
      router.push("/");
    }
  };

  const fetchModels = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/ax-models");
      const data = await response.json();

      if (data.success) {
        setModels(data.models);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnabled = async (model: AXModelConfig) => {
    if (!model.id) return;

    try {
      setSaving(model.id);
      const response = await fetch("/api/admin/ax-models", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: model.id,
          is_enabled: !model.is_enabled
        })
      });

      const data = await response.json();
      if (data.success) {
        setModels(models.map(m =>
          m.id === model.id ? { ...m, is_enabled: !m.is_enabled } : m
        ));
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(null);
    }
  };

  const handleUpdateModel = async (model: AXModelConfig, updates: Partial<AXModelConfig>) => {
    if (!model.id) return;

    try {
      setSaving(model.id);
      const response = await fetch("/api/admin/ax-models", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: model.id, ...updates })
      });

      const data = await response.json();
      if (data.success) {
        setModels(models.map(m =>
          m.id === model.id ? { ...m, ...updates } : m
        ));
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(null);
    }
  };

  const handleDeleteModel = async (model: AXModelConfig) => {
    if (!model.id) return;
    if (!confirm(`Are you sure you want to delete ${model.display_name}?`)) return;

    try {
      setSaving(model.id);
      const response = await fetch(`/api/admin/ax-models?id=${model.id}`, {
        method: "DELETE"
      });

      const data = await response.json();
      if (data.success) {
        setModels(models.filter(m => m.id !== model.id));
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(null);
    }
  };

  const handleAddModel = async () => {
    if (!newModel.model_id || !newModel.display_name || !newModel.provider || !newModel.openrouter_model_id) {
      setError("All fields are required");
      return;
    }

    try {
      setSaving(-1);
      const response = await fetch("/api/admin/ax-models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newModel,
          sort_order: models.length + 1
        })
      });

      const data = await response.json();
      if (data.success) {
        setModels([...models, data.model]);
        setShowAddForm(false);
        setNewModel({
          model_id: "",
          display_name: "",
          provider: "",
          openrouter_model_id: "",
          is_enabled: true,
          sort_order: 0
        });
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(null);
    }
  };

  // Voucher functions
  const fetchVouchers = async () => {
    try {
      setLoadingVouchers(true);
      const response = await fetch("/api/admin/vouchers");
      const data = await response.json();
      if (data.vouchers) {
        setVouchers(data.vouchers);
        setVoucherStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to fetch vouchers:", err);
    } finally {
      setLoadingVouchers(false);
    }
  };

  const handleCreateVoucher = async () => {
    try {
      setCreatingVoucher(true);
      setVoucherError(null);

      const response = await fetch("/api/admin/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credits_amount: newVoucher.credits_amount,
          max_uses: newVoucher.max_uses ? parseInt(newVoucher.max_uses) : null,
          expires_at: newVoucher.expires_at || null,
          custom_code: newVoucher.custom_code || null
        })
      });

      const data = await response.json();
      if (data.voucher) {
        setVouchers([data.voucher, ...vouchers]);
        setShowVoucherForm(false);
        setNewVoucher({ credits_amount: 100, max_uses: "", expires_at: "", custom_code: "" });
        fetchVouchers(); // Refresh stats
      } else {
        setVoucherError(data.error || "Failed to create voucher");
      }
    } catch (err: any) {
      setVoucherError(err.message || "Failed to create voucher");
    } finally {
      setCreatingVoucher(false);
    }
  };

  const handleDeleteVoucher = async (id: number) => {
    if (!confirm("Are you sure you want to delete this voucher?")) return;

    try {
      const response = await fetch(`/api/admin/vouchers?id=${id}`, {
        method: "DELETE"
      });

      const data = await response.json();
      if (data.success) {
        setVouchers(vouchers.filter(v => v.id !== id));
        fetchVouchers(); // Refresh stats
      }
    } catch (err) {
      console.error("Failed to delete voucher:", err);
    }
  };

  const handleToggleVoucher = async (id: number, currentActive: boolean) => {
    try {
      const response = await fetch("/api/admin/vouchers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: !currentActive })
      });

      const data = await response.json();
      if (data.voucher) {
        setVouchers(vouchers.map(v => v.id === id ? data.voucher : v));
      }
    } catch (err) {
      console.error("Failed to toggle voucher:", err);
    }
  };

  const copyToClipboard = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Referral functions
  const fetchReferrals = async () => {
    try {
      setLoadingReferrals(true);
      const response = await fetch("/api/admin/referrals");
      const data = await response.json();
      if (data.referrals) {
        setReferrals(data.referrals);
        setReferralStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to fetch referrals:", err);
    } finally {
      setLoadingReferrals(false);
    }
  };

  const handleCreateReferral = async () => {
    if (!newReferral.owner_name.trim()) {
      setReferralError("Owner name is required");
      return;
    }

    try {
      setCreatingReferral(true);
      setReferralError(null);

      const response = await fetch("/api/admin/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_name: newReferral.owner_name,
          owner_email: newReferral.owner_email || null,
          discount_percent: newReferral.discount_percent,
          commission_percent: newReferral.commission_percent,
          max_uses: newReferral.max_uses ? parseInt(newReferral.max_uses) : null,
          expires_at: newReferral.expires_at || null,
          custom_code: newReferral.custom_code || null
        })
      });

      const data = await response.json();
      if (data.referral) {
        setReferrals([data.referral, ...referrals]);
        setShowReferralForm(false);
        setNewReferral({
          owner_name: "",
          owner_email: "",
          discount_percent: 10,
          commission_percent: 20,
          max_uses: "",
          expires_at: "",
          custom_code: ""
        });
        fetchReferrals(); // Refresh stats
      } else {
        setReferralError(data.error || "Failed to create referral code");
      }
    } catch (err: any) {
      setReferralError(err.message || "Failed to create referral code");
    } finally {
      setCreatingReferral(false);
    }
  };

  const handleDeleteReferral = async (id: number) => {
    if (!confirm("Are you sure you want to delete this referral code?")) return;

    try {
      const response = await fetch(`/api/admin/referrals?id=${id}`, {
        method: "DELETE"
      });

      const data = await response.json();
      if (data.success) {
        setReferrals(referrals.filter(r => r.id !== id));
        fetchReferrals(); // Refresh stats
      }
    } catch (err) {
      console.error("Failed to delete referral:", err);
    }
  };

  const handleToggleReferral = async (id: number, currentActive: boolean) => {
    try {
      const response = await fetch("/api/admin/referrals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: !currentActive })
      });

      const data = await response.json();
      if (data.referral) {
        setReferrals(referrals.map(r => r.id === id ? data.referral : r));
      }
    } catch (err) {
      console.error("Failed to toggle referral:", err);
    }
  };

  // Discount functions
  const fetchDiscounts = async () => {
    try {
      setLoadingDiscounts(true);
      const response = await fetch("/api/admin/discounts");
      const data = await response.json();
      if (data.discounts) {
        setDiscounts(data.discounts);
      }
    } catch (err) {
      console.error("Failed to fetch discounts:", err);
    } finally {
      setLoadingDiscounts(false);
    }
  };

  const handleCreateDiscount = async () => {
    if (newDiscount.discount_value <= 0) {
      setDiscountError("Discount value must be greater than 0");
      return;
    }

    try {
      setCreatingDiscount(true);
      setDiscountError(null);

      const response = await fetch("/api/admin/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newDiscount.custom_code || undefined,
          autoGenerate: !newDiscount.custom_code,
          discountType: newDiscount.discount_type,
          discountValue: newDiscount.discount_value,
          description: newDiscount.description || null,
          minPurchaseAmount: newDiscount.min_purchase_amount ? parseFloat(newDiscount.min_purchase_amount) : null,
          maxUses: newDiscount.max_uses ? parseInt(newDiscount.max_uses) : null,
          expiresAt: newDiscount.expires_at || null
        })
      });

      const data = await response.json();
      if (data.discount) {
        setDiscounts([data.discount, ...discounts]);
        setShowDiscountForm(false);
        setNewDiscount({
          discount_type: "percentage",
          discount_value: 10,
          description: "",
          min_purchase_amount: "",
          max_uses: "",
          expires_at: "",
          custom_code: ""
        });
        fetchDiscounts();
      } else {
        setDiscountError(data.error || "Failed to create discount code");
      }
    } catch (err: any) {
      setDiscountError(err.message || "Failed to create discount code");
    } finally {
      setCreatingDiscount(false);
    }
  };

  const handleDeleteDiscount = async (id: number) => {
    if (!confirm("Are you sure you want to delete this discount code?")) return;

    try {
      const response = await fetch(`/api/admin/discounts?id=${id}`, {
        method: "DELETE"
      });

      const data = await response.json();
      if (data.success) {
        setDiscounts(discounts.filter(d => d.id !== id));
        fetchDiscounts();
      }
    } catch (err) {
      console.error("Failed to delete discount:", err);
    }
  };

  const handleToggleDiscount = async (id: number, currentActive: boolean) => {
    try {
      const response = await fetch("/api/admin/discounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: !currentActive })
      });

      const data = await response.json();
      if (data.discount) {
        setDiscounts(discounts.map(d => d.id === id ? data.discount : d));
      }
    } catch (err) {
      console.error("Failed to toggle discount:", err);
    }
  };

  if (isAdmin === null) {
    return (
      <BackgroundGlow>
        <Navbar />
        <main className="container mx-auto px-6 pt-32 pb-12">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        </main>
      </BackgroundGlow>
    );
  }

  return (
    <BackgroundGlow>
      <Navbar />
      <main className="container mx-auto px-6 pt-32 pb-12">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/")}
                className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-white">Admin Console</h1>
            </div>
          </div>

          {/* Admin Navigation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push("/admin/showcase")}
              className="p-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 transition-colors text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <Star className="w-6 h-6 text-amber-400" />
                <h3 className="text-lg font-semibold text-white">Showcase Manager</h3>
              </div>
              <p className="text-sm text-neutral-400">
                Manage which evaluations appear on the landing page for non-logged-in users.
              </p>
            </button>
            <div className="p-6 rounded-2xl border border-purple-500/30 bg-purple-500/10">
              <div className="flex items-center gap-3 mb-2">
                <Power className="w-6 h-6 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">AX Model Configuration</h3>
              </div>
              <p className="text-sm text-neutral-400">
                Configure AI models for Agent Experience evaluations (shown below).
              </p>
            </div>

            {/* Set Credits Card */}
            <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10">
              <div className="flex items-center gap-3 mb-2">
                <Coins className="w-6 h-6 text-emerald-400" />
                <h3 className="text-lg font-semibold text-white">Set Credits</h3>
              </div>
              <p className="text-sm text-neutral-400 mb-3">
                Current balance: <span className="text-emerald-400 font-bold">{currentBalance ?? '...'}</span>
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={creditsInput}
                  onChange={(e) => setCreditsInput(e.target.value)}
                  placeholder="300"
                  className="flex-1 px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white text-sm"
                />
                <button
                  onClick={handleSetCredits}
                  disabled={settingCredits}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  {settingCredits ? <Loader2 className="w-4 h-4 animate-spin" /> : "Set"}
                </button>
              </div>
              {creditsMessage && (
                <p className={cn(
                  "text-xs mt-2",
                  creditsMessage.type === 'success' ? "text-emerald-400" : "text-red-400"
                )}>
                  {creditsMessage.text}
                </p>
              )}
            </div>
          </div>

          {/* Voucher Codes Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Ticket className="w-6 h-6 text-cyan-400" />
              <h2 className="text-xl font-bold text-white">Voucher Codes</h2>
              {voucherStats && (
                <span className="text-sm text-neutral-400">
                  ({voucherStats.activeVouchers} active, {voucherStats.totalRedemptions} redeemed)
                </span>
              )}
            </div>
            <button
              onClick={() => setShowVoucherForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Voucher
            </button>
          </div>

          {/* Voucher Error */}
          {voucherError && (
            <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300">
              {voucherError}
              <button
                onClick={() => setVoucherError(null)}
                className="ml-4 text-red-400 hover:text-red-300"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Create Voucher Form */}
          {showVoucherForm && (
            <div className="p-6 rounded-2xl border border-cyan-500/30 bg-cyan-500/10">
              <h3 className="text-lg font-semibold text-white mb-4">Create New Voucher</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Credits Amount *</label>
                  <input
                    type="number"
                    value={newVoucher.credits_amount}
                    onChange={(e) => setNewVoucher({ ...newVoucher, credits_amount: parseInt(e.target.value) || 0 })}
                    placeholder="100"
                    className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white placeholder-neutral-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Max Uses (empty = unlimited)</label>
                  <input
                    type="number"
                    value={newVoucher.max_uses}
                    onChange={(e) => setNewVoucher({ ...newVoucher, max_uses: e.target.value })}
                    placeholder="Unlimited"
                    className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white placeholder-neutral-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Expires At (optional)</label>
                  <input
                    type="datetime-local"
                    value={newVoucher.expires_at}
                    onChange={(e) => setNewVoucher({ ...newVoucher, expires_at: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white placeholder-neutral-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Custom Code (optional)</label>
                  <input
                    type="text"
                    value={newVoucher.custom_code}
                    onChange={(e) => setNewVoucher({ ...newVoucher, custom_code: e.target.value.toUpperCase() })}
                    placeholder="BETA-XXXXXXXX"
                    className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white placeholder-neutral-500 font-mono"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleCreateVoucher}
                  disabled={creatingVoucher || newVoucher.credits_amount <= 0}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {creatingVoucher ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Ticket className="w-4 h-4" />
                  )}
                  Create Voucher
                </button>
                <button
                  onClick={() => setShowVoucherForm(false)}
                  className="px-4 py-2 text-neutral-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Vouchers List */}
          <div className="p-6 rounded-2xl border border-white/10 bg-black">
            <h3 className="text-lg font-semibold text-white mb-4">All Vouchers</h3>

            {loadingVouchers ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
              </div>
            ) : vouchers.length === 0 ? (
              <p className="text-neutral-400 text-center py-8">No vouchers created yet.</p>
            ) : (
              <div className="space-y-3">
                {vouchers.map((voucher) => (
                  <div
                    key={voucher.id}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border transition-colors",
                      voucher.is_active
                        ? "border-white/10 bg-neutral-900"
                        : "border-white/5 bg-neutral-900/50 opacity-60"
                    )}
                  >
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div>
                        <p className="text-xs text-neutral-500">Code</p>
                        <div className="flex items-center gap-2">
                          <code className="text-cyan-400 font-mono text-sm">{voucher.code}</code>
                          <button
                            onClick={() => copyToClipboard(voucher.code)}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                            title="Copy code"
                          >
                            {copiedCode === voucher.code ? (
                              <Check className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-neutral-400" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500">Credits</p>
                        <p className="text-white font-medium">{voucher.credits_amount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500">Usage</p>
                        <p className="text-neutral-300">
                          {voucher.current_uses}
                          {voucher.max_uses !== null ? ` / ${voucher.max_uses}` : ' / ∞'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500">Expires</p>
                        <p className="text-neutral-300 text-sm">
                          {voucher.expires_at
                            ? new Date(voucher.expires_at).toLocaleDateString()
                            : 'Never'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500">Status</p>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          voucher.is_active
                            ? "bg-green-500/20 text-green-400"
                            : "bg-neutral-500/20 text-neutral-400"
                        )}>
                          {voucher.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleVoucher(voucher.id, voucher.is_active)}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          voucher.is_active
                            ? "text-green-400 hover:bg-green-500/20"
                            : "text-neutral-500 hover:bg-neutral-800"
                        )}
                        title={voucher.is_active ? "Deactivate" : "Activate"}
                      >
                        {voucher.is_active ? (
                          <ToggleRight className="w-5 h-5" />
                        ) : (
                          <ToggleLeft className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteVoucher(voucher.id)}
                        className="p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Referral Codes Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-orange-400" />
              <h2 className="text-xl font-bold text-white">Referral Codes</h2>
              {referralStats && (
                <span className="text-sm text-neutral-400">
                  ({referralStats.activeCodes} active, ${referralStats.totalSales.toFixed(2)} in sales)
                </span>
              )}
            </div>
            <button
              onClick={() => setShowReferralForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Referral
            </button>
          </div>

          {/* Referral Stats Overview */}
          {referralStats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-4 rounded-xl border border-white/10 bg-neutral-900">
                <p className="text-xs text-neutral-500">Total Codes</p>
                <p className="text-2xl font-bold text-white">{referralStats.totalCodes}</p>
              </div>
              <div className="p-4 rounded-xl border border-white/10 bg-neutral-900">
                <p className="text-xs text-neutral-500">Active</p>
                <p className="text-2xl font-bold text-green-400">{referralStats.activeCodes}</p>
              </div>
              <div className="p-4 rounded-xl border border-white/10 bg-neutral-900">
                <p className="text-xs text-neutral-500">Total Uses</p>
                <p className="text-2xl font-bold text-white">{referralStats.totalUses}</p>
              </div>
              <div className="p-4 rounded-xl border border-white/10 bg-neutral-900">
                <p className="text-xs text-neutral-500">Total Sales</p>
                <p className="text-2xl font-bold text-emerald-400">${referralStats.totalSales.toFixed(2)}</p>
              </div>
              <div className="p-4 rounded-xl border border-white/10 bg-neutral-900">
                <p className="text-xs text-neutral-500">Commission Owed</p>
                <p className="text-2xl font-bold text-orange-400">${referralStats.totalCommission.toFixed(2)}</p>
              </div>
            </div>
          )}

          {/* Referral Error */}
          {referralError && (
            <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300">
              {referralError}
              <button
                onClick={() => setReferralError(null)}
                className="ml-4 text-red-400 hover:text-red-300"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Create Referral Form */}
          {showReferralForm && (
            <div className="p-6 rounded-2xl border border-orange-500/30 bg-orange-500/10">
              <h3 className="text-lg font-semibold text-white mb-4">Create New Referral Code</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Owner/Affiliate Name *</label>
                  <input
                    type="text"
                    value={newReferral.owner_name}
                    onChange={(e) => setNewReferral({ ...newReferral, owner_name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white placeholder-neutral-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Owner Email (optional)</label>
                  <input
                    type="email"
                    value={newReferral.owner_email}
                    onChange={(e) => setNewReferral({ ...newReferral, owner_email: e.target.value })}
                    placeholder="john@example.com"
                    className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white placeholder-neutral-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Custom Code (optional)</label>
                  <input
                    type="text"
                    value={newReferral.custom_code}
                    onChange={(e) => setNewReferral({ ...newReferral, custom_code: e.target.value.toUpperCase() })}
                    placeholder="REF-XXXXXX"
                    className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white placeholder-neutral-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Discount % (for users)</label>
                  <input
                    type="number"
                    value={newReferral.discount_percent}
                    onChange={(e) => setNewReferral({ ...newReferral, discount_percent: parseInt(e.target.value) || 0 })}
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white placeholder-neutral-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Commission % (for affiliate)</label>
                  <input
                    type="number"
                    value={newReferral.commission_percent}
                    onChange={(e) => setNewReferral({ ...newReferral, commission_percent: parseInt(e.target.value) || 0 })}
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white placeholder-neutral-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Max Uses (empty = unlimited)</label>
                  <input
                    type="number"
                    value={newReferral.max_uses}
                    onChange={(e) => setNewReferral({ ...newReferral, max_uses: e.target.value })}
                    placeholder="Unlimited"
                    className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white placeholder-neutral-500"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm text-neutral-400 mb-1">Expires At (optional)</label>
                  <input
                    type="datetime-local"
                    value={newReferral.expires_at}
                    onChange={(e) => setNewReferral({ ...newReferral, expires_at: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white placeholder-neutral-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleCreateReferral}
                  disabled={creatingReferral || !newReferral.owner_name.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {creatingReferral ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Users className="w-4 h-4" />
                  )}
                  Create Referral Code
                </button>
                <button
                  onClick={() => setShowReferralForm(false)}
                  className="px-4 py-2 text-neutral-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Referrals List */}
          <div className="p-6 rounded-2xl border border-white/10 bg-black">
            <h3 className="text-lg font-semibold text-white mb-4">All Referral Codes</h3>

            {loadingReferrals ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
              </div>
            ) : referrals.length === 0 ? (
              <p className="text-neutral-400 text-center py-8">No referral codes created yet.</p>
            ) : (
              <div className="space-y-3">
                {referrals.map((referral) => (
                  <div
                    key={referral.id}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border transition-colors",
                      referral.is_active
                        ? "border-white/10 bg-neutral-900"
                        : "border-white/5 bg-neutral-900/50 opacity-60"
                    )}
                  >
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-7 gap-4">
                      <div>
                        <p className="text-xs text-neutral-500">Code</p>
                        <div className="flex items-center gap-2">
                          <code className="text-orange-400 font-mono text-sm">{referral.code}</code>
                          <button
                            onClick={() => copyToClipboard(referral.code)}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                            title="Copy code"
                          >
                            {copiedCode === referral.code ? (
                              <Check className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-neutral-400" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500">Owner</p>
                        <p className="text-white font-medium text-sm">{referral.owner_name}</p>
                        {referral.owner_email && (
                          <p className="text-xs text-neutral-500">{referral.owner_email}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500">Discount</p>
                        <p className="text-emerald-400 font-medium">{referral.discount_percent}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500">Commission</p>
                        <p className="text-orange-400 font-medium">{referral.commission_percent}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500">Uses / Sales</p>
                        <p className="text-neutral-300 text-sm">
                          {referral.current_uses}
                          {referral.max_uses !== null ? ` / ${referral.max_uses}` : ' / ∞'}
                          <span className="text-emerald-400 ml-2">${Number(referral.total_sales_amount).toFixed(2)}</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500">Commission Earned</p>
                        <p className="text-orange-400 font-medium">${Number(referral.total_commission_earned).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500">Status</p>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          referral.is_active
                            ? "bg-green-500/20 text-green-400"
                            : "bg-neutral-500/20 text-neutral-400"
                        )}>
                          {referral.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleReferral(referral.id, referral.is_active)}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          referral.is_active
                            ? "text-green-400 hover:bg-green-500/20"
                            : "text-neutral-500 hover:bg-neutral-800"
                        )}
                        title={referral.is_active ? "Deactivate" : "Activate"}
                      >
                        {referral.is_active ? (
                          <ToggleRight className="w-5 h-5" />
                        ) : (
                          <ToggleLeft className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteReferral(referral.id)}
                        className="p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Discount Codes Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Percent className="w-6 h-6 text-amber-400" />
              <h2 className="text-xl font-bold text-white">Discount Codes</h2>
              {discountStats && (
                <span className="text-sm text-neutral-400">
                  ({discountStats.activeCodes} active, €{discountStats.totalDiscountGiven.toFixed(2)} given)
                </span>
              )}
            </div>
            <button
              onClick={() => setShowDiscountForm(!showDiscountForm)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Discount
            </button>
          </div>

          {/* Discount Creation Form */}
          {showDiscountForm && (
            <div className="p-6 rounded-2xl border border-amber-500/30 bg-amber-900/10">
              <h3 className="text-lg font-semibold text-white mb-4">Create Discount Code</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Discount Type</label>
                  <select
                    value={newDiscount.discount_type}
                    onChange={(e) => setNewDiscount({ ...newDiscount, discount_type: e.target.value as "percentage" | "fixed" })}
                    className="w-full px-4 py-2 rounded-lg bg-black/50 border border-white/10 text-white"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (€)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-neutral-400 mb-1">
                    Discount Value {newDiscount.discount_type === "percentage" ? "(%)" : "(€)"}
                  </label>
                  <input
                    type="number"
                    value={newDiscount.discount_value}
                    onChange={(e) => setNewDiscount({ ...newDiscount, discount_value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 rounded-lg bg-black/50 border border-white/10 text-white"
                    min="0"
                    max={newDiscount.discount_type === "percentage" ? "100" : undefined}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm text-neutral-400 mb-1">Description (optional)</label>
                  <input
                    type="text"
                    value={newDiscount.description}
                    onChange={(e) => setNewDiscount({ ...newDiscount, description: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-black/50 border border-white/10 text-white"
                    placeholder="e.g., Summer Sale 2024"
                  />
                </div>

                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Custom Code (optional)</label>
                  <input
                    type="text"
                    value={newDiscount.custom_code}
                    onChange={(e) => setNewDiscount({ ...newDiscount, custom_code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 rounded-lg bg-black/50 border border-white/10 text-white uppercase"
                    placeholder="Auto-generate if empty"
                  />
                </div>

                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Min. Purchase (€, optional)</label>
                  <input
                    type="number"
                    value={newDiscount.min_purchase_amount}
                    onChange={(e) => setNewDiscount({ ...newDiscount, min_purchase_amount: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-black/50 border border-white/10 text-white"
                    placeholder="No minimum"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Max Uses (optional)</label>
                  <input
                    type="number"
                    value={newDiscount.max_uses}
                    onChange={(e) => setNewDiscount({ ...newDiscount, max_uses: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-black/50 border border-white/10 text-white"
                    placeholder="Unlimited"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Expires (optional)</label>
                  <input
                    type="date"
                    value={newDiscount.expires_at}
                    onChange={(e) => setNewDiscount({ ...newDiscount, expires_at: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-black/50 border border-white/10 text-white"
                  />
                </div>
              </div>

              {discountError && (
                <p className="mt-4 text-red-400 text-sm">{discountError}</p>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleCreateDiscount}
                  disabled={creatingDiscount}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  {creatingDiscount ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Create Discount
                </button>
                <button
                  onClick={() => setShowDiscountForm(false)}
                  className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Discounts List */}
          <div className="p-6 rounded-2xl border border-white/10 bg-black">
            <h3 className="text-lg font-semibold text-white mb-4">All Discount Codes</h3>

            {loadingDiscounts ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              </div>
            ) : discounts.length === 0 ? (
              <p className="text-neutral-400 text-center py-8">No discount codes yet</p>
            ) : (
              <div className="space-y-3">
                {discounts.map((discount) => (
                  <div
                    key={discount.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(discount.code);
                            setCopiedCode(discount.code);
                            setTimeout(() => setCopiedCode(null), 2000);
                          }}
                          className="flex items-center gap-2 font-mono text-amber-400 hover:text-amber-300 transition-colors"
                        >
                          {discount.code}
                          {copiedCode === discount.code ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <span className="text-sm text-neutral-300">
                          {discount.discount_type === "percentage"
                            ? `${Number(discount.discount_value)}% off`
                            : `€${Number(discount.discount_value)} off`}
                        </span>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          discount.is_active
                            ? "bg-green-500/20 text-green-400"
                            : "bg-neutral-500/20 text-neutral-400"
                        )}>
                          {discount.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="text-sm text-neutral-400">
                        {discount.description && <span>{discount.description} • </span>}
                        Uses: {discount.current_uses}{discount.max_uses ? `/${discount.max_uses}` : ""} •
                        Total: €{Number(discount.total_discount_given).toFixed(2)}
                        {discount.min_purchase_amount && ` • Min: €${Number(discount.min_purchase_amount)}`}
                        {discount.expires_at && ` • Expires: ${new Date(discount.expires_at).toLocaleDateString()}`}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleDiscount(discount.id, discount.is_active)}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          discount.is_active
                            ? "text-green-400 hover:bg-green-500/20"
                            : "text-neutral-500 hover:bg-neutral-800"
                        )}
                        title={discount.is_active ? "Deactivate" : "Activate"}
                      >
                        {discount.is_active ? (
                          <ToggleRight className="w-5 h-5" />
                        ) : (
                          <ToggleLeft className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteDiscount(discount.id)}
                        className="p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AX Models Section Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">AX Models</h2>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Model
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300">
              {error}
              <button
                onClick={() => setError(null)}
                className="ml-4 text-red-400 hover:text-red-300"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Add Model Form */}
          {showAddForm && (
            <div className="p-6 rounded-2xl border border-white/10 bg-black">
              <h2 className="text-lg font-semibold text-white mb-4">Add New Model</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Model ID</label>
                  <input
                    type="text"
                    value={newModel.model_id}
                    onChange={(e) => setNewModel({ ...newModel, model_id: e.target.value })}
                    placeholder="e.g., gpt-4o"
                    className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white placeholder-neutral-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={newModel.display_name}
                    onChange={(e) => setNewModel({ ...newModel, display_name: e.target.value })}
                    placeholder="e.g., GPT-4o"
                    className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white placeholder-neutral-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Provider</label>
                  <input
                    type="text"
                    value={newModel.provider}
                    onChange={(e) => setNewModel({ ...newModel, provider: e.target.value })}
                    placeholder="e.g., OpenAI"
                    className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white placeholder-neutral-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">OpenRouter Model ID</label>
                  <input
                    type="text"
                    value={newModel.openrouter_model_id}
                    onChange={(e) => setNewModel({ ...newModel, openrouter_model_id: e.target.value })}
                    placeholder="e.g., openai/gpt-4o"
                    className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white placeholder-neutral-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4">
                <label className="flex items-center gap-2 text-sm text-neutral-400">
                  <input
                    type="checkbox"
                    checked={newModel.is_enabled}
                    onChange={(e) => setNewModel({ ...newModel, is_enabled: e.target.checked })}
                    className="rounded"
                  />
                  Enabled
                </label>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAddModel}
                  disabled={saving === -1}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving === -1 ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Model
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-neutral-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Models List */}
          <div className="p-6 rounded-2xl border border-white/10 bg-black">
            <h2 className="text-lg font-semibold text-white mb-4">Configured Models</h2>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              </div>
            ) : models.length === 0 ? (
              <p className="text-neutral-400 text-center py-8">No models configured yet.</p>
            ) : (
              <div className="space-y-3">
                {models.map((model, index) => (
                  <div
                    key={model.id}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border transition-colors",
                      model.is_enabled
                        ? "border-white/10 bg-neutral-900"
                        : "border-white/5 bg-neutral-900/50 opacity-60"
                    )}
                  >
                    <GripVertical className="w-5 h-5 text-neutral-600 cursor-grab" />

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-neutral-500">Display Name</p>
                        <input
                          type="text"
                          value={model.display_name}
                          onChange={(e) => handleUpdateModel(model, { display_name: e.target.value })}
                          className="w-full bg-transparent text-white font-medium focus:outline-none focus:ring-1 focus:ring-purple-500 rounded px-1"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500">Model ID</p>
                        <p className="text-sm text-neutral-300 font-mono">{model.model_id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500">Provider</p>
                        <p className="text-sm text-neutral-300 capitalize">{model.provider}</p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500">OpenRouter ID</p>
                        <input
                          type="text"
                          value={model.openrouter_model_id}
                          onChange={(e) => handleUpdateModel(model, { openrouter_model_id: e.target.value })}
                          className="w-full bg-transparent text-sm text-neutral-300 font-mono focus:outline-none focus:ring-1 focus:ring-purple-500 rounded px-1"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleEnabled(model)}
                        disabled={saving === model.id}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          model.is_enabled
                            ? "text-green-400 hover:bg-green-500/20"
                            : "text-neutral-500 hover:bg-neutral-800"
                        )}
                        title={model.is_enabled ? "Disable" : "Enable"}
                      >
                        {saving === model.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Power className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={() => handleDeleteModel(model)}
                        disabled={saving === model.id}
                        className="p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="p-6 rounded-2xl border border-purple-500/30 bg-purple-500/10">
            <h3 className="font-semibold text-purple-300 mb-2">About AX Model Configuration</h3>
            <p className="text-sm text-purple-200/70">
              Configure which AI models are available for Agent Experience (AX) evaluations.
              Each model will evaluate websites independently, and the AX Council will aggregate
              their scores into a final assessment. Models are called via OpenRouter API.
            </p>
            <p className="text-sm text-purple-200/70 mt-2">
              Find available model IDs at{" "}
              <a
                href="https://openrouter.ai/models"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 underline"
              >
                openrouter.ai/models
              </a>
              . Use the format <code className="bg-purple-900/50 px-1 rounded">provider/model-name</code> (e.g., openai/gpt-4o, anthropic/claude-3.5-sonnet).
            </p>
            <p className="text-sm text-purple-200/70 mt-2">
              Make sure you have set the <code className="bg-purple-900/50 px-1 rounded">OPENROUTER_API_KEY</code> environment variable.
            </p>
          </div>
        </div>
      </main>
    </BackgroundGlow>
  );
}
