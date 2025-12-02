"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { BackgroundGlow } from "@/components/ui/background-components";
import {
  Loader2,
  Plus,
  Trash2,
  ExternalLink,
  Star,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ShowcaseEvaluation {
  id: number;
  evaluation_id: number;
  display_order: number;
  created_at: string;
  url: string;
  overall_score: number;
  evaluation_timestamp: string;
}

export default function ShowcaseAdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showcaseEvaluations, setShowcaseEvaluations] = useState<ShowcaseEvaluation[]>([]);
  const [newEvaluationId, setNewEvaluationId] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const response = await fetch("/api/admin/check");
      const data = await response.json();

      if (!data.isAdmin) {
        router.push("/");
        return;
      }

      setIsAdmin(true);
      fetchShowcaseEvaluations();
    } catch (err) {
      router.push("/");
    }
  };

  const fetchShowcaseEvaluations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/admin/showcase");
      const data = await response.json();

      if (data.success) {
        setShowcaseEvaluations(data.evaluations);
      } else {
        setError(data.error || "Failed to fetch showcase evaluations");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvaluation = async () => {
    const id = parseInt(newEvaluationId);
    if (isNaN(id) || id <= 0) {
      setError("Please enter a valid evaluation ID");
      return;
    }

    try {
      setAdding(true);
      setError(null);

      const response = await fetch("/api/admin/showcase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evaluationId: id }),
      });

      const data = await response.json();

      if (data.success) {
        setNewEvaluationId("");
        fetchShowcaseEvaluations();
      } else {
        setError(data.error || "Failed to add evaluation");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveEvaluation = async (evaluationId: number) => {
    try {
      setRemovingId(evaluationId);
      setError(null);

      const response = await fetch("/api/admin/showcase", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evaluationId }),
      });

      const data = await response.json();

      if (data.success) {
        fetchShowcaseEvaluations();
      } else {
        setError(data.error || "Failed to remove evaluation");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setRemovingId(null);
    }
  };

  // Show loading while checking auth
  if (isAdmin === null) {
    return (
      <BackgroundGlow>
        <Navbar />
        <main className="container mx-auto px-6 pt-32 pb-20">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        </main>
      </BackgroundGlow>
    );
  }

  return (
    <BackgroundGlow>
      <Navbar />
      <main className="container mx-auto px-6 pt-32 pb-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.push("/admin")}
              className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-500/20">
                <Star className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Showcase Manager</h1>
                <p className="text-neutral-400">Manage evaluations shown on the landing page</p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-300 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-300"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Add Evaluation Form */}
          <div className="mb-8 p-6 rounded-2xl bg-white/5 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-green-400" />
              Add Evaluation to Showcase
            </h2>
            <div className="flex gap-4">
              <input
                type="number"
                value={newEvaluationId}
                onChange={(e) => setNewEvaluationId(e.target.value)}
                placeholder="Enter Evaluation ID"
                className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
                onKeyDown={(e) => e.key === "Enter" && handleAddEvaluation()}
              />
              <button
                onClick={handleAddEvaluation}
                disabled={adding || !newEvaluationId}
                className={cn(
                  "px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all",
                  "bg-purple-600 hover:bg-purple-700 text-white",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {adding ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
                Add
              </button>
            </div>
            <p className="mt-3 text-sm text-neutral-500">
              Find evaluation IDs from the URL when viewing an evaluation (e.g., /evaluation/123 means ID is 123).
            </p>
          </div>

          {/* Showcase Evaluations List */}
          <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">
                Current Showcase ({showcaseEvaluations.length} evaluations)
              </h2>
              <p className="text-sm text-neutral-400 mt-1">
                These evaluations are displayed on the landing page to visitors who are not logged in.
              </p>
            </div>

            {loading ? (
              <div className="p-12 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              </div>
            ) : showcaseEvaluations.length === 0 ? (
              <div className="p-12 text-center">
                <Star className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                <p className="text-neutral-400">No showcase evaluations yet.</p>
                <p className="text-sm text-neutral-500 mt-1">
                  Add evaluations above to display them on the landing page.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {showcaseEvaluations.map((evaluation, index) => (
                  <div
                    key={evaluation.id}
                    className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-500/20 text-purple-400 font-bold text-sm">
                        #{index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-neutral-500">ID: {evaluation.evaluation_id}</span>
                          {evaluation.overall_score && (
                            <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                              Score: {evaluation.overall_score}
                            </span>
                          )}
                        </div>
                        <p className="text-white truncate mt-1">
                          {evaluation.url || "URL not available"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {evaluation.url && (
                        <a
                          href={evaluation.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                          title="View original URL"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </a>
                      )}
                      <button
                        onClick={() => handleRemoveEvaluation(evaluation.evaluation_id)}
                        disabled={removingId === evaluation.evaluation_id}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition-colors disabled:opacity-50"
                        title="Remove from showcase"
                      >
                        {removingId === evaluation.evaluation_id ? (
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

          {/* Info */}
          <div className="mt-8 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
            <p className="text-sm text-blue-300">
              <strong>How it works:</strong> Evaluations added to the showcase will be displayed on the landing page
              for visitors who are not logged in. Logged-in users will see their own evaluations instead.
            </p>
          </div>
        </div>
      </main>
    </BackgroundGlow>
  );
}
