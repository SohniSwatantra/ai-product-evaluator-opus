"use client";

import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from "recharts";
import { getAXScoreColor, getANPSCategory } from "@/lib/ax-evaluator";

interface AXScoreGaugeProps {
  axScore: number;
  anps: number;
}

export function AXScoreGauge({ axScore, anps }: AXScoreGaugeProps) {
  // Ensure valid numbers with defaults
  const safeAxScore = typeof axScore === "number" ? axScore : 0;
  const safeAnps = typeof anps === "number" ? anps : 0;

  const color = getAXScoreColor(safeAxScore);
  const anpsCategory = getANPSCategory(safeAnps);

  const data = [
    {
      name: "AX Score",
      value: safeAxScore,
      fill: color,
    },
  ];

  // Get ANPS color
  const getANPSColor = () => {
    if (anpsCategory === "Promoter") return "#66ff96";
    if (anpsCategory === "Passive") return "#ffd93d";
    return "#ff6b6b";
  };

  const anpsColor = getANPSColor();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
      {/* AX Score Gauge */}
      <div className="flex flex-col items-center w-full sm:w-auto">
        <ResponsiveContainer width="100%" height={180} minWidth={200}>
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="90%"
            barSize={20}
            data={data}
            startAngle={180}
            endAngle={0}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar
              background={{ fill: "#e5e7eb" }}
              className="dark:bg-neutral-700"
              dataKey="value"
              cornerRadius={10}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="text-center -mt-4">
          <div className="text-3xl sm:text-4xl font-bold" style={{ color }}>
            {safeAxScore}/100
          </div>
          <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Agent Experience Score
          </div>
        </div>
      </div>

      {/* ANPS Display */}
      <div className="flex flex-col items-center w-full sm:w-auto">
        <div className="text-center p-4 sm:p-6 rounded-2xl border-2 w-full sm:w-auto" style={{ borderColor: anpsColor, backgroundColor: `${anpsColor}10` }}>
          <div className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-2">
            ANPS (Agent NPS)
          </div>
          <div className="text-3xl sm:text-5xl font-bold" style={{ color: anpsColor }}>
            {safeAnps > 0 ? "+" : ""}{safeAnps}
          </div>
          <div className="text-sm font-semibold mt-2" style={{ color: anpsColor }}>
            {anpsCategory}
          </div>
          <div className="text-[10px] sm:text-xs text-neutral-600 dark:text-neutral-400 mt-2">
            {anpsCategory === "Promoter" && "Agents will recommend this site"}
            {anpsCategory === "Passive" && "Agents are satisfied but neutral"}
            {anpsCategory === "Detractor" && "Agents face difficulties"}
          </div>
        </div>
      </div>
    </div>
  );
}
