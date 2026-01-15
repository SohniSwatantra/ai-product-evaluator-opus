"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Line, ComposedChart } from "recharts";
import type { SSRDistribution } from "@/types";

interface SSRDistributionChartProps {
  distribution: SSRDistribution;
}

export function SSRDistributionChart({ distribution }: SSRDistributionChartProps) {
  // Return null if distribution is invalid
  if (!distribution) {
    return null;
  }

  // Safely access distribution values with defaults
  const safeDistribution = {
    rating1: typeof distribution.rating1 === "number" ? distribution.rating1 : 0,
    rating2: typeof distribution.rating2 === "number" ? distribution.rating2 : 0,
    rating3: typeof distribution.rating3 === "number" ? distribution.rating3 : 0,
    rating4: typeof distribution.rating4 === "number" ? distribution.rating4 : 0,
    rating5: typeof distribution.rating5 === "number" ? distribution.rating5 : 0,
  };

  // Transform distribution data for recharts
  const chartData = [
    { rating: "1 - Very Unlikely", value: safeDistribution.rating1 * 100, rawValue: safeDistribution.rating1 },
    { rating: "2 - Unlikely", value: safeDistribution.rating2 * 100, rawValue: safeDistribution.rating2 },
    { rating: "3 - Uncertain", value: safeDistribution.rating3 * 100, rawValue: safeDistribution.rating3 },
    { rating: "4 - Likely", value: safeDistribution.rating4 * 100, rawValue: safeDistribution.rating4 },
    { rating: "5 - Very Likely", value: safeDistribution.rating5 * 100, rawValue: safeDistribution.rating5 },
  ];

  // Color gradient from red to green
  const colors = ["#ff6b6b", "#ffa07a", "#ffd93d", "#b3ffcb", "#66ff96"];

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 50 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-neutral-700" />
        <XAxis
          dataKey="rating"
          angle={-35}
          textAnchor="end"
          height={70}
          tick={{ fill: "#6b7280", fontSize: 9 }}
          className="dark:fill-neutral-400"
          interval={0}
        />
        <YAxis
          label={{ value: "Prob (%)", angle: -90, position: "insideLeft", fill: "#6b7280", fontSize: 9 }}
          tick={{ fill: "#6b7280", fontSize: 9 }}
          width={40}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "8px 12px",
          }}
          formatter={(value: number, name: string, props: any) => [
            `${value.toFixed(1)}% (p=${props.payload.rawValue.toFixed(3)})`,
            "Probability",
          ]}
        />
        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index]} />
          ))}
        </Bar>
      </ComposedChart>
    </ResponsiveContainer>
  );
}
