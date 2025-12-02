"use client";

import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from "recharts";

interface MethodologyGaugesProps {
  factorScore: number;
  ssrScore: number;
  agreement: "high" | "medium" | "low";
}

export function MethodologyGauges({ factorScore, ssrScore, agreement }: MethodologyGaugesProps) {
  // Color based on agreement
  const getAgreementColor = () => {
    switch (agreement) {
      case "high":
        return "#66ff96"; // Green
      case "medium":
        return "#ffd93d"; // Yellow
      case "low":
        return "#ff6b6b"; // Red
      default:
        return "#66ff96";
    }
  };

  const agreementColor = getAgreementColor();

  // Data for factor-based gauge
  const factorData = [
    {
      name: "Factor Score",
      value: factorScore,
      fill: agreementColor,
    },
  ];

  // Data for SSR gauge
  const ssrData = [
    {
      name: "SSR Score",
      value: ssrScore,
      fill: agreementColor,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
      {/* Factor-Based Score Gauge */}
      <div className="flex flex-col items-center">
        <ResponsiveContainer width="100%" height={160}>
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="90%"
            barSize={20}
            data={factorData}
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
        <div className="text-center mt-1 sm:mt-2">
          <div className="text-2xl sm:text-3xl font-bold" style={{ color: agreementColor }}>
            {factorScore}%
          </div>
          <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Factor-Based Score
          </div>
          <div className="text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-500 mt-1">
            Paper 1: Weighted Factors
          </div>
        </div>
      </div>

      {/* SSR Score Gauge */}
      <div className="flex flex-col items-center">
        <ResponsiveContainer width="100%" height={160}>
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="90%"
            barSize={20}
            data={ssrData}
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
        <div className="text-center mt-1 sm:mt-2">
          <div className="text-2xl sm:text-3xl font-bold" style={{ color: agreementColor }}>
            {ssrScore}%
          </div>
          <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            SSR Score
          </div>
          <div className="text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-500 mt-1">
            Paper 2: Semantic Similarity
          </div>
        </div>
      </div>

      {/* Agreement Indicator */}
      <div className="col-span-1 sm:col-span-2 text-center">
        <div
          className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold"
          style={{
            backgroundColor: `${agreementColor}20`,
            color: agreementColor,
            border: `2px solid ${agreementColor}`,
          }}
        >
          {agreement.toUpperCase()} Agreement: {Math.abs(factorScore - ssrScore).toFixed(0)} pt diff
        </div>
      </div>
    </div>
  );
}
