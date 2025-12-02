"use client";

import { useEffect, useState } from "react";
import { useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { BackgroundGlow } from "@/components/ui/background-components";
import { Mail, Calendar, TrendingUp, ExternalLink, Trash2, Loader2, Settings } from "lucide-react";
import Link from "next/link";
import { type ProductEvaluation } from "@/types";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const user = useUser();
  const router = useRouter();
  const [evaluations, setEvaluations] = useState<ProductEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }

    fetchUserEvaluations();
  }, [user, router]);

  const fetchUserEvaluations = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/evaluations/user");
      if (response.ok) {
        const data = await response.json();
        setEvaluations(data);
      }
    } catch (error) {
      console.error("Failed to fetch evaluations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvaluation = async (id: number) => {
    if (!confirm("Are you sure you want to delete this evaluation?")) {
      return;
    }

    try {
      setDeleting(id);
      const response = await fetch(`/api/evaluations/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setEvaluations(evaluations.filter((e) => e.id !== id));
      } else {
        alert("Failed to delete evaluation");
      }
    } catch (error) {
      console.error("Failed to delete evaluation:", error);
      alert("Failed to delete evaluation");
    } finally {
      setDeleting(null);
    }
  };

  const handleViewEvaluation = (evaluation: ProductEvaluation) => {
    // Store evaluation in sessionStorage and navigate to home
    sessionStorage.setItem("selectedEvaluation", JSON.stringify(evaluation));
    router.push("/?view=evaluation");
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-500";
    if (score >= 40) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 70) return "bg-green-500/10";
    if (score >= 40) return "bg-yellow-500/10";
    return "bg-red-500/10";
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <BackgroundGlow>
      <Navbar />
      <main className="container mx-auto px-6 pt-32 pb-12">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* User Info Card */}
          <div className="p-6 rounded-2xl border border-white/10 bg-black">
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                {/* Avatar */}
                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                  {user.displayName?.[0]?.toUpperCase() || user.primaryEmail?.[0]?.toUpperCase() || "U"}
                </div>

                {/* User Details */}
                <div>
                  <h1 className="text-2xl font-bold text-white mb-1">
                    {user.displayName || "User Profile"}
                  </h1>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-neutral-400">
                      <Mail className="w-3.5 h-3.5" />
                      <span>{user.primaryEmail}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-neutral-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Member since {new Date(user.createdAt || Date.now()).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Settings Button */}
              <Link
                href="/handler/account-settings"
                className="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/5 text-white transition-colors text-sm font-medium"
              >
                Account Settings
              </Link>
            </div>
          </div>

          {/* Evaluations Section */}
          <div className="p-6 rounded-2xl border border-white/10 bg-black">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-white" />
              <h2 className="text-xl font-bold text-white">
                My Evaluations
              </h2>
              <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold">
                {evaluations.length}
              </span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              </div>
            ) : evaluations.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-neutral-400 mb-4">
                  No evaluations yet
                </p>
                <button
                  onClick={() => router.push("/")}
                  className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all text-sm"
                >
                  Create Your First Evaluation
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {evaluations.map((evaluation) => (
                  <div
                    key={evaluation.id}
                    onClick={() => handleViewEvaluation(evaluation)}
                    className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-[#111] hover:border-white/20 transition-colors cursor-pointer"
                  >
                    {/* URL */}
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm text-white truncate">
                        {evaluation.url}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">
                        {new Date(evaluation.timestamp).toLocaleDateString()} at{" "}
                        {new Date(evaluation.timestamp).toLocaleTimeString()}
                      </p>
                    </div>

                    {/* Scores */}
                    <div className="flex items-center gap-3">
                      <div className={cn("px-3 py-1.5 rounded-lg min-w-[80px] text-center", getScoreBgColor(evaluation.overallScore))}>
                        <p className="text-[10px] uppercase tracking-wider text-neutral-400 mb-0.5">Score</p>
                        <p className={cn("text-lg font-bold leading-none", getScoreColor(evaluation.overallScore))}>
                          {evaluation.overallScore}
                        </p>
                      </div>

                      <div className={cn("px-3 py-1.5 rounded-lg min-w-[80px] text-center", getScoreBgColor(evaluation.buyingIntentProbability))}>
                        <p className="text-[10px] uppercase tracking-wider text-neutral-400 mb-0.5">Intent</p>
                        <p className={cn("text-lg font-bold leading-none", getScoreColor(evaluation.buyingIntentProbability))}>
                          {evaluation.buyingIntentProbability}%
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 pl-2 border-l border-white/10" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleViewEvaluation(evaluation)}
                        className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-400 transition-colors"
                        title="View Report"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEvaluation(evaluation.id)}
                        disabled={deleting === evaluation.id}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        {deleting === evaluation.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </BackgroundGlow>
  );
}
