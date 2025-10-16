"use client";

import { useEffect, useState } from "react";
import { useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { BackgroundGlow } from "@/components/ui/background-components";
import { Mail, Calendar, TrendingUp, ExternalLink, Trash2, Loader2 } from "lucide-react";
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
    if (score >= 70) return "text-green-600 dark:text-green-400";
    if (score >= 40) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
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
        <div className="max-w-6xl mx-auto space-y-8">
          {/* User Info Card */}
          <div className="p-8 rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
                {user.displayName?.[0]?.toUpperCase() || user.primaryEmail?.[0]?.toUpperCase() || "U"}
              </div>

              {/* User Details */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-black dark:text-white mb-2">
                  {user.displayName || "User Profile"}
                </h1>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                    <Mail className="w-4 h-4" />
                    <span>{user.primaryEmail}</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                    <Calendar className="w-4 h-4" />
                    <span>Member since {new Date(user.createdAt || Date.now()).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Account Settings Link */}
              <Link
                href="/handler/account-settings"
                className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-black dark:text-white transition-colors"
              >
                Account Settings
              </Link>
            </div>
          </div>

          {/* Evaluations Section */}
          <div className="p-8 rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-black dark:text-white" />
                <h2 className="text-2xl font-bold text-black dark:text-white">
                  My Evaluations
                </h2>
                <span className="ml-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-semibold">
                  {evaluations.length}
                </span>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
              </div>
            ) : evaluations.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                  No evaluations yet
                </p>
                <button
                  onClick={() => router.push("/")}
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  Create Your First Evaluation
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {evaluations.map((evaluation) => (
                  <div
                    key={evaluation.id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-black/10 dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    {/* URL */}
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm text-black dark:text-white truncate">
                        {evaluation.url}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        {new Date(evaluation.timestamp).toLocaleDateString()} at{" "}
                        {new Date(evaluation.timestamp).toLocaleTimeString()}
                      </p>
                    </div>

                    {/* Overall Score */}
                    <div className={cn("px-4 py-2 rounded-lg", getScoreBgColor(evaluation.overallScore))}>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Score</p>
                      <p className={cn("text-2xl font-bold", getScoreColor(evaluation.overallScore))}>
                        {evaluation.overallScore}
                      </p>
                    </div>

                    {/* Buying Intent */}
                    <div className={cn("px-4 py-2 rounded-lg", getScoreBgColor(evaluation.buyingIntentProbability))}>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Intent</p>
                      <p className={cn("text-2xl font-bold", getScoreColor(evaluation.buyingIntentProbability))}>
                        {evaluation.buyingIntentProbability}%
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewEvaluation(evaluation)}
                        className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 transition-colors"
                        title="View Report"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteEvaluation(evaluation.id)}
                        disabled={deleting === evaluation.id}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        {deleting === evaluation.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
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
