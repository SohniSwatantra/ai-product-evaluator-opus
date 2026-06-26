"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { ProductEvaluation } from "@/types";

/**
 * Tier 2: Side-by-side comparison view.
 * Visit /compare?ids=1,2,3 (e.g. your site vs a competitor).
 */
function CompareInner() {
  const searchParams = useSearchParams();
  const idsParam = searchParams.get("ids") || "";
  const [evaluations, setEvaluations] = useState<ProductEvaluation[]>([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState(idsParam);

  useEffect(() => {
    if (!idsParam) return;
    setLoading(true);
    fetch(`/api/evaluations/compare?ids=${encodeURIComponent(idsParam)}`)
      .then((r) => r.json())
      .then((d) => setEvaluations(d.evaluations || []))
      .catch(() => setEvaluations([]))
      .finally(() => setLoading(false));
  }, [idsParam]);

  const rows: { label: string; get: (e: ProductEvaluation) => string }[] = [
    { label: "URL", get: (e) => e.url },
    { label: "Overall Score", get: (e) => `${e.overallScore}/100` },
    { label: "Buying Intent", get: (e) => `${e.buyingIntentProbability}%` },
    { label: "SSR Score", get: (e) => (e.ssrScore != null ? `${e.ssrScore}/100` : "—") },
    { label: "AX Score", get: (e) => (e.agentExperience ? `${e.agentExperience.axScore}/100` : "—") },
    { label: "ANPS", get: (e) => (e.agentExperience ? `${e.agentExperience.anps}` : "—") },
    {
      label: "AX Basis",
      get: (e) => (e.agentExperience?.scoreBasis === "measured" ? "Measured" : e.agentExperience ? "Estimated" : "—"),
    },
    { label: "llms.txt", get: (e) => yn(e.agentExperience?.measuredSignals?.llmsTxt.present) },
    {
      label: "Markdown negotiation",
      get: (e) => yn(e.agentExperience?.measuredSignals?.contentNegotiation.supportsMarkdown),
    },
    {
      label: "JSON-LD blocks",
      get: (e) => (e.agentExperience?.measuredSignals ? String(e.agentExperience.measuredSignals.structuredData.jsonLdBlocks) : "—"),
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-2 text-black dark:text-white">Compare Evaluations</h1>
      <p className="text-sm text-neutral-500 mb-6">
        Benchmark your site against competitors. Enter evaluation IDs separated by commas.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const u = new URL(window.location.href);
          u.searchParams.set("ids", input);
          window.location.href = u.toString();
        }}
        className="flex gap-2 mb-8"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. 12, 34, 56"
          className="flex-1 px-3 py-2 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-black dark:text-white"
        />
        <button className="px-4 py-2 rounded bg-purple-600 text-white font-medium hover:bg-purple-700">Compare</button>
      </form>

      {loading && <p className="text-neutral-500">Loading…</p>}

      {!loading && evaluations.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="text-left p-2 border-b border-neutral-200 dark:border-neutral-800"></th>
                {evaluations.map((e) => (
                  <th key={e.id} className="text-left p-2 border-b border-neutral-200 dark:border-neutral-800 text-black dark:text-white">
                    #{e.id}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <td className="p-2 font-medium text-neutral-600 dark:text-neutral-400 whitespace-nowrap">{row.label}</td>
                  {evaluations.map((e) => (
                    <td key={e.id} className="p-2 text-black dark:text-white break-all">{row.get(e)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && idsParam && evaluations.length === 0 && (
        <p className="text-neutral-500">No evaluations found for those IDs.</p>
      )}
    </div>
  );
}

function yn(v: boolean | undefined): string {
  if (v === undefined) return "—";
  return v ? "Yes" : "No";
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="p-10 text-neutral-500">Loading…</div>}>
      <CompareInner />
    </Suspense>
  );
}
