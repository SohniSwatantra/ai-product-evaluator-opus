"use client";

import { Navbar } from "@/components/navbar";
import { BackgroundGlow } from "@/components/ui/background-components";
import { ExternalLink, Users, Code, Bot, ArrowRight, Brain, Gauge } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState<"factor" | "ssr" | "ax">("factor");

  return (
    <BackgroundGlow>
      <Navbar />
      <main className="container mx-auto px-6 pt-32 pb-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-4">
              What is Agent Experience?
            </h1>
            <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              Understanding the new frontier of software design in the age of AI agents
            </p>
          </div>

          {/* Methodology Section - NOW AT TOP */}
          <div className="p-8 rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-black dark:text-white mb-6">Our Analysis Methodology</h2>

            {/* Tabs Navigation */}
            <div className="flex flex-wrap gap-2 mb-8 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-lg">
              <button
                onClick={() => setActiveTab("factor")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  activeTab === "factor"
                    ? "bg-white dark:bg-neutral-800 text-black dark:text-white shadow-sm"
                    : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                }`}
              >
                Factor-Based
              </button>
              <button
                onClick={() => setActiveTab("ssr")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  activeTab === "ssr"
                    ? "bg-white dark:bg-neutral-800 text-black dark:text-white shadow-sm"
                    : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                }`}
              >
                SSR Analysis
              </button>
              <button
                onClick={() => setActiveTab("ax")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  activeTab === "ax"
                    ? "bg-white dark:bg-neutral-800 text-black dark:text-white shadow-sm"
                    : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                }`}
              >
                Agent Experience
              </button>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
              <AnimatePresence mode="wait">
                {activeTab === "factor" && (
                  <motion.div
                    key="factor"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <Gauge className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-black dark:text-white">Factor-Based Evaluation</h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Standardized Technical Assessment</p>
                      </div>
                    </div>

                    <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                      Our factor-based methodology uses a traditional analytical framework where an AI model evaluates your product page against specific, industry-standard criteria. We use automated tools to extract text, metadata, and visual elements from your site to perform this analysis.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                        <h4 className="font-semibold text-black dark:text-white mb-2">Technical Foundations</h4>
                        <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                          <li className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span><strong>Structured Data:</strong> Checks for Schema.org markup and JSON-LD</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span><strong>Semantic HTML:</strong> Evaluates header hierarchy and semantic tags</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span><strong>Meta Tags:</strong> Analyzes clarity of titles and descriptions</span>
                          </li>
                        </ul>
                      </div>
                      <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                        <h4 className="font-semibold text-black dark:text-white mb-2">Content & Accessibility</h4>
                        <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                          <li className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span><strong>Content Clarity:</strong> Measures value proposition understanding</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span><strong>API Availability:</strong> Checks for programmatic access</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span><strong>Bot Accessibility:</strong> Reviews robots.txt and sitemaps</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "ssr" && (
                  <motion.div
                    key="ssr"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-black dark:text-white">SSR Methodology</h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Semantic Similarity Ratio</p>
                      </div>
                    </div>

                    <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                      This is a novel, scientific approach designed to predict human purchase intent by measuring the "semantic distance" between a generated response and standardized reference points.
                    </p>

                    <div className="space-y-4 mt-6">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center font-bold text-purple-600">1</div>
                        <div>
                          <h4 className="font-semibold text-black dark:text-white">Response Generation</h4>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                            An AI persona simulates a user and generates a natural language response regarding their intent to purchase the product.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center font-bold text-purple-600">2</div>
                        <div>
                          <h4 className="font-semibold text-black dark:text-white">Vector Analysis</h4>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                            The response is converted into high-dimensional vector embeddings to capture deep semantic meaning beyond simple keyword matching.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center font-bold text-purple-600">3</div>
                        <div>
                          <h4 className="font-semibold text-black dark:text-white">Anchor Comparison</h4>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                            We calculate the cosine similarity between the response and 15 standardized "anchor" statements ranging from "Strongly Disagree" to "Strongly Agree" to map the sentiment onto a quantitative scale.
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "ax" && (
                  <motion.div
                    key="ax"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-8 max-h-[600px] overflow-y-auto pr-2"
                  >
                    {/* AX Header */}
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                        <Bot className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-black dark:text-white">Agent Experience (AX)</h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Machine Readability & ANPS</p>
                      </div>
                    </div>

                    {/* Defining AX */}
                    <div>
                      <h4 className="font-semibold text-black dark:text-white mb-2">What is Agent Experience?</h4>
                      <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-3">
                        Agent Experience (AX) refers to the holistic experience AI agents have when interacting with a product, platform, or system. It encompasses how easily agents can access, understand, and operate within digital environments to achieve user-defined goals.
                      </p>
                      <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                        Just as User Experience (UX) focuses on human interactions with a product and Developer Experience (DX) optimizes the experience of building on a platform, AX is about ensuring that AI agents can seamlessly interact with and extend digital products. This includes providing well-structured APIs, machine-readable documentation, and clear operational contexts for AI systems.
                      </p>
                    </div>

                    {/* ANPS Categories */}
                    <div>
                      <h4 className="font-semibold text-black dark:text-white mb-3">Agent Net Promoter Score (ANPS) Categories:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                          <div className="font-bold text-green-700 dark:text-green-400 mb-1">Promoter</div>
                          <div className="text-xs font-mono text-green-600/70 mb-2">Score 75-100</div>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400">
                            Highly optimized for agents. Clear APIs, perfect structured data. Agents can easily recommend and use this product.
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                          <div className="font-bold text-yellow-700 dark:text-yellow-400 mb-1">Passive</div>
                          <div className="text-xs font-mono text-yellow-600/70 mb-2">Score 50-74</div>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400">
                            Readable but not optimized. Agents can access basic information but may struggle with complex interactions.
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                          <div className="font-bold text-red-700 dark:text-red-400 mb-1">Detractor</div>
                          <div className="text-xs font-mono text-red-600/70 mb-2">Score 0-49</div>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400">
                            Difficult or impossible for agents to parse. Unstructured data or technical blocks prevent agent access.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* The Origin of AX */}
                    <div>
                      <h4 className="font-semibold text-black dark:text-white mb-2">The Origin of AX</h4>
                      <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed mb-2">
                        In 1993, cognitive psychologist and designer Don Norman coined the term "user experience" (UX). In 2011, Jeremiah Lee coined "developer experience" (DX) to describe the experience for developers building on platforms.
                      </p>
                      <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                        In January 2025, Mathias Biilmann, CEO and co-founder of Netlify, introduced "Agent Experience" (AX) to describe the holistic experience AI agents will have as users of a product or platform.
                      </p>
                    </div>

                    {/* How AX Relates to UX and DX */}
                    <div>
                      <h4 className="font-semibold text-black dark:text-white mb-3">How AX Relates to UX and DX</h4>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-1 mb-1">
                            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="font-semibold text-sm text-black dark:text-white">UX</span>
                          </div>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400">Human-product interactions</p>
                        </div>
                        <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                          <div className="flex items-center gap-1 mb-1">
                            <Code className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            <span className="font-semibold text-sm text-black dark:text-white">DX</span>
                          </div>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400">Developer tools & APIs</p>
                        </div>
                        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-1 mb-1">
                            <Bot className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="font-semibold text-sm text-black dark:text-white">AX</span>
                          </div>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400">AI agent interactions</p>
                        </div>
                      </div>
                    </div>

                    {/* Why AX Matters */}
                    <div>
                      <h4 className="font-semibold text-black dark:text-white mb-2">Why AX Matters</h4>
                      <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed mb-2">
                        AI agents are becoming the entry point for the next generation of digital users. Without a good AX, your product may not be "visible" to the AI economy.
                      </p>
                      <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">
                        Platforms that are hard for LLMs and agents to use will require more manual intervention. Tools that are simple for agents to integrate with will become vastly more capable and popular.
                      </p>
                    </div>

                    {/* AX in Practice */}
                    <div>
                      <h4 className="font-semibold text-black dark:text-white mb-3">AX in Practice</h4>
                      <div className="space-y-2">
                        <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                          <span className="font-semibold text-sm text-black dark:text-white">Netlify:</span>
                          <span className="text-xs text-neutral-600 dark:text-neutral-400 ml-2">1,000+ sites created daily from ChatGPT</span>
                        </div>
                        <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                          <span className="font-semibold text-sm text-black dark:text-white">Clerk:</span>
                          <span className="text-xs text-neutral-600 dark:text-neutral-400 ml-2">AI-friendly authentication flows</span>
                        </div>
                        <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                          <span className="font-semibold text-sm text-black dark:text-white">Neon:</span>
                          <span className="text-xs text-neutral-600 dark:text-neutral-400 ml-2">Agent-friendly serverless Postgres</span>
                        </div>
                        <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                          <span className="font-semibold text-sm text-black dark:text-white">Convex:</span>
                          <span className="text-xs text-neutral-600 dark:text-neutral-400 ml-2">AI-optimized documentation</span>
                        </div>
                      </div>
                    </div>

                    {/* Key Considerations */}
                    <div className="p-4 rounded-xl border-2 border-[#4A044E]/20 bg-[#4A044E]/5 dark:bg-[#4A044E]/10">
                      <h4 className="font-semibold text-black dark:text-white mb-2">Key AX Considerations</h4>
                      <ul className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
                        <li className="flex items-start gap-2">
                          <ArrowRight className="w-4 h-4 text-[#4A044E] flex-shrink-0 mt-0.5" />
                          <span>Is it simple for an Agent to operate on behalf of a user?</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ArrowRight className="w-4 h-4 text-[#4A044E] flex-shrink-0 mt-0.5" />
                          <span>Are there clean, well-described APIs?</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ArrowRight className="w-4 h-4 text-[#4A044E] flex-shrink-0 mt-0.5" />
                          <span>Is documentation machine-ready for LLMs?</span>
                        </li>
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* CTA Section */}
          <div className="p-8 rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-sm text-center">
            <h2 className="text-2xl font-bold text-black dark:text-white mb-4">Learn More About Agent Experience</h2>
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-6">
              AX is a substantial, industry-level opportunity that requires an open, collaborative approach to achieve. Netlify has helped define AX and bring together industry collaborators to pave a path forward.
            </p>
            <a
              href="https://agentexperience.ax/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#4A044E] text-white font-semibold hover:bg-[#3A0340] transition-colors"
            >
              <span>Visit agentexperience.ax</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Back to Home */}
          <div className="text-center">
            <Link
              href="/"
              className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    </BackgroundGlow>
  );
}
