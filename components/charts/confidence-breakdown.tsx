"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";

interface ConfidenceBreakdownProps {
  ssrConfidence: number;
  ssrMarginConfidence?: number;
}

export function ConfidenceBreakdown({ ssrConfidence, ssrMarginConfidence }: ConfidenceBreakdownProps) {
  // Calculate entropy confidence from the combined confidence
  // Since ssrConfidence = (entropy + margin) / 2, we can derive:
  const marginConfidence = ssrMarginConfidence ?? 0;
  const entropyConfidence = ssrConfidence * 2 - marginConfidence;

  const chartData = [
    {
      name: "Confidence Metrics",
      entropy: Math.max(0, entropyConfidence),
      margin: marginConfidence,
      combined: ssrConfidence,
    },
  ];

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-neutral-700" />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fill: "#6b7280", fontSize: 11 }}
            label={{ value: "Confidence (%)", position: "insideBottom", offset: -10, fill: "#6b7280" }}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: "#6b7280", fontSize: 12 }}
            width={90}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "8px 12px",
            }}
            formatter={(value: number) => [`${value.toFixed(1)}%`, ""]}
          />
          <Legend
            wrapperStyle={{ paddingTop: "10px" }}
            iconType="square"
          />
          <Bar dataKey="entropy" fill="#b3ffcb" name="Entropy Confidence" radius={[0, 4, 4, 0]} />
          <Bar dataKey="margin" fill="#66ff96" name="Margin Confidence" radius={[0, 4, 4, 0]} />
          <Bar dataKey="combined" fill="#4d0026" name="Combined Confidence" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-3 rounded-lg bg-[#b3ffcb]/10 border border-[#b3ffcb]/30">
          <div className="font-semibold text-[#4d0026] dark:text-[#b3ffcb] mb-1">
            Entropy Confidence
          </div>
          <div className="text-neutral-600 dark:text-neutral-400">
            Measures how concentrated the probability distribution is. Higher = more decisive prediction.
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[#66ff96]/10 border border-[#66ff96]/30">
          <div className="font-semibold text-[#4d0026] dark:text-[#66ff96] mb-1">
            Margin Confidence
          </div>
          <div className="text-neutral-600 dark:text-neutral-400">
            Difference between top 2 probabilities. Higher = stronger preference for one anchor tier.
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[#4d0026]/10 border border-[#4d0026]/30">
          <div className="font-semibold text-[#4d0026] dark:text-white mb-1">
            Combined Confidence
          </div>
          <div className="text-neutral-600 dark:text-neutral-400">
            Average of both metrics for robust, balanced confidence measurement.
          </div>
        </div>
      </div>
    </div>
  );
}
