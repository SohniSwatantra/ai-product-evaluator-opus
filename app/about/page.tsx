"use client";

import { Navbar } from "@/components/navbar";
import { BackgroundGlow } from "@/components/ui/background-components";
import { ExternalLink, Users, Code, Bot, ArrowRight, Brain, Gauge, FileCode } from "lucide-react";
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

          {/* Definition Card */}
          <div className="p-8 rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <Bot className="w-6 h-6 text-[#4A044E]" />
              <h2 className="text-2xl font-bold text-black dark:text-white">Defining AX</h2>
            </div>
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4">
              Agent Experience (AX) refers to the holistic experience AI agents have when interacting with a product, platform, or system. It encompasses how easily agents can access, understand, and operate within digital environments to achieve user-defined goals.
            </p>
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
              Just as User Experience (UX) focuses on human interactions with a product and Developer Experience (DX) optimizes the experience of building on a platform, AX is about ensuring that AI agents can seamlessly interact with and extend digital products. This includes providing well-structured APIs, machine-readable documentation, and clear operational contexts for AI systems.
            </p>
          </div>

          {/* Methodology Section */}
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
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                        <Bot className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-black dark:text-white">Agent Experience (AX)</h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Machine Readability & ANPS</p>
                      </div>
                    </div>

                    <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                      We treat AI agents (like ChatGPT, Claude, or Perplexity) as a primary user demographic. Our goal is to measure how easily an autonomous agent can access, read, and understand your website to perform tasks on behalf of a human.
                    </p>

                    <div className="mt-6 space-y-4">
                      <h4 className="font-semibold text-black dark:text-white">Agent Net Promoter Score (ANPS) Categories:</h4>
                      
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

                    <div className="mt-6 p-4 rounded-xl bg-neutral-100 dark:bg-neutral-800/50">
                      <h4 className="font-semibold text-black dark:text-white mb-2">Why This Matters</h4>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        When an AI user searches for "products that do X," your AX score determines whether your product is accurately represented and recommended. High AX ensures your product is "visible" to the AI economy.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Origin Section */}
          <div className="p-8 rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-black dark:text-white mb-4">The Origin of AX</h2>
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4">
              In 1993, cognitive psychologist and designer Don Norman coined the term "user experience" (UX), to cover all aspects of a person's experience with a system including industrial design, graphics, the interface, the physical interaction, and documentation.
            </p>
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4">
              As the world became more connected and digital, the role of SDKs turning products into platforms became increasingly important. In 2011, Jeremiah Lee coined the term "developer experience" (DX) to describe the experience for developers of building on top of a platform.
            </p>
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
              In January 2025, Mathias Biilmann, CEO and co-founder of Netlify, introduced the concept of "Agent Experience" (AX) to describe the holistic experience AI agents will have as users of a product or platform. This marked a significant evolution in how we think about designing software in the age of autonomous AI systems.
            </p>
          </div>

          {/* Relationship Section */}
          <div className="p-8 rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-black dark:text-white mb-6">How AX Relates to UX and DX</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold text-black dark:text-white">UX</h3>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Optimizes interactions between humans and digital products, ensuring usability, accessibility, and satisfaction.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-2">
                  <Code className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="font-semibold text-black dark:text-white">DX</h3>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Focuses on making development tools intuitive and efficient, reducing friction for software engineers.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h3 className="font-semibold text-black dark:text-white">AX</h3>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Ensures that delegated AI agents can successfully navigate, interpret, and utilize digital services to effectively serve users.
                </p>
              </div>
            </div>
            <p className="mt-6 text-neutral-700 dark:text-neutral-300 leading-relaxed">
              Given that agents are delegated by users to do tasks, they are now under the umbrella of considerations for UX and DX. AX is a natural extension where services support users that are interacting with them via agents.
            </p>
          </div>

          {/* Why AX Matters */}
          <div className="p-8 rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-black dark:text-white mb-4">Why AX Matters in the Era of AI Agents</h2>
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4">
              The world of digital interactions is undergoing a radical shift. With the rise of artificial intelligence and the increasing sophistication of large language models, we are moving beyond traditional user experiences. Computers are no longer just deterministic machines that execute transactions we ask them to do. They are becoming agents in the world, acting and operating and initiating the execution of transactions themselves.
            </p>
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4">
              In the early years of the web it became clear that, without a website, organizations were not relevant. Then came search engines and the advent of SEO. Without showing up on relevant searches, your site did not seem to exist. Now, we are seeing AI agents become the entry point for the next generation of digital users.
            </p>
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">
              Providing an agent experience will determine relevancy, preference, and adoption in this era. Platforms, tools, or frameworks that are hard for LLMs and agents to use will start feeling less powerful and require more manual intervention. In contrast, tools that are simple for agents to integrate with will quickly become vastly more capable, efficient, and popular.
            </p>
          </div>

          {/* AX in Practice */}
          <div className="p-8 rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-black dark:text-white mb-6">AX in Practice: Real-World Applications</h2>
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-6">
              Companies are already making strides in AX, recognizing agents as a crucial new persona for their software:
            </p>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <h3 className="font-semibold text-black dark:text-white mb-2">Netlify</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Streamlined the deployment process for AI-driven applications, allowing Bolt, ChatGPT, and many more to deploy web projects autonomously. More than 1,000 sites are being created on Netlify directly from ChatGPT every single day.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <h3 className="font-semibold text-black dark:text-white mb-2">Clerk</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Optimizing authentication flows so that AI agents can securely manage access on behalf of users, making it simpler for agents from Bolt, Lovable, or Windsurf to build applications handling authentication.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <h3 className="font-semibold text-black dark:text-white mb-2">Neon</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Tailoring its serverless database infrastructure to be agent-friendly, ensuring AI systems can manage and query databases effectively, positioning it as the default Postgres provider of choice for agentic infrastructure.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <h3 className="font-semibold text-black dark:text-white mb-2">Convex</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Shipped tailor-made documentation for AI codegen tools alongside their documentation for developers, optimizing for both human and agent consumption.
                </p>
              </div>
            </div>
          </div>

          {/* Key Questions */}
          <div className="p-8 rounded-2xl border-2 border-[#4A044E]/20 bg-[#4A044E]/5 dark:bg-[#4A044E]/10 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-black dark:text-white mb-4">Key AX Considerations</h2>
            <ul className="space-y-3 text-neutral-700 dark:text-neutral-300">
              <li className="flex items-start gap-2">
                <ArrowRight className="w-5 h-5 text-[#4A044E] flex-shrink-0 mt-0.5" />
                <span>Is it simple for an Agent to get access to operating a platform on behalf of a user?</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="w-5 h-5 text-[#4A044E] flex-shrink-0 mt-0.5" />
                <span>Are there clean, well-described APIs that agents can operate?</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="w-5 h-5 text-[#4A044E] flex-shrink-0 mt-0.5" />
                <span>Are there machine-ready documentation and context for LLMs and agents to properly use the available platform and SDKs?</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="w-5 h-5 text-[#4A044E] flex-shrink-0 mt-0.5" />
                <span>What would an open approach to AI agents as an audience for your product unlock?</span>
              </li>
            </ul>
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
