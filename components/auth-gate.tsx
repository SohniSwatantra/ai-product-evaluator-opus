"use client";

import { X, Lock, TrendingUp, BarChart3, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthGateProps {
  onClose?: () => void;
  showCloseButton?: boolean;
}

export function AuthGate({ onClose, showCloseButton = false }: AuthGateProps) {
  const features = [
    {
      icon: <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
      title: "Complete Analysis",
      description: "Access full SSR distribution and confidence metrics"
    },
    {
      icon: <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
      title: "Advanced Charts",
      description: "View detailed anchor similarity and factor breakdowns"
    },
    {
      icon: <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
      title: "Recommendations",
      description: "Get actionable insights to improve your product"
    }
  ];

  return (
    <div className="sticky top-8 z-40 my-8 flex items-center justify-center animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg mx-auto bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border-2 border-blue-500 dark:border-blue-600 overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Close button - optional */}
        {showCloseButton && onClose && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors z-10"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
          </button>
        )}

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 px-4 py-4 text-center">
          <div className="flex justify-center mb-2">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-neutral-900 flex items-center justify-center">
              <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-white mb-1">
            Unlock Full Report
          </h2>
          <p className="text-blue-100 dark:text-blue-200 text-sm">
            Sign up or log in to access complete evaluation insights
          </p>
        </div>

        {/* Body */}
        <div className="px-4 py-4">
          {/* Features Grid */}
          <div className="grid grid-cols-1 gap-2 mb-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-black dark:text-white mb-0.5">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="space-y-2">
            <a
              href="/handler/sign-up"
              className={cn(
                "flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg",
                "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
                "text-white font-semibold text-base shadow-lg hover:shadow-xl",
                "transition-all duration-200 transform hover:scale-[1.02]"
              )}
            >
              Sign Up - It's Free
            </a>
            <a
              href="/handler/sign-in"
              className={cn(
                "flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg",
                "bg-black dark:bg-white",
                "hover:opacity-90",
                "text-white dark:text-black font-semibold text-base",
                "transition-all duration-200"
              )}
            >
              Log In
            </a>
          </div>

          {/* Footer Note */}
          <div className="mt-3 text-center">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Your evaluation will be saved to your account
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
