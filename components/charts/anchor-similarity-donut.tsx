"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface AnchorSimilarityDonutProps {
  anchorSimilarities?: Array<{ tier: string; similarity: number }>;
}

export function AnchorSimilarityDonut({ anchorSimilarities }: AnchorSimilarityDonutProps) {
  if (!anchorSimilarities || anchorSimilarities.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral-500">
        No anchor similarity data available
      </div>
    );
  }

  // Transform data for pie chart
  const chartData = anchorSimilarities.map((item) => ({
    name: `${item.tier.charAt(0).toUpperCase() + item.tier.slice(1)} Anchor`,
    value: item.similarity,
    percentage: ((item.similarity / anchorSimilarities.reduce((sum, a) => sum + a.similarity, 0)) * 100).toFixed(1),
  }));

  // Colors for each tier
  const COLORS = {
    low: "#ff6b6b",    // Red
    middle: "#ffd93d", // Yellow
    high: "#66ff96",   // Green
  };

  const getColor = (index: number) => {
    const tier = anchorSimilarities[index].tier.toLowerCase();
    return COLORS[tier as keyof typeof COLORS] || "#999";
  };

  // Custom label for the pie chart
  const renderLabel = (entry: any) => {
    return `${entry.percentage}%`;
  };

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={100}
            innerRadius={60}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(index)} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "8px 12px",
            }}
            formatter={(value: number, name: string, props: any) => [
              `${value.toFixed(4)} similarity (${props.payload.percentage}%)`,
              name,
            ]}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Explanation */}
      <div className="text-center text-xs text-neutral-600 dark:text-neutral-400 px-4">
        This chart shows how closely the product review matches each purchase intent tier based on semantic similarity.
        Higher values indicate stronger alignment with that tier's characteristic statements.
      </div>

      {/* Tier indicators */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="p-2 rounded-lg bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 text-center">
          <div className="font-semibold text-[#ff6b6b]">🔴 Low</div>
          <div className="text-neutral-600 dark:text-neutral-400 mt-1">Unlikely to purchase</div>
        </div>
        <div className="p-2 rounded-lg bg-[#ffd93d]/10 border border-[#ffd93d]/30 text-center">
          <div className="font-semibold text-[#d4b000]">🟡 Middle</div>
          <div className="text-neutral-600 dark:text-neutral-400 mt-1">Uncertain/Considering</div>
        </div>
        <div className="p-2 rounded-lg bg-[#66ff96]/10 border border-[#66ff96]/30 text-center">
          <div className="font-semibold text-[#00a851]">🟢 High</div>
          <div className="text-neutral-600 dark:text-neutral-400 mt-1">Strong intent to buy</div>
        </div>
      </div>
    </div>
  );
}
