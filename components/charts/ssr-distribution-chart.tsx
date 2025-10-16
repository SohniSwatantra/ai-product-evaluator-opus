"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Line, ComposedChart } from "recharts";
import type { SSRDistribution } from "@/types";

interface SSRDistributionChartProps {
  distribution: SSRDistribution;
}

export function SSRDistributionChart({ distribution }: SSRDistributionChartProps) {
  // Transform distribution data for recharts
  const chartData = [
    { rating: "1 - Very Unlikely", value: distribution.rating1 * 100, rawValue: distribution.rating1 },
    { rating: "2 - Unlikely", value: distribution.rating2 * 100, rawValue: distribution.rating2 },
    { rating: "3 - Uncertain", value: distribution.rating3 * 100, rawValue: distribution.rating3 },
    { rating: "4 - Likely", value: distribution.rating4 * 100, rawValue: distribution.rating4 },
    { rating: "5 - Very Likely", value: distribution.rating5 * 100, rawValue: distribution.rating5 },
  ];

  // Color gradient from red to green
  const colors = ["#ff6b6b", "#ffa07a", "#ffd93d", "#b3ffcb", "#66ff96"];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-neutral-700" />
        <XAxis
          dataKey="rating"
          angle={-45}
          textAnchor="end"
          height={80}
          tick={{ fill: "#6b7280", fontSize: 11 }}
          className="dark:fill-neutral-400"
        />
        <YAxis
          label={{ value: "Probability (%)", angle: -90, position: "insideLeft", fill: "#6b7280" }}
          tick={{ fill: "#6b7280", fontSize: 11 }}
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
