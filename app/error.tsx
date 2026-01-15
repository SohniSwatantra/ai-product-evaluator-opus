"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black p-4">
      <div className="max-w-md w-full p-6 rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
        <h2 className="text-xl font-bold text-red-700 dark:text-red-300 mb-4">
          Something went wrong!
        </h2>
        <p className="text-sm text-red-600 dark:text-red-400 mb-2">
          Error: {error.message}
        </p>
        {error.digest && (
          <p className="text-xs text-red-500 dark:text-red-500 mb-4">
            Digest: {error.digest}
          </p>
        )}
        <pre className="text-xs bg-red-100 dark:bg-red-950 p-3 rounded-lg overflow-auto max-h-40 mb-4">
          {error.stack}
        </pre>
        <button
          onClick={() => reset()}
          className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
