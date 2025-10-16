/**
 * Web Scraper Utility using Playwright
 * Extracts website content and captures screenshots for LLM analysis
 */

import { chromium, type Browser, type Page } from "playwright";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export interface SocialProofData {
  starRating?: number; // 1-5 scale
  testimonials?: string[];
  userCount?: string;
  verifiedBadges?: string[];
  reviewSentiment?: string; // positive, neutral, negative
}

export interface TrustSignalsData {
  securityBadges?: string[];
  guarantees?: string[];
  returnPolicy?: string;
  paymentMethods?: string[];
  certifications?: string[];
}

export interface AuthoritySignalsData {
  awards?: string[];
  partnerships?: string[];
  mediaMentions?: string[];
  asSeenOn?: string[];
  expertEndorsements?: string[];
}

export interface MarketingElementsData {
  ctas?: Array<{ text: string; type: string }>;
  urgencyMessages?: string[];
  countdowns?: boolean;
  popups?: boolean;
  discounts?: string[];
}

export interface SectionScreenshotData {
  hero?: string;
  pricing?: string;
  socialProof?: string;
  trustSignals?: string;
  marketing?: string;
  features?: string;
}

export interface ScrapedWebsiteData {
  url: string;
  title: string;
  description: string;
  visibleText: string;
  html: string;
  screenshotPath: string;
  screenshotBase64: string;
  heroScreenshotPath: string;
  heroScreenshotBase64: string;
  sectionScreenshots?: SectionScreenshotData; // Section-specific screenshots
  metadata: {
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    price?: string;
    productName?: string;
    rating?: string;
    reviewCount?: string;
  };
  socialProof?: SocialProofData;
  trustSignals?: TrustSignalsData;
  authoritySignals?: AuthoritySignalsData;
  marketingElements?: MarketingElementsData;
  error?: string;
}

export interface ScraperOptions {
  timeout?: number;
  waitForSelector?: string;
  fullPage?: boolean;
  viewportWidth?: number;
  viewportHeight?: number;
}

/**
 * Capture screenshot of a specific element/section on the page
 */
async function captureElementScreenshot(
  page: Page,
  selectors: string[],
  filename: string,
  screenshotsDir: string,
  sectionName?: string
): Promise<string | undefined> {
  try {
    // Try each selector until we find a matching element
    for (let i = 0; i < selectors.length; i++) {
      const selector = selectors[i];
      try {
        const element = await page.locator(selector).first();
        const isVisible = await element.isVisible({ timeout: 5000 }); // Increased from 2s to 5s

        if (isVisible) {
          const boundingBox = await element.boundingBox();

          if (boundingBox) {
            // Add padding around the element
            const padding = 20;
            const clip = {
              x: Math.max(0, boundingBox.x - padding),
              y: Math.max(0, boundingBox.y - padding),
              width: Math.min(1920, boundingBox.width + padding * 2),
              height: Math.min(1080, boundingBox.height + padding * 2),
            };

            // Capture screenshot
            const screenshotBuffer = await page.screenshot({
              type: "png",
              clip,
            });

            // Save to file
            const filepath = join(screenshotsDir, filename);
            await writeFile(filepath, screenshotBuffer);

            console.log(`  ✅ ${sectionName || 'Section'}: Captured using selector "${selector}"`);
            return `/screenshots/${filename}`;
          }
        }
      } catch (err) {
        // Try next selector
        if (i === selectors.length - 1) {
          console.log(`  ⚠️  ${sectionName || 'Section'}: All ${selectors.length} selectors failed`);
          if (err instanceof Error) {
            console.log(`     Last error: ${err.message}`);
          }
        }
        continue;
      }
    }

    return undefined;
  } catch (error) {
    console.warn(`  ❌ ${sectionName || 'Section'}: Failed to capture - ${error}`);
    return undefined;
  }
}

/**
 * Scrape website content and capture screenshot
 */
export async function scrapeWebsite(
  url: string,
  options: ScraperOptions = {}
): Promise<ScrapedWebsiteData> {
  const {
    timeout = 30000,
    waitForSelector = "body",
    fullPage = true,
    viewportWidth = 1920,
    viewportHeight = 1080,
  } = options;

  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    console.log(`🌐 Scraping website: ${url}`);

    // Launch browser
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    // Create context and page
    const context = await browser.newContext({
      viewport: { width: viewportWidth, height: viewportHeight },
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    });

    page = await context.newPage();

    // Navigate to URL
    await page.goto(url, {
      timeout,
      waitUntil: "domcontentloaded",
    });

    // Wait for content to load
    await page.waitForSelector(waitForSelector, { timeout: 10000 });

    // Additional wait for dynamic content
    await page.waitForTimeout(2000);

    // Extract page data
    const pageData = await page.evaluate(() => {
      // Get title
      const title = document.title || "";

      // Get meta description
      const descriptionMeta = document.querySelector('meta[name="description"]');
      const description = descriptionMeta?.getAttribute("content") || "";

      // Get Open Graph metadata
      const ogTitle =
        document.querySelector('meta[property="og:title"]')?.getAttribute("content") || "";
      const ogDescription =
        document.querySelector('meta[property="og:description"]')?.getAttribute("content") || "";
      const ogImage =
        document.querySelector('meta[property="og:image"]')?.getAttribute("content") || "";

      // Try to extract price (common patterns)
      const priceElements = document.querySelectorAll(
        '[class*="price"], [data-testid*="price"], [itemprop="price"]'
      );
      let price = "";
      for (const el of Array.from(priceElements)) {
        const text = el.textContent?.trim() || "";
        if (text.match(/[\$£€¥]\s?\d+/)) {
          price = text;
          break;
        }
      }

      // Try to extract product name
      const productNameElements = document.querySelectorAll(
        'h1, [class*="product-name"], [class*="product-title"], [itemprop="name"]'
      );
      const productName = productNameElements[0]?.textContent?.trim() || "";

      // Try to extract rating
      const ratingElements = document.querySelectorAll(
        '[class*="rating"], [class*="star"], [itemprop="ratingValue"]'
      );
      const rating = ratingElements[0]?.textContent?.trim() || "";

      // Try to extract review count
      const reviewElements = document.querySelectorAll(
        '[class*="review"], [class*="reviews-count"], [itemprop="reviewCount"]'
      );
      const reviewCount = reviewElements[0]?.textContent?.trim() || "";

      // ========== SOCIAL PROOF EXTRACTION ==========
      // Extract structured star rating (1-5 scale)
      let starRating: number | undefined;
      const starElements = document.querySelectorAll(
        '[class*="star"], [class*="rating"], [itemprop="ratingValue"], [aria-label*="star"], [aria-label*="rating"]'
      );
      for (const el of Array.from(starElements)) {
        const ariaLabel = el.getAttribute("aria-label") || "";
        const text = el.textContent?.trim() || "";
        const combined = ariaLabel + " " + text;

        // Try to extract number from patterns like "4.5 out of 5", "Rated 4.5 stars", etc.
        const ratingMatch = combined.match(/(\d+\.?\d*)\s*(?:out of|stars?|\/)/i);
        if (ratingMatch) {
          const num = parseFloat(ratingMatch[1]);
          if (num >= 1 && num <= 5) {
            starRating = num;
            break;
          }
        }
      }

      // Extract testimonials (quotes from customers)
      const testimonials: string[] = [];
      const testimonialElements = document.querySelectorAll(
        '[class*="testimonial"], [class*="review-text"], [class*="customer-quote"], blockquote, [class*="feedback"]'
      );
      for (const el of Array.from(testimonialElements).slice(0, 5)) {
        const text = el.textContent?.trim() || "";
        if (text.length > 20 && text.length < 500) {
          testimonials.push(text);
        }
      }

      // Extract user count (e.g., "10,000+ customers", "Trusted by 50k users")
      let userCount: string | undefined;
      const visibleTextForCount = document.body.innerText;
      const userCountPatterns = [
        /(\d+[\d,]*\+?\s*(?:customers?|users?|clients?|members?))/gi,
        /(?:trusted by|used by|over)\s*(\d+[\d,]*\+?\s*(?:customers?|users?|clients?|members?))/gi,
      ];
      for (const pattern of userCountPatterns) {
        const match = visibleTextForCount.match(pattern);
        if (match) {
          userCount = match[0];
          break;
        }
      }

      // Extract verified badges
      const verifiedBadges: string[] = [];
      const badgeElements = document.querySelectorAll(
        '[class*="verified"], [class*="badge"], [class*="trust"], [aria-label*="verified"]'
      );
      for (const el of Array.from(badgeElements)) {
        const text = (el.textContent?.trim() || el.getAttribute("aria-label") || "").toLowerCase();
        if (text.includes("verified") || text.includes("authentic") || text.includes("certified")) {
          verifiedBadges.push(el.textContent?.trim() || el.getAttribute("aria-label") || "");
        }
      }

      // Determine review sentiment (basic heuristic)
      let reviewSentiment: string | undefined;
      if (starRating) {
        if (starRating >= 4.0) reviewSentiment = "positive";
        else if (starRating >= 3.0) reviewSentiment = "neutral";
        else reviewSentiment = "negative";
      }

      // ========== TRUST SIGNALS DETECTION ==========
      // Security badges (SSL, Norton, McAfee, BBB, etc.)
      const securityBadges: string[] = [];
      const securityElements = document.querySelectorAll(
        '[class*="security"], [class*="secure"], [class*="ssl"], [class*="badge"], img[alt*="secure"], img[alt*="SSL"], img[alt*="Norton"], img[alt*="McAfee"], img[alt*="BBB"]'
      );
      for (const el of Array.from(securityElements)) {
        const alt = el.getAttribute("alt") || "";
        const text = el.textContent?.trim() || "";
        const combined = (alt + " " + text).toLowerCase();
        if (combined.includes("secure") || combined.includes("ssl") || combined.includes("norton") ||
            combined.includes("mcafee") || combined.includes("bbb") || combined.includes("verified")) {
          securityBadges.push(alt || text || "Security Badge");
        }
      }

      // Guarantees & warranties
      const guarantees: string[] = [];
      const guaranteePatterns = [
        /money[\s-]?back guarantee/gi,
        /\d+[\s-]?day guarantee/gi,
        /satisfaction guaranteed/gi,
        /lifetime warranty/gi,
        /\d+[\s-]?year warranty/gi,
        /no questions asked/gi,
        /risk[\s-]?free/gi,
      ];
      const fullText = document.body.innerText;
      for (const pattern of guaranteePatterns) {
        const matches = fullText.match(pattern);
        if (matches) {
          guarantees.push(...matches.slice(0, 3)); // Max 3 per pattern
        }
      }

      // Return policy
      let returnPolicy: string | undefined;
      const returnPolicyElements = document.querySelectorAll(
        '[class*="return"], [class*="refund"], a[href*="return"], a[href*="refund"]'
      );
      for (const el of Array.from(returnPolicyElements)) {
        const text = el.textContent?.trim() || "";
        if (text.toLowerCase().includes("return") && text.length < 100) {
          returnPolicy = text;
          break;
        }
      }

      // Payment methods
      const paymentMethods: string[] = [];
      const paymentElements = document.querySelectorAll(
        'img[alt*="Visa"], img[alt*="Mastercard"], img[alt*="PayPal"], img[alt*="Amex"], img[alt*="American Express"], img[alt*="Discover"], img[alt*="payment"]'
      );
      for (const el of Array.from(paymentElements)) {
        const alt = el.getAttribute("alt") || "";
        if (alt) paymentMethods.push(alt);
      }

      // Certifications
      const certifications: string[] = [];
      const certElements = document.querySelectorAll(
        '[class*="certified"], [class*="certification"], img[alt*="certified"], img[alt*="ISO"]'
      );
      for (const el of Array.from(certElements)) {
        const alt = el.getAttribute("alt") || "";
        const text = el.textContent?.trim() || "";
        if (alt || text) certifications.push(alt || text);
      }

      // ========== AUTHORITY SIGNALS EXTRACTION ==========
      // Awards
      const awards: string[] = [];
      const awardElements = document.querySelectorAll(
        '[class*="award"], img[alt*="award"], img[alt*="winner"], [class*="winner"]'
      );
      for (const el of Array.from(awardElements)) {
        const alt = el.getAttribute("alt") || "";
        const text = el.textContent?.trim() || "";
        if (alt || text) awards.push(alt || text);
      }

      // Partnerships (logos or mentions)
      const partnerships: string[] = [];
      const partnerElements = document.querySelectorAll(
        '[class*="partner"], [class*="integration"], img[alt*="partner"], img[alt*="integrate"]'
      );
      for (const el of Array.from(partnerElements)) {
        const alt = el.getAttribute("alt") || "";
        const text = el.textContent?.trim() || "";
        if (alt || text) partnerships.push(alt || text);
      }

      // "As Seen On" logos (media mentions)
      const asSeenOn: string[] = [];
      const mediaElements = document.querySelectorAll(
        '[class*="as-seen"], [class*="featured"], [class*="press"], img[alt*="Forbes"], img[alt*="TechCrunch"], img[alt*="CNN"], img[alt*="BBC"], img[alt*="New York Times"]'
      );
      for (const el of Array.from(mediaElements)) {
        const alt = el.getAttribute("alt") || "";
        const text = el.textContent?.trim() || "";
        if (alt || text) asSeenOn.push(alt || text);
      }

      // Media mentions (text-based)
      const mediaMentions: string[] = [];
      const mediaMentionPattern = /(?:featured in|mentioned in|as seen on)[^.]{0,100}/gi;
      const mediaMatches = fullText.match(mediaMentionPattern);
      if (mediaMatches) {
        mediaMentions.push(...mediaMatches.slice(0, 3));
      }

      // Expert endorsements
      const expertEndorsements: string[] = [];
      const endorsementElements = document.querySelectorAll(
        '[class*="endorsement"], [class*="expert"], [class*="recommended"]'
      );
      for (const el of Array.from(endorsementElements).slice(0, 3)) {
        const text = el.textContent?.trim() || "";
        if (text.length > 20 && text.length < 300) {
          expertEndorsements.push(text);
        }
      }

      // ========== MARKETING ELEMENTS ANALYSIS ==========
      // CTA buttons
      const ctas: Array<{ text: string; type: string }> = [];
      const ctaElements = document.querySelectorAll(
        'button, [role="button"], a[class*="cta"], a[class*="btn"], [class*="button"]'
      );
      for (const el of Array.from(ctaElements).slice(0, 10)) {
        const text = el.textContent?.trim() || "";
        if (text.length > 0 && text.length < 50) {
          let type = "generic";
          const lowerText = text.toLowerCase();
          if (lowerText.includes("buy") || lowerText.includes("purchase") || lowerText.includes("order")) {
            type = "purchase";
          } else if (lowerText.includes("sign up") || lowerText.includes("register") || lowerText.includes("join")) {
            type = "signup";
          } else if (lowerText.includes("learn") || lowerText.includes("more info")) {
            type = "learn-more";
          } else if (lowerText.includes("try") || lowerText.includes("demo") || lowerText.includes("free")) {
            type = "trial";
          }
          ctas.push({ text, type });
        }
      }

      // Urgency/scarcity messaging
      const urgencyMessages: string[] = [];
      const urgencyPatterns = [
        /only \d+ left/gi,
        /limited time/gi,
        /hurry/gi,
        /ends soon/gi,
        /last chance/gi,
        /selling fast/gi,
        /almost sold out/gi,
        /\d+ people viewing/gi,
      ];
      for (const pattern of urgencyPatterns) {
        const matches = fullText.match(pattern);
        if (matches) {
          urgencyMessages.push(...matches.slice(0, 2));
        }
      }

      // Countdown timer detection
      const countdowns = document.querySelectorAll(
        '[class*="countdown"], [class*="timer"], [id*="countdown"]'
      ).length > 0;

      // Popup detection (look for modal/overlay classes)
      const popups = document.querySelectorAll(
        '[class*="modal"], [class*="popup"], [class*="overlay"], [role="dialog"]'
      ).length > 0;

      // Discounts
      const discounts: string[] = [];
      const discountPatterns = [
        /\d+%\s*off/gi,
        /save \$\d+/gi,
        /sale/gi,
        /discount/gi,
      ];
      for (const pattern of discountPatterns) {
        const matches = fullText.match(pattern);
        if (matches) {
          discounts.push(...matches.slice(0, 3));
        }
      }

      // Get visible text (remove scripts, styles, hidden elements)
      const clonedBody = document.body.cloneNode(true) as HTMLElement;
      clonedBody.querySelectorAll("script, style, noscript, iframe").forEach((el) => el.remove());
      const visibleText = clonedBody.innerText?.trim() || "";

      return {
        title,
        description,
        visibleText: visibleText.substring(0, 10000), // Limit to 10k chars
        ogTitle,
        ogDescription,
        ogImage,
        price,
        productName,
        rating,
        reviewCount,
        // Social proof data
        socialProof: {
          starRating,
          testimonials: testimonials.length > 0 ? testimonials : undefined,
          userCount,
          verifiedBadges: verifiedBadges.length > 0 ? verifiedBadges : undefined,
          reviewSentiment,
        },
        // Trust signals data
        trustSignals: {
          securityBadges: securityBadges.length > 0 ? securityBadges : undefined,
          guarantees: guarantees.length > 0 ? guarantees : undefined,
          returnPolicy,
          paymentMethods: paymentMethods.length > 0 ? paymentMethods : undefined,
          certifications: certifications.length > 0 ? certifications : undefined,
        },
        // Authority signals data
        authoritySignals: {
          awards: awards.length > 0 ? awards : undefined,
          partnerships: partnerships.length > 0 ? partnerships : undefined,
          mediaMentions: mediaMentions.length > 0 ? mediaMentions : undefined,
          asSeenOn: asSeenOn.length > 0 ? asSeenOn : undefined,
          expertEndorsements: expertEndorsements.length > 0 ? expertEndorsements : undefined,
        },
        // Marketing elements data
        marketingElements: {
          ctas: ctas.length > 0 ? ctas : undefined,
          urgencyMessages: urgencyMessages.length > 0 ? urgencyMessages : undefined,
          countdowns,
          popups,
          discounts: discounts.length > 0 ? discounts : undefined,
        },
      };
    });

    // Get HTML (limited to first 50k chars for performance)
    const html = await page.content();
    const limitedHtml = html.substring(0, 50000);

    // Create screenshots directory
    const screenshotsDir = join(process.cwd(), "public", "screenshots");
    if (!existsSync(screenshotsDir)) {
      await mkdir(screenshotsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedUrl = url
      .replace(/^https?:\/\//, "")
      .replace(/[^a-z0-9]/gi, "-")
      .substring(0, 50);
    const filename = `${sanitizedUrl}-${timestamp}.png`;
    const heroFilename = `${sanitizedUrl}-${timestamp}-hero.png`;
    const screenshotPath = join(screenshotsDir, filename);
    const heroScreenshotPath = join(screenshotsDir, heroFilename);

    // Capture hero screenshot (header + hero section only - top 1000px)
    const heroScreenshotBuffer = await page.screenshot({
      type: "png",
      clip: {
        x: 0,
        y: 0,
        width: viewportWidth,
        height: 1000, // Capture only top 1000px (header + hero section)
      },
    });

    // Save hero screenshot to file
    await writeFile(heroScreenshotPath, heroScreenshotBuffer);

    // Convert hero screenshot to base64
    const heroScreenshotBase64 = heroScreenshotBuffer.toString("base64");

    // ========== CAPTURE SECTION-SPECIFIC SCREENSHOTS ==========
    console.log("📸 Capturing section-specific screenshots...");
    const sectionScreenshots: SectionScreenshotData = {};

    // Hero section (already captured above)
    sectionScreenshots.hero = `/screenshots/${heroFilename}`;

    // Pricing section - Reliable selectors (NO text-matching)
    const pricingSectionPath = await captureElementScreenshot(
      page,
      [
        'section[class*="pricing"]',
        'div[id*="pricing"]',
        'section[id*="pricing"]',
        '[data-section="pricing"]',
        '[class*="price-section"]',
        '[class*="pricing-section"]',
        '[class*="pricing-table"]',
        '[class*="price-card"]',
        '[class*="pricing-card"]',
        'section:has([class*="price-tier"])',
        'main section:nth-of-type(2)', // Common position for pricing
        'main section:nth-of-type(3)',
      ],
      `${sanitizedUrl}-${timestamp}-pricing.png`,
      screenshotsDir,
      "Pricing"
    );
    if (pricingSectionPath) sectionScreenshots.pricing = pricingSectionPath;

    // Social Proof section - Reliable selectors (NO text-matching)
    const socialProofSectionPath = await captureElementScreenshot(
      page,
      [
        'section[class*="testimonial"]',
        'div[id*="testimonials"]',
        'section[id*="testimonials"]',
        '[data-section="testimonials"]',
        '[class*="customer-testimonials"]',
        '[class*="reviews-section"]',
        '[class*="testimonials-section"]',
        'section:has([class*="review"])',
        '[class*="social-proof"]',
        '[class*="customer-stories"]',
        'section:has([class*="rating"])',
        'main section:nth-of-type(4)', // Often near bottom
        'main section:nth-of-type(5)',
      ],
      `${sanitizedUrl}-${timestamp}-social-proof.png`,
      screenshotsDir,
      "Social Proof"
    );
    if (socialProofSectionPath) sectionScreenshots.socialProof = socialProofSectionPath;

    // Trust Signals section - Reliable selectors (NO text-matching)
    const trustSignalsSectionPath = await captureElementScreenshot(
      page,
      [
        'footer', // Footer often has trust badges
        'section[class*="trust"]',
        '[class*="security-section"]',
        '[data-section="trust"]',
        '[class*="guarantee-section"]',
        '[class*="trust-badges"]',
        '[class*="security-badges"]',
        'section:has([class*="badge"])',
        'div[class*="partners"]', // Partner logos = trust
        'main section:last-of-type', // Often at the end
      ],
      `${sanitizedUrl}-${timestamp}-trust-signals.png`,
      screenshotsDir,
      "Trust Signals"
    );
    if (trustSignalsSectionPath) sectionScreenshots.trustSignals = trustSignalsSectionPath;

    // Marketing Elements section - Reliable selectors (NO text-matching)
    const marketingSectionPath = await captureElementScreenshot(
      page,
      [
        'section:has([class*="cta"])',
        '[class*="call-to-action-section"]',
        '[data-section="cta"]',
        '[class*="cta-section"]',
        '[class*="hero"]:has(button)',
        '[class*="conversion-section"]',
        '[class*="action-section"]',
        'section:has([class*="sign-up"])',
        'section:has([class*="get-started"])',
        'main section:first-of-type', // Hero often has CTAs
      ],
      `${sanitizedUrl}-${timestamp}-marketing.png`,
      screenshotsDir,
      "Marketing Elements"
    );
    if (marketingSectionPath) sectionScreenshots.marketing = marketingSectionPath;

    // Features section - Reliable selectors (NO text-matching)
    const featuresSectionPath = await captureElementScreenshot(
      page,
      [
        'section[class*="features"]',
        'div[id*="features"]',
        'section[id*="features"]',
        '[data-section="features"]',
        '[class*="features-section"]',
        '[class*="feature-list"]',
        '[class*="product-features"]',
        '[class*="key-features"]',
        'section:has([class*="feature-card"])',
        '[class*="benefits-section"]',
        'main section:nth-of-type(2)', // Often 2nd section
      ],
      `${sanitizedUrl}-${timestamp}-features.png`,
      screenshotsDir,
      "Features"
    );
    if (featuresSectionPath) sectionScreenshots.features = featuresSectionPath;

    // Detailed summary
    console.log(`✅ Screenshot capture complete:`);
    console.log(`   Hero: ${sectionScreenshots.hero ? '✓' : '✗'}`);
    console.log(`   Pricing: ${sectionScreenshots.pricing ? '✓' : '✗'}`);
    console.log(`   Social Proof: ${sectionScreenshots.socialProof ? '✓' : '✗'}`);
    console.log(`   Trust Signals: ${sectionScreenshots.trustSignals ? '✓' : '✗'}`);
    console.log(`   Marketing: ${sectionScreenshots.marketing ? '✓' : '✗'}`);
    console.log(`   Features: ${sectionScreenshots.features ? '✓' : '✗'}`);
    console.log(`   Total: ${Object.keys(sectionScreenshots).length}/6`);

    // Capture full page screenshot
    const screenshotBuffer = await page.screenshot({
      fullPage,
      type: "png",
    });

    // Save full page screenshot to file
    await writeFile(screenshotPath, screenshotBuffer);

    // Convert to base64 for API response
    const screenshotBase64 = screenshotBuffer.toString("base64");

    console.log("✅ Website scraped successfully");

    return {
      url,
      title: pageData.title,
      description: pageData.description,
      visibleText: pageData.visibleText,
      html: limitedHtml,
      screenshotPath: `/screenshots/${filename}`,
      screenshotBase64: `data:image/png;base64,${screenshotBase64}`,
      heroScreenshotPath: `/screenshots/${heroFilename}`,
      heroScreenshotBase64: `data:image/png;base64,${heroScreenshotBase64}`,
      sectionScreenshots, // Include section-specific screenshots
      metadata: {
        ogTitle: pageData.ogTitle,
        ogDescription: pageData.ogDescription,
        ogImage: pageData.ogImage,
        price: pageData.price,
        productName: pageData.productName,
        rating: pageData.rating,
        reviewCount: pageData.reviewCount,
      },
      socialProof: pageData.socialProof,
      trustSignals: pageData.trustSignals,
      authoritySignals: pageData.authoritySignals,
      marketingElements: pageData.marketingElements,
    };
  } catch (error) {
    console.error("❌ Error scraping website:", error);
    return {
      url,
      title: "",
      description: "",
      visibleText: "",
      html: "",
      screenshotPath: "",
      screenshotBase64: "",
      heroScreenshotPath: "",
      heroScreenshotBase64: "",
      metadata: {},
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  } finally {
    // Cleanup
    if (page) await page.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
  }
}

/**
 * Extract structured product information from scraped data
 */
export function extractProductInfo(data: ScrapedWebsiteData): {
  productName: string;
  price: string;
  description: string;
  rating: string;
  reviewCount: string;
  keyFeatures: string[];
} {
  const productName =
    data.metadata.productName || data.metadata.ogTitle || data.title || "Unknown Product";

  const price = data.metadata.price || "Price not found";

  const description =
    data.metadata.ogDescription || data.description || data.visibleText.substring(0, 500);

  const rating = data.metadata.rating || "No rating available";

  const reviewCount = data.metadata.reviewCount || "No reviews";

  // Extract key features from visible text (simple heuristic)
  const keyFeatures: string[] = [];
  const lines = data.visibleText.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    // Look for bullet points or numbered lists
    if (
      (trimmed.startsWith("•") || trimmed.startsWith("-") || /^\d+\./.test(trimmed)) &&
      trimmed.length > 10 &&
      trimmed.length < 200
    ) {
      keyFeatures.push(trimmed);
      if (keyFeatures.length >= 10) break;
    }
  }

  return {
    productName,
    price,
    description,
    rating,
    reviewCount,
    keyFeatures,
  };
}
