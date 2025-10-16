"use client";

import { type Demographics } from "@/types";
import { cn } from "@/lib/utils";
import { Users, DollarSign, Globe, User } from "lucide-react";

interface DemographicsFormProps {
  demographics: Demographics;
  onChange: (demographics: Demographics) => void;
  disabled?: boolean;
}

export function DemographicsForm({ demographics, onChange, disabled }: DemographicsFormProps) {
  const handleChange = (field: keyof Demographics, value: string) => {
    onChange({
      ...demographics,
      [field]: value,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-black dark:text-white" />
        <h3 className="text-lg font-semibold text-black dark:text-white">
          Target Audience Demographics
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Age Range */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Age Range <span className="text-red-500">*</span>
          </label>
          <select
            value={demographics.ageRange}
            onChange={(e) => handleChange("ageRange", e.target.value)}
            disabled={disabled}
            className={cn(
              "w-full px-4 py-3 rounded-lg",
              "border-2 border-black/10 dark:border-white/10",
              "bg-white dark:bg-neutral-900",
              "text-black dark:text-white",
              "focus:border-black dark:focus:border-white focus:outline-none",
              "transition-all",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <option value="">Select age range</option>
            <option value="18-24">18-24 years</option>
            <option value="25-34">25-34 years</option>
            <option value="35-44">35-44 years</option>
            <option value="45-54">45-54 years</option>
            <option value="55+">55+ years</option>
          </select>
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Gender <span className="text-red-500">*</span>
          </label>
          <select
            value={demographics.gender}
            onChange={(e) => handleChange("gender", e.target.value)}
            disabled={disabled}
            className={cn(
              "w-full px-4 py-3 rounded-lg",
              "border-2 border-black/10 dark:border-white/10",
              "bg-white dark:bg-neutral-900",
              "text-black dark:text-white",
              "focus:border-black dark:focus:border-white focus:outline-none",
              "transition-all",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="non-binary">Non-binary</option>
            <option value="all">All genders</option>
          </select>
        </div>

        {/* Income Tier */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Income Level <span className="text-red-500">*</span>
          </label>
          <select
            value={demographics.incomeTier}
            onChange={(e) => handleChange("incomeTier", e.target.value)}
            disabled={disabled}
            className={cn(
              "w-full px-4 py-3 rounded-lg",
              "border-2 border-black/10 dark:border-white/10",
              "bg-white dark:bg-neutral-900",
              "text-black dark:text-white",
              "focus:border-black dark:focus:border-white focus:outline-none",
              "transition-all",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <option value="">Select income level</option>
            <option value="low">Low (&lt;$50k/year)</option>
            <option value="medium">Medium ($50k-$100k/year)</option>
            <option value="high">High (&gt;$100k/year)</option>
          </select>
        </div>

        {/* Region */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Region <span className="text-red-500">*</span>
          </label>
          <select
            value={demographics.region}
            onChange={(e) => handleChange("region", e.target.value)}
            disabled={disabled}
            className={cn(
              "w-full px-4 py-3 rounded-lg",
              "border-2 border-black/10 dark:border-white/10",
              "bg-white dark:bg-neutral-900",
              "text-black dark:text-white",
              "focus:border-black dark:focus:border-white focus:outline-none",
              "transition-all",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <option value="">Select region</option>
            <option value="north-america">North America</option>
            <option value="europe">Europe</option>
            <option value="asia">Asia</option>
            <option value="latin-america">Latin America</option>
            <option value="africa">Africa</option>
            <option value="oceania">Oceania</option>
          </select>
        </div>

        {/* Ethnicity (Optional) */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-2">
            <User className="w-4 h-4" />
            Ethnicity <span className="text-neutral-400 text-xs">(Optional)</span>
          </label>
          <input
            type="text"
            value={demographics.ethnicity || ""}
            onChange={(e) => handleChange("ethnicity", e.target.value)}
            disabled={disabled}
            placeholder="e.g., Hispanic, Asian, African American, etc."
            className={cn(
              "w-full px-4 py-3 rounded-lg",
              "border-2 border-black/10 dark:border-white/10",
              "bg-white dark:bg-neutral-900",
              "text-black dark:text-white placeholder:text-neutral-400",
              "focus:border-black dark:focus:border-white focus:outline-none",
              "transition-all",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          />
        </div>
      </div>

      <div className="mt-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-900 dark:text-blue-200">
          <span className="font-semibold">Why demographics?</span> Research shows that buying intent varies significantly based on age, gender, income, and region. This helps us provide accurate predictions for YOUR specific target audience.
        </p>
      </div>
    </div>
  );
}
