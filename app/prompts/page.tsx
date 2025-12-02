"use client";

import { Navbar } from "@/components/navbar";
import { BackgroundGlow } from "@/components/ui/background-components";
import {
  Layout,
  Users,
  Star,
  DollarSign,
  Shield,
  HelpCircle,
  MousePointer,
  Code,
  FileText,
  Globe,
  Bot,
  Target,
  CheckCircle,
  XCircle,
  Copy,
  Check
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-3 right-3 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-400" />
      ) : (
        <Copy className="w-4 h-4 text-neutral-400" />
      )}
    </button>
  );
}

function CodeBlock({ code, language = "json" }: { code: string; language?: string }) {
  return (
    <div className="relative">
      <CopyButton text={code} />
      <pre className="bg-neutral-900 border border-white/10 rounded-xl p-4 overflow-x-auto text-sm">
        <code className="text-neutral-300">{code}</code>
      </pre>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
  id
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="scroll-mt-32">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-purple-500/20">
          <Icon className="w-5 h-5 text-purple-400" />
        </div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
      </div>
      <div className="space-y-4 text-neutral-300">
        {children}
      </div>
    </section>
  );
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <CheckCircle className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
      <span>{children}</span>
    </li>
  );
}

function XItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <XCircle className="w-4 h-4 text-red-400 mt-1 flex-shrink-0" />
      <span>{children}</span>
    </li>
  );
}

export default function PromptsPage() {
  const schemaExample = `{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Your Product Name",
  "description": "Clear 1-2 sentence description",
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "USD",
    "lowPrice": "0",
    "highPrice": "99",
    "offerCount": "3"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "3077"
  }
}`;

  const metaTagsExample = `<title>Benefit-Focused Title | Your Brand</title>
<meta name="description" content="Clear service description in 150-160 chars with primary keyword">

<!-- Open Graph -->
<meta property="og:title" content="...">
<meta property="og:description" content="...">
<meta property="og:image" content="high-quality-preview-image.jpg">
<meta property="og:type" content="website">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="...">
<meta name="twitter:description" content="...">
<meta name="twitter:image" content="...">`;

  const tableOfContents = [
    { id: "hero", label: "1. Hero Section" },
    { id: "social-proof", label: "2. Social Proof" },
    { id: "features", label: "3. Features/Benefits" },
    { id: "trust", label: "4. Trust & Security" },
    { id: "pricing", label: "5. Pricing" },
    { id: "faq", label: "6. FAQ Section" },
    { id: "cta", label: "7. Final CTA" },
    { id: "technical", label: "Technical Requirements" },
    { id: "demographics", label: "Demographic Optimization" },
    { id: "checklist", label: "Final Checklist" },
  ];

  return (
    <BackgroundGlow>
      <Navbar />
      <main className="container mx-auto px-6 pt-32 pb-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 text-purple-300 text-sm mb-4">
              <Target className="w-4 h-4" />
              <span>Website Building Guide</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Build a High-Converting Website
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                That Scores 75+
              </span>
            </h1>
            <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
              Based on analysis of the highest-scoring websites (HeadshotPro: 78/100, Netlify: 78/100)
              in our database, here&apos;s a comprehensive guide to building websites that convert.
            </p>
          </div>

          {/* Table of Contents */}
          <div className="p-6 rounded-2xl border border-white/10 bg-black/50 mb-12">
            <h3 className="text-lg font-semibold text-white mb-4">Table of Contents</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {tableOfContents.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="text-sm text-neutral-400 hover:text-purple-400 transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-12">
            {/* Section 1: Hero */}
            <Section icon={Layout} title="1. Hero Section (Above the Fold)" id="hero">
              <p className="text-neutral-400 mb-4">The first 800px is critical. Make every pixel count.</p>

              <div className="space-y-3 bg-neutral-900/50 rounded-xl p-5 border border-white/5">
                <div>
                  <h4 className="font-semibold text-white mb-1">Clear Value Proposition</h4>
                  <p className="text-sm text-neutral-400">State EXACTLY what you do in 10 words or less</p>
                  <p className="text-sm text-green-400 mt-1">Example: &quot;Professional AI Headshots in 2 Hours&quot;</p>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-1">Immediate Benefit Statement</h4>
                  <p className="text-sm text-neutral-400">Follow with one sentence explaining the core benefit</p>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-1">Primary CTA</h4>
                  <p className="text-sm text-neutral-400">Single, prominent call-to-action button (contrasting color, 48px+ height for mobile)</p>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-1">Trust Indicator</h4>
                  <p className="text-sm text-neutral-400">Add ONE high-impact trust element</p>
                  <p className="text-sm text-green-400 mt-1">Example: &quot;196,987+ customers&quot; or &quot;Used by Fortune 500 companies&quot;</p>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-1">Visual</h4>
                  <p className="text-sm text-neutral-400">Show the product/service in action (screenshot, demo video, or before/after)</p>
                </div>
              </div>
            </Section>

            {/* Section 2: Social Proof */}
            <Section icon={Users} title="2. Social Proof Section" id="social-proof">
              <p className="text-neutral-400 mb-4">Must appear within first 2 screens. Include AT LEAST 3 of these:</p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-neutral-900/50 rounded-xl p-4 border border-white/5">
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    Star Rating + Review Count
                  </h4>
                  <p className="text-sm text-neutral-400">&quot;4.8/5 from 3,077 reviews&quot; prominently displayed</p>
                </div>

                <div className="bg-neutral-900/50 rounded-xl p-4 border border-white/5">
                  <h4 className="font-semibold text-white mb-2">Customer Logos</h4>
                  <p className="text-sm text-neutral-400">6-12 recognizable company logos (Fortune 500 if possible)</p>
                </div>

                <div className="bg-neutral-900/50 rounded-xl p-4 border border-white/5">
                  <h4 className="font-semibold text-white mb-2">Testimonials</h4>
                  <p className="text-sm text-neutral-400">2-3 specific quotes with real names, titles, and specific results achieved</p>
                  <p className="text-sm text-green-400 mt-1">&quot;Saved 8 hours&quot; not just &quot;Love it!&quot;</p>
                </div>

                <div className="bg-neutral-900/50 rounded-xl p-4 border border-white/5">
                  <h4 className="font-semibold text-white mb-2">Usage Statistics</h4>
                  <p className="text-sm text-neutral-400">&quot;17.9M+ headshots created&quot; or &quot;Millions of users&quot;</p>
                </div>
              </div>
            </Section>

            {/* Section 3: Features */}
            <Section icon={Star} title="3. Features/Benefits Section" id="features">
              <p className="text-neutral-400 mb-4">Present 3-6 key features with this structure:</p>

              <ul className="space-y-2">
                <CheckItem><strong>Icon or Visual</strong> representing the feature</CheckItem>
                <CheckItem><strong>Benefit-Focused Heading:</strong> &quot;8x Cheaper Than a Photographer&quot; not &quot;Cost Effective&quot;</CheckItem>
                <CheckItem><strong>Demographic-Specific Copy:</strong> Tailor language to your target age/income</CheckItem>
                <CheckItem><strong>Quantifiable Metrics:</strong> Include numbers wherever possible</CheckItem>
              </ul>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mt-4">
                <p className="text-sm text-amber-300">
                  <strong>Pro tip:</strong> For 35-44 high-income audiences, emphasize time savings and ROI over just cost.
                </p>
              </div>
            </Section>

            {/* Section 4: Trust */}
            <Section icon={Shield} title="4. Trust & Security Signals" id="trust">
              <p className="text-neutral-400 mb-4">Must prominently display:</p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-neutral-900/50 rounded-xl p-4 border border-white/5">
                  <h4 className="font-semibold text-green-400 mb-2">Money-Back Guarantee</h4>
                  <p className="text-sm text-neutral-400">14-30 day guarantee with clear terms</p>
                </div>

                <div className="bg-neutral-900/50 rounded-xl p-4 border border-white/5">
                  <h4 className="font-semibold text-green-400 mb-2">Security Badges</h4>
                  <p className="text-sm text-neutral-400">SOC 2, GDPR, ISO certifications (if applicable)</p>
                </div>

                <div className="bg-neutral-900/50 rounded-xl p-4 border border-white/5">
                  <h4 className="font-semibold text-green-400 mb-2">Privacy Statement</h4>
                  <p className="text-sm text-neutral-400">&quot;We respect your privacy&quot; with link to detailed policy</p>
                </div>

                <div className="bg-neutral-900/50 rounded-xl p-4 border border-white/5">
                  <h4 className="font-semibold text-green-400 mb-2">Payment Security</h4>
                  <p className="text-sm text-neutral-400">Display secure payment icons</p>
                </div>
              </div>
            </Section>

            {/* Section 5: Pricing */}
            <Section icon={DollarSign} title="5. Pricing Section" id="pricing">
              <ul className="space-y-2">
                <CheckItem><strong>Transparent Pricing:</strong> Show at least 2-3 tiers OR clearly state &quot;Free tier that actually works&quot;</CheckItem>
                <CheckItem><strong>Value Emphasis:</strong> Compare to alternatives (&quot;8x cheaper than traditional service&quot;)</CheckItem>
                <CheckItem><strong>No Hidden Fees:</strong> Explicitly state &quot;No surprise bills&quot; or &quot;All-inclusive pricing&quot;</CheckItem>
                <CheckItem><strong>Business-Friendly:</strong> Mention expense-ready invoices, team discounts, or enterprise options</CheckItem>
                <CheckItem><strong>Clear Differentiators:</strong> Show what&apos;s included in each tier</CheckItem>
              </ul>
            </Section>

            {/* Section 6: FAQ */}
            <Section icon={HelpCircle} title="6. FAQ Section" id="faq">
              <ul className="space-y-2">
                <CheckItem>Minimum <strong>6-8 common questions</strong></CheckItem>
                <CheckItem>Use structured <strong>Schema.org FAQ markup</strong> (JSON-LD)</CheckItem>
                <CheckItem>Address objections specific to your demographic</CheckItem>
                <CheckItem>Include questions about: <strong>pricing, how it works, security, refunds, turnaround time</strong></CheckItem>
              </ul>
            </Section>

            {/* Section 7: Final CTA */}
            <Section icon={MousePointer} title="7. Final CTA Section" id="cta">
              <ul className="space-y-2">
                <CheckItem>Repeat primary CTA with slightly different copy</CheckItem>
                <CheckItem>Add urgency (but authentic, not fake countdown timers)</CheckItem>
                <CheckItem>Reduce friction: &quot;No credit card required&quot; or &quot;Start free trial&quot;</CheckItem>
                <CheckItem>Show next step clearly: &quot;Get your headshots&quot; → &quot;Upload photos&quot; → &quot;Receive 120 headshots in 2 hours&quot;</CheckItem>
              </ul>
            </Section>

            {/* Technical Requirements */}
            <div className="border-t border-white/10 pt-12">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20">
                  <Code className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Technical Requirements</h2>
                  <p className="text-neutral-400">For High Agent Experience Score (AX Score 80+)</p>
                </div>
              </div>

              <div className="space-y-8" id="technical">
                {/* Structured Data */}
                <div className="bg-neutral-900/50 rounded-2xl p-6 border border-white/5">
                  <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-400" />
                    Structured Data (Critical - Adds 15-20 Points)
                  </h3>
                  <p className="text-neutral-400 mb-4">Implement these Schema.org types in JSON-LD:</p>
                  <CodeBlock code={schemaExample} />

                  <div className="mt-4 text-sm text-neutral-400">
                    <p className="font-semibold text-white mb-2">Also add:</p>
                    <ul className="space-y-1">
                      <li>• FAQPage schema for FAQ section</li>
                      <li>• Organization schema with logo, social links</li>
                      <li>• Review schema for testimonials</li>
                      <li>• ImageObject schema for product screenshots</li>
                    </ul>
                  </div>
                </div>

                {/* Meta Tags */}
                <div className="bg-neutral-900/50 rounded-2xl p-6 border border-white/5">
                  <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-400" />
                    Meta Tags (Critical - Adds 10-15 Points)
                  </h3>
                  <CodeBlock code={metaTagsExample} language="html" />
                </div>

                {/* Semantic HTML */}
                <div className="bg-neutral-900/50 rounded-2xl p-6 border border-white/5">
                  <h3 className="text-lg font-semibold text-white mb-2">Semantic HTML (Adds 10 Points)</h3>
                  <ul className="space-y-2 text-sm text-neutral-400">
                    <li>• Use proper heading hierarchy: <strong className="text-white">ONE H1</strong> (value prop), logical H2/H3 structure</li>
                    <li>• <code className="bg-neutral-800 px-1 rounded">&lt;nav&gt;</code> for navigation</li>
                    <li>• <code className="bg-neutral-800 px-1 rounded">&lt;main&gt;</code> for primary content</li>
                    <li>• <code className="bg-neutral-800 px-1 rounded">&lt;article&gt;</code> for blog posts/testimonials</li>
                    <li>• <code className="bg-neutral-800 px-1 rounded">&lt;section&gt;</code> for distinct content areas</li>
                    <li>• <strong className="text-white">Alt text on ALL images</strong></li>
                  </ul>
                </div>

                {/* Agent-Friendly Features */}
                <div className="bg-neutral-900/50 rounded-2xl p-6 border border-white/5">
                  <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                    <Bot className="w-5 h-5 text-green-400" />
                    Agent-Friendly Features (Adds 20+ Points)
                  </h3>
                  <ul className="space-y-2 text-sm text-neutral-400">
                    <li>• <strong className="text-white">sitemap.xml:</strong> Comprehensive, updated monthly</li>
                    <li>• <strong className="text-white">robots.txt:</strong> Permit crawling, link to sitemap</li>
                    <li>• <strong className="text-white">API Documentation Page:</strong> Even if no public API, create /api or /for-developers explaining capabilities</li>
                    <li>• <strong className="text-white">RSS/Atom Feed:</strong> For blog or updates</li>
                    <li>• <strong className="text-white">Contact Forms:</strong> With clear labels and validation</li>
                    <li>• <strong className="text-white">FAQ Schema Markup:</strong> Makes Q&A machine-readable</li>
                    <li>• <strong className="text-white">/for-agents page (Advanced):</strong> Create a dedicated page with structured JSON about your service</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Demographic Optimization */}
            <div className="border-t border-white/10 pt-12" id="demographics">
              <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                <Target className="w-6 h-6 text-pink-400" />
                Demographic Optimization
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-purple-500/20">
                  <h3 className="text-lg font-semibold text-white mb-4">High-Income (&gt;$100k) Ages 35-44</h3>
                  <p className="text-sm text-neutral-400 mb-3">Like HeadshotPro</p>
                  <ul className="space-y-2 text-sm text-neutral-300">
                    <li><strong className="text-purple-300">Emphasize:</strong> Time savings, ROI, professional credibility, enterprise features</li>
                    <li><strong className="text-purple-300">Language:</strong> Professional, data-driven, benefit-focused</li>
                    <li><strong className="text-purple-300">Trust signals:</strong> Company logos, executive testimonials, security certifications</li>
                    <li><strong className="text-purple-300">Features:</strong> Team packages, expense-ready invoices, integrations</li>
                    <li><strong className="text-purple-300">CTA style:</strong> &quot;Get Started&quot; &gt; &quot;Try Now&quot;, &quot;Book Demo&quot; &gt; &quot;Sign Up&quot;</li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl p-6 border border-blue-500/20">
                  <h3 className="text-lg font-semibold text-white mb-4">Tech-Savvy Developers Ages 25-44</h3>
                  <p className="text-sm text-neutral-400 mb-3">Like Netlify</p>
                  <ul className="space-y-2 text-sm text-neutral-300">
                    <li><strong className="text-blue-300">Emphasize:</strong> Speed, simplicity, modern tech stack, integrations</li>
                    <li><strong className="text-blue-300">Language:</strong> Technical but not jargony, show code examples</li>
                    <li><strong className="text-blue-300">Trust signals:</strong> GitHub stars, tech partnerships, developer testimonials</li>
                    <li><strong className="text-blue-300">Features:</strong> API access, CLI tools, Git integration, documentation quality</li>
                    <li><strong className="text-blue-300">CTA style:</strong> &quot;Deploy Now&quot;, &quot;Start Building&quot;, include free tier prominently</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Critical Success Factors */}
            <div className="border-t border-white/10 pt-12">
              <h2 className="text-2xl font-bold text-white mb-8">Critical Success Factors</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-500/10 rounded-2xl p-6 border border-green-500/20">
                  <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    What Makes Websites Score 75+
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <CheckItem><strong>Positioning Score 80+:</strong> Crystal-clear target audience with tailored messaging</CheckItem>
                    <CheckItem><strong>Social Proof Score 80+:</strong> Reviews/ratings + customer count + company logos</CheckItem>
                    <CheckItem><strong>Pricing Score 75+:</strong> Transparent pricing with value comparison</CheckItem>
                    <CheckItem><strong>Trust Signals Score 75+:</strong> Guarantees + security badges + privacy statements</CheckItem>
                    <CheckItem><strong>AX Score 80+:</strong> Complete Schema markup + API docs + semantic HTML</CheckItem>
                  </ul>
                </div>

                <div className="bg-red-500/10 rounded-2xl p-6 border border-red-500/20">
                  <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    What Hurts Scores
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <XItem><strong>Vague Value Propositions:</strong> &quot;Transform your business&quot; vs. specific outcomes</XItem>
                    <XItem><strong>Hidden Pricing:</strong> &quot;Contact us for pricing&quot; vs. showing tiers</XItem>
                    <XItem><strong>Missing Social Proof:</strong> No reviews, ratings, or customer logos</XItem>
                    <XItem><strong>Poor Technical Implementation:</strong> Missing Schema.org markup, weak meta tags</XItem>
                    <XItem><strong>Aggressive Marketing:</strong> Fake urgency, excessive popups</XItem>
                    <XItem><strong>No Security Signals:</strong> Missing guarantees, certifications</XItem>
                  </ul>
                </div>
              </div>
            </div>

            {/* Final Checklist */}
            <div className="border-t border-white/10 pt-12" id="checklist">
              <h2 className="text-2xl font-bold text-white mb-8">Final Checklist for 75+ Overall Score</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-neutral-900/50 rounded-2xl p-6 border border-white/5">
                  <h3 className="text-lg font-semibold text-white mb-4">Human Buying Intent (Target: 65%+)</h3>
                  <ul className="space-y-2 text-sm">
                    <CheckItem>Clear value prop in first 10 words</CheckItem>
                    <CheckItem>4.5+ star rating with 1000+ reviews displayed</CheckItem>
                    <CheckItem>3+ recognizable customer logos</CheckItem>
                    <CheckItem>Money-back guarantee prominently shown</CheckItem>
                    <CheckItem>Transparent pricing (or compelling &quot;free tier&quot;)</CheckItem>
                    <CheckItem>3+ specific testimonials with names/companies</CheckItem>
                    <CheckItem>Demographic-tailored messaging</CheckItem>
                  </ul>
                </div>

                <div className="bg-neutral-900/50 rounded-2xl p-6 border border-white/5">
                  <h3 className="text-lg font-semibold text-white mb-4">Agent Experience (Target: 75+)</h3>
                  <ul className="space-y-2 text-sm">
                    <CheckItem>Product/Service Schema.org JSON-LD</CheckItem>
                    <CheckItem>FAQPage schema for FAQ section</CheckItem>
                    <CheckItem>Review/AggregateRating schema</CheckItem>
                    <CheckItem>Comprehensive meta tags (title, description, OG, Twitter)</CheckItem>
                    <CheckItem>Semantic HTML with proper heading hierarchy</CheckItem>
                    <CheckItem>sitemap.xml and robots.txt</CheckItem>
                    <CheckItem>API documentation or /for-agents page</CheckItem>
                    <CheckItem>Contact forms with clear structure</CheckItem>
                  </ul>
                </div>

                <div className="bg-neutral-900/50 rounded-2xl p-6 border border-white/5 md:col-span-2">
                  <h3 className="text-lg font-semibold text-white mb-4">SSR Score (Target: 65%+)</h3>
                  <div className="grid md:grid-cols-2 gap-x-8">
                    <ul className="space-y-2 text-sm">
                      <CheckItem>Fast loading time (&lt;3 seconds)</CheckItem>
                      <CheckItem>Mobile-responsive design</CheckItem>
                      <CheckItem>Clear information architecture</CheckItem>
                    </ul>
                    <ul className="space-y-2 text-sm">
                      <CheckItem>Multiple conversion paths (email, phone, chat)</CheckItem>
                      <CheckItem>Security badges and privacy policy</CheckItem>
                      <CheckItem>Professional design (not outdated)</CheckItem>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </BackgroundGlow>
  );
}
