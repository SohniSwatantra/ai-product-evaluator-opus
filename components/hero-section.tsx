"use client";

import { Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section className="text-center py-10 animate-fade-in">
      <h1 className="text-4xl md:text-6xl lg:text-8xl font-bold mb-3 text-black dark:text-white tracking-tight">
        Predict Buying Intent
        <br />
        <span style={{ color: '#66ff96' }}>with AI Precision</span>
      </h1>

      <p className="text-base md:text-xl lg:text-2xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto mb-4 leading-relaxed px-4 md:px-0">
        Analyze any product, service, or SaaS using AI. Works with e-commerce, landing pages,
        apps, and more. Get instant insights on buying probability both Human and AI Agent like ChatGPT.
      </p>

      <div className="flex items-center justify-center flex-wrap gap-3 md:gap-6 text-sm px-4 md:px-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-black dark:bg-white"></div>
          <span className="font-bold px-2 py-1 rounded" style={{ color: '#4d0026', backgroundColor: '#e6e6ff' }}>E-commerce Products</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-black dark:bg-white"></div>
          <span className="font-bold px-2 py-1 rounded" style={{ color: '#4d0026', backgroundColor: '#e6e6ff' }}>SaaS & Apps</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-black dark:bg-white"></div>
          <span className="font-bold px-2 py-1 rounded" style={{ color: '#4d0026', backgroundColor: '#e6e6ff' }}>Services & More</span>
        </div>
      </div>
    </section>
  );
}
