import { Navbar } from "@/components/navbar";
import { BackgroundGlow } from "@/components/ui/background-components";
import { ExternalLink, Users, Code, Bot, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
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
