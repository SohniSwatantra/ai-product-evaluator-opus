"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";
import type { EvaluationFactor } from "@/types";

interface FactorRadarChartProps {
  factors: EvaluationFactor[];
}

export function FactorRadarChart({ factors }: FactorRadarChartProps) {
  // Return null if factors is not a valid array
  if (!factors || !Array.isArray(factors) || factors.length === 0) {
    return null;
  }

  // Transform factors for recharts
  const chartData = factors.map((factor) => ({
    factor: factor?.name || "Unknown",
    score: typeof factor?.score === "number" ? factor.score : 0,
    fullMark: 100,
  }));

  // Color based on impact
  const getColor = (impact: string) => {
    switch (impact) {
      case "positive":
        return "#66ff96"; // Green
      case "negative":
        return "#ff6b6b"; // Red
      case "neutral":
        return "#ffd93d"; // Yellow
      default:
        return "#66ff96";
    }
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart data={chartData}>
        <PolarGrid stroke="#e5e7eb" className="dark:stroke-neutral-700" />
        <PolarAngleAxis
          dataKey="factor"
          tick={{ fill: "#6b7280", fontSize: 12 }}
          className="dark:fill-neutral-400"
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fill: "#6b7280", fontSize: 10 }}
        />
        <Radar
          name="Score"
          dataKey="score"
          stroke="#66ff96"
          fill="#66ff96"
          fillOpacity={0.6}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "8px 12px",
          }}
          formatter={(value: number) => [`${value}/100`, "Score"]}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
