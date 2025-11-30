"use strict";
/**
 * Web Scraper Utility using Playwright
 * Extracts website content and captures screenshots for LLM analysis
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeWebsite = scrapeWebsite;
exports.extractProductInfo = extractProductInfo;
const playwright_1 = require("playwright");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const fs_1 = require("fs");
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
function formatPublicPath(base, filename) {
    if (base.startsWith("/")) {
        const normalized = base.endsWith("/") ? base.slice(0, -1) : base;
        return `${normalized}/${filename}`;
    }
    return (0, path_1.join)(base, filename);
}
/**
 * Validate screenshot coordinates
 */
function validateCoordinates(coords, maxWidth, maxHeight, sectionName) {
    // Check if coordinates are within bounds
    if (coords.x < 0 || coords.y < 0) {
        return { valid: false, reason: `Negative coordinates (x:${coords.x}, y:${coords.y})` };
    }
    if (coords.x + coords.width > maxWidth) {
        return { valid: false, reason: `Exceeds width (${coords.x + coords.width} > ${maxWidth})` };
    }
    if (coords.y + coords.height > maxHeight) {
        return { valid: false, reason: `Exceeds height (${coords.y + coords.height} > ${maxHeight})` };
    }
    // Check minimum dimensions
    if (coords.width < 300 || coords.height < 200) {
        return { valid: false, reason: `Too small (${coords.width}x${coords.height}, min: 300x200)` };
    }
    // Check maximum reasonable dimensions (section shouldn't be entire page)
    if (coords.width > maxWidth * 0.95 && coords.height > maxHeight * 0.8) {
        return { valid: false, reason: `Section too large (likely full page instead of section)` };
    }
    return { valid: true };
}
/**
 * Correct coordinates to fit within bounds
 */
function correctCoordinateBounds(coords, maxWidth, maxHeight) {
    const corrected = { ...coords };
    // Ensure within bounds
    if (corrected.x + corrected.width > maxWidth) {
        corrected.width = maxWidth - corrected.x;
    }
    if (corrected.y + corrected.height > maxHeight) {
        corrected.height = maxHeight - corrected.y;
    }
    // Ensure positive
    corrected.x = Math.max(0, corrected.x);
    corrected.y = Math.max(0, corrected.y);
    return corrected;
}
/**
 * Use Claude Vision API to detect section coordinates from a full-page screenshot
 */
async function detectSectionsWithVision(screenshotBuffer, viewportWidth, viewportHeight) {
    try {
        const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
        if (!anthropicApiKey) {
            console.warn("⚠️  ANTHROPIC_API_KEY not found, skipping Vision-based section detection");
            return null;
        }
        const anthropic = new sdk_1.default({ apiKey: anthropicApiKey });
        console.log("🔍 Using Claude Vision to detect section coordinates...");
        // Import sharp for image resizing
        const sharp = require('sharp');
        // Get image dimensions
        const metadata = await sharp(screenshotBuffer).metadata();
        const originalWidth = metadata.width || viewportWidth;
        const originalHeight = metadata.height || viewportHeight;
        // Resize if exceeds Vision API limits (8000px max dimension)
        const MAX_DIMENSION = 8000;
        let processedBuffer = screenshotBuffer;
        let scaleFactor = 1;
        if (originalWidth > MAX_DIMENSION || originalHeight > MAX_DIMENSION) {
            // Calculate scale to fit within limits
            scaleFactor = Math.min(MAX_DIMENSION / originalWidth, MAX_DIMENSION / originalHeight);
            const newWidth = Math.floor(originalWidth * scaleFactor);
            const newHeight = Math.floor(originalHeight * scaleFactor);
            console.log(`  📐 Resizing screenshot from ${originalWidth}x${originalHeight} to ${newWidth}x${newHeight} (scale: ${scaleFactor.toFixed(2)})`);
            processedBuffer = await sharp(screenshotBuffer)
                .resize(newWidth, newHeight, { fit: 'inside' })
                .png()
                .toBuffer();
        }
        const response = await anthropic.messages.create({
            model: "claude-opus-4-5-20251101",
            max_tokens: 2000,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "image",
                            source: {
                                type: "base64",
                                media_type: "image/png",
                                data: processedBuffer.toString("base64"),
                            },
                        },
                        {
                            type: "text",
                            text: `You are analyzing a webpage screenshot to identify exact bounding box coordinates for specific sections.

**Screenshot Dimensions:** ${Math.floor(originalWidth * scaleFactor)}px × ${Math.floor(originalHeight * scaleFactor)}px

**Sections to Identify:**

1. **pricing** - Look for:
   - Price tags with $ or currency symbols
   - Pricing tables or plan cards (Basic, Pro, Enterprise)
   - "Buy Now" or "Subscribe" buttons near prices
   - Monthly/Annual pricing toggles

2. **socialProof** - Look for:
   - Customer testimonials with quotes or cards
   - Star ratings (★★★★★) with review counts
   - Customer photos/avatars with feedback
   - "What our customers say" sections

3. **trustSignals** - Look for:
   - Security badges (SSL, Norton, McAfee)
   - Payment method icons (Visa, PayPal, Stripe)
   - Guarantee text ("30-day money back")
   - Certification logos or trust seals

4. **marketing** - Look for:
   - Hero section with primary CTA button
   - Sign-up forms or email capture
   - "Get Started" or "Try Free" buttons
   - Prominent conversion-focused areas

5. **features** - Look for:
   - Feature lists with checkmarks or icons
   - "What you get" or "Features" sections
   - Grid of feature cards
   - Benefit highlights

**Critical Instructions:**
✅ Return coordinates for VISIBLE content only
✅ Ensure x + width ≤ ${Math.floor(originalWidth * scaleFactor)}
✅ Ensure y + height ≤ ${Math.floor(originalHeight * scaleFactor)}
✅ Minimum size: 300px × 200px per section
✅ Coordinates must capture the ENTIRE section (not just part of it)
✅ If a section is not clearly visible, omit it
✅ Double-check coordinates are within image bounds

**Response Format (JSON only, no markdown):**
{
  "pricing": {"x": 0, "y": 800, "width": 1920, "height": 600, "confidence": "high"},
  "socialProof": {"x": 0, "y": 1400, "width": 1920, "height": 500, "confidence": "medium"}
}

Only include sections you can see. Omit sections you cannot confidently locate.`,
                        },
                    ],
                },
            ],
        });
        const responseText = response.content[0].type === "text" ? response.content[0].text : "";
        // Extract JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.warn("⚠️  Vision API did not return valid JSON");
            return null;
        }
        const sections = JSON.parse(jsonMatch[0]);
        // Scale coordinates back to original dimensions if image was resized
        const validatedSections = {};
        console.log(`  🔄 Processing Vision API results (scale factor: ${scaleFactor.toFixed(3)})`);
        console.log(`     Original: ${originalWidth}x${originalHeight}, Resized: ${Math.floor(originalWidth * scaleFactor)}x${Math.floor(originalHeight * scaleFactor)}`);
        for (const [section, coords] of Object.entries(sections)) {
            console.log(`  📍 ${section} (Vision API): (${coords.x}, ${coords.y}) ${coords.width}x${coords.height}`);
            // Scale coordinates back to original size
            const scaledCoords = {
                x: Math.floor(coords.x / scaleFactor),
                y: Math.floor(coords.y / scaleFactor),
                width: Math.floor(coords.width / scaleFactor),
                height: Math.floor(coords.height / scaleFactor),
            };
            console.log(`     Scaled back: (${scaledCoords.x}, ${scaledCoords.y}) ${scaledCoords.width}x${scaledCoords.height}`);
            // Comprehensive validation
            const isValid = validateCoordinates(scaledCoords, originalWidth, originalHeight, section);
            if (isValid.valid) {
                // Apply bounds correction if needed
                const correctedCoords = correctCoordinateBounds(scaledCoords, originalWidth, originalHeight);
                validatedSections[section] = correctedCoords;
                const confidence = coords.confidence || 'unknown';
                console.log(`  ✅ ${section}: (${correctedCoords.x}, ${correctedCoords.y}) ${correctedCoords.width}x${correctedCoords.height} [${confidence}]`);
            }
            else {
                console.log(`  ⚠️  ${section}: ${isValid.reason}`);
            }
        }
        const detectedCount = Object.keys(validatedSections).length;
        console.log(`✅ Vision API detected ${detectedCount}/5 sections`);
        return Object.keys(validatedSections).length > 0 ? validatedSections : null;
    }
    catch (error) {
        console.error("❌ Vision-based section detection failed:", error);
        return null;
    }
}
/**
 * Capture screenshot using Vision API coordinates
 */
async function captureScreenshotFromCoords(page, coords, filename, screenshotsDir, publicBasePath, sectionName) {
    try {
        // Get actual viewport dimensions to validate against
        const viewport = page.viewportSize();
        const actualWidth = viewport?.width || 1920;
        // CRITICAL: Ensure coordinates don't exceed actual page dimensions
        // The issue is that even after resizing, coordinates might be for the RESIZED image
        // but we're capturing from the FULL page
        const safeCoords = {
            x: Math.max(0, Math.min(coords.x, actualWidth - 100)),
            y: Math.max(0, coords.y),
            width: Math.min(coords.width, actualWidth),
            height: coords.height,
        };
        // Add padding around the detected section
        const padding = 10; // Reduced padding to avoid exceeding bounds
        const clip = {
            x: Math.max(0, safeCoords.x - padding),
            y: Math.max(0, safeCoords.y - padding),
            width: Math.min(actualWidth, safeCoords.width + padding * 2),
            height: safeCoords.height + padding * 2, // Don't limit height here
        };
        // Final safety check before capture
        if (clip.width < 100 || clip.height < 100) {
            throw new Error(`Clip dimensions too small: ${clip.width}x${clip.height}`);
        }
        console.log(`  📸 ${sectionName}: Attempting capture at (${clip.x}, ${clip.y}) ${clip.width}x${clip.height}`);
        // Capture screenshot
        const screenshotBuffer = await page.screenshot({
            type: "png",
            clip,
        });
        // Save to file
        const filepath = (0, path_1.join)(screenshotsDir, filename);
        await (0, promises_1.writeFile)(filepath, screenshotBuffer);
        console.log(`  ✅ ${sectionName}: Captured using Vision coordinates`);
        return formatPublicPath(publicBasePath, filename);
    }
    catch (error) {
        console.warn(`  ❌ ${sectionName}: Failed to capture from coordinates - ${error}`);
        throw error;
    }
}
/**
 * Validate section content based on type
 */
async function validateSectionContent(page, element, sectionType) {
    try {
        const text = await element.textContent();
        if (!text)
            return false;
        const textLower = text.toLowerCase();
        switch (sectionType) {
            case "Pricing":
                // Check for price indicators
                return /\$|€|£|¥|\d+[.,]\d{2}|price|pricing|plan|subscribe|buy/.test(textLower);
            case "Social Proof":
                // Check for review/testimonial indicators
                return /★|⭐|review|testimonial|customer|rating|trust|feedback/.test(textLower);
            case "Trust Signals":
                // Check for trust indicators
                return /secure|guarantee|certified|ssl|verified|trusted|badge|warranty/.test(textLower);
            case "Marketing Elements":
                // Check for CTA indicators
                return /get started|sign up|try|free|join|register|buy now|subscribe/.test(textLower);
            case "Features":
                // Check for feature indicators
                return /feature|benefit|includes|what you get|✓|✔|checkmark/.test(textLower);
            default:
                return true; // Unknown section type, assume valid
        }
    }
    catch {
        return true; // If validation fails, assume valid (err on side of inclusion)
    }
}
/**
 * Capture screenshot of a specific element/section on the page
 */
async function captureElementScreenshot(page, selectors, filename, screenshotsDir, publicBasePath, sectionName) {
    try {
        // Try each selector until we find a matching element
        for (let i = 0; i < selectors.length; i++) {
            const selector = selectors[i];
            try {
                const element = await page.locator(selector).first();
                const isVisible = await element.isVisible({ timeout: 5000 });
                if (isVisible) {
                    // Validate content before capturing
                    const hasValidContent = await validateSectionContent(page, element, sectionName || "");
                    if (!hasValidContent) {
                        console.log(`  ⚠️  ${sectionName || 'Section'}: Selector "${selector}" found but content doesn't match section type`);
                        continue; // Try next selector
                    }
                    const boundingBox = await element.boundingBox();
                    if (boundingBox) {
                        // Validate dimensions
                        if (boundingBox.width < 200 || boundingBox.height < 150) {
                            console.log(`  ⚠️  ${sectionName || 'Section'}: Element too small (${Math.floor(boundingBox.width)}x${Math.floor(boundingBox.height)})`);
                            continue;
                        }
                        // Add padding around the element
                        const padding = 20;
                        const clip = {
                            x: Math.max(0, boundingBox.x - padding),
                            y: Math.max(0, boundingBox.y - padding),
                            width: Math.min(1920 * 3, boundingBox.width + padding * 2),
                            height: Math.min(1080 * 20, boundingBox.height + padding * 2),
                        };
                        // Capture screenshot
                        const screenshotBuffer = await page.screenshot({
                            type: "png",
                            clip,
                        });
                        // Save to file
                        const filepath = (0, path_1.join)(screenshotsDir, filename);
                        await (0, promises_1.writeFile)(filepath, screenshotBuffer);
                        console.log(`  ✅ ${sectionName || 'Section'}: Captured using selector "${selector}" [validated]`);
                        return formatPublicPath(publicBasePath, filename);
                    }
                }
            }
            catch (err) {
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
    }
    catch (error) {
        console.warn(`  ❌ ${sectionName || 'Section'}: Failed to capture - ${error}`);
        return undefined;
    }
}
/**
 * Scrape website content and capture screenshot
 */
async function scrapeWebsite(url, options = {}) {
    const { timeout = 30000, waitForSelector = "body", fullPage = true, viewportWidth = 1920, viewportHeight = 1080, outputDir, publicBasePath, } = options;
    let browser = null;
    let page = null;
    try {
        console.log(`🌐 Scraping website: ${url}`);
        // Launch browser
        browser = await playwright_1.chromium.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
        // Create context and page
        const context = await browser.newContext({
            viewport: { width: viewportWidth, height: viewportHeight },
            userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
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
            const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute("content") || "";
            const ogDescription = document.querySelector('meta[property="og:description"]')?.getAttribute("content") || "";
            const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute("content") || "";
            // Try to extract price (common patterns)
            const priceElements = document.querySelectorAll('[class*="price"], [data-testid*="price"], [itemprop="price"]');
            let price = "";
            for (const el of Array.from(priceElements)) {
                const text = el.textContent?.trim() || "";
                if (text.match(/[\$£€¥]\s?\d+/)) {
                    price = text;
                    break;
                }
            }
            // Try to extract product name
            const productNameElements = document.querySelectorAll('h1, [class*="product-name"], [class*="product-title"], [itemprop="name"]');
            const productName = productNameElements[0]?.textContent?.trim() || "";
            // Try to extract rating
            const ratingElements = document.querySelectorAll('[class*="rating"], [class*="star"], [itemprop="ratingValue"]');
            const rating = ratingElements[0]?.textContent?.trim() || "";
            // Try to extract review count
            const reviewElements = document.querySelectorAll('[class*="review"], [class*="reviews-count"], [itemprop="reviewCount"]');
            const reviewCount = reviewElements[0]?.textContent?.trim() || "";
            // ========== SOCIAL PROOF EXTRACTION ==========
            // Extract structured star rating (1-5 scale)
            let starRating;
            const starElements = document.querySelectorAll('[class*="star"], [class*="rating"], [itemprop="ratingValue"], [aria-label*="star"], [aria-label*="rating"]');
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
            const testimonials = [];
            const testimonialElements = document.querySelectorAll('[class*="testimonial"], [class*="review-text"], [class*="customer-quote"], blockquote, [class*="feedback"]');
            for (const el of Array.from(testimonialElements).slice(0, 5)) {
                const text = el.textContent?.trim() || "";
                if (text.length > 20 && text.length < 500) {
                    testimonials.push(text);
                }
            }
            // Extract user count (e.g., "10,000+ customers", "Trusted by 50k users")
            let userCount;
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
            const verifiedBadges = [];
            const badgeElements = document.querySelectorAll('[class*="verified"], [class*="badge"], [class*="trust"], [aria-label*="verified"]');
            for (const el of Array.from(badgeElements)) {
                const text = (el.textContent?.trim() || el.getAttribute("aria-label") || "").toLowerCase();
                if (text.includes("verified") || text.includes("authentic") || text.includes("certified")) {
                    verifiedBadges.push(el.textContent?.trim() || el.getAttribute("aria-label") || "");
                }
            }
            // Determine review sentiment (basic heuristic)
            let reviewSentiment;
            if (starRating) {
                if (starRating >= 4.0)
                    reviewSentiment = "positive";
                else if (starRating >= 3.0)
                    reviewSentiment = "neutral";
                else
                    reviewSentiment = "negative";
            }
            // ========== TRUST SIGNALS DETECTION ==========
            // Security badges (SSL, Norton, McAfee, BBB, etc.)
            const securityBadges = [];
            const securityElements = document.querySelectorAll('[class*="security"], [class*="secure"], [class*="ssl"], [class*="badge"], img[alt*="secure"], img[alt*="SSL"], img[alt*="Norton"], img[alt*="McAfee"], img[alt*="BBB"]');
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
            const guarantees = [];
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
            let returnPolicy;
            const returnPolicyElements = document.querySelectorAll('[class*="return"], [class*="refund"], a[href*="return"], a[href*="refund"]');
            for (const el of Array.from(returnPolicyElements)) {
                const text = el.textContent?.trim() || "";
                if (text.toLowerCase().includes("return") && text.length < 100) {
                    returnPolicy = text;
                    break;
                }
            }
            // Payment methods
            const paymentMethods = [];
            const paymentElements = document.querySelectorAll('img[alt*="Visa"], img[alt*="Mastercard"], img[alt*="PayPal"], img[alt*="Amex"], img[alt*="American Express"], img[alt*="Discover"], img[alt*="payment"]');
            for (const el of Array.from(paymentElements)) {
                const alt = el.getAttribute("alt") || "";
                if (alt)
                    paymentMethods.push(alt);
            }
            // Certifications
            const certifications = [];
            const certElements = document.querySelectorAll('[class*="certified"], [class*="certification"], img[alt*="certified"], img[alt*="ISO"]');
            for (const el of Array.from(certElements)) {
                const alt = el.getAttribute("alt") || "";
                const text = el.textContent?.trim() || "";
                if (alt || text)
                    certifications.push(alt || text);
            }
            // ========== AUTHORITY SIGNALS EXTRACTION ==========
            // Awards
            const awards = [];
            const awardElements = document.querySelectorAll('[class*="award"], img[alt*="award"], img[alt*="winner"], [class*="winner"]');
            for (const el of Array.from(awardElements)) {
                const alt = el.getAttribute("alt") || "";
                const text = el.textContent?.trim() || "";
                if (alt || text)
                    awards.push(alt || text);
            }
            // Partnerships (logos or mentions)
            const partnerships = [];
            const partnerElements = document.querySelectorAll('[class*="partner"], [class*="integration"], img[alt*="partner"], img[alt*="integrate"]');
            for (const el of Array.from(partnerElements)) {
                const alt = el.getAttribute("alt") || "";
                const text = el.textContent?.trim() || "";
                if (alt || text)
                    partnerships.push(alt || text);
            }
            // "As Seen On" logos (media mentions)
            const asSeenOn = [];
            const mediaElements = document.querySelectorAll('[class*="as-seen"], [class*="featured"], [class*="press"], img[alt*="Forbes"], img[alt*="TechCrunch"], img[alt*="CNN"], img[alt*="BBC"], img[alt*="New York Times"]');
            for (const el of Array.from(mediaElements)) {
                const alt = el.getAttribute("alt") || "";
                const text = el.textContent?.trim() || "";
                if (alt || text)
                    asSeenOn.push(alt || text);
            }
            // Media mentions (text-based)
            const mediaMentions = [];
            const mediaMentionPattern = /(?:featured in|mentioned in|as seen on)[^.]{0,100}/gi;
            const mediaMatches = fullText.match(mediaMentionPattern);
            if (mediaMatches) {
                mediaMentions.push(...mediaMatches.slice(0, 3));
            }
            // Expert endorsements
            const expertEndorsements = [];
            const endorsementElements = document.querySelectorAll('[class*="endorsement"], [class*="expert"], [class*="recommended"]');
            for (const el of Array.from(endorsementElements).slice(0, 3)) {
                const text = el.textContent?.trim() || "";
                if (text.length > 20 && text.length < 300) {
                    expertEndorsements.push(text);
                }
            }
            // ========== MARKETING ELEMENTS ANALYSIS ==========
            // CTA buttons
            const ctas = [];
            const ctaElements = document.querySelectorAll('button, [role="button"], a[class*="cta"], a[class*="btn"], [class*="button"]');
            for (const el of Array.from(ctaElements).slice(0, 10)) {
                const text = el.textContent?.trim() || "";
                if (text.length > 0 && text.length < 50) {
                    let type = "generic";
                    const lowerText = text.toLowerCase();
                    if (lowerText.includes("buy") || lowerText.includes("purchase") || lowerText.includes("order")) {
                        type = "purchase";
                    }
                    else if (lowerText.includes("sign up") || lowerText.includes("register") || lowerText.includes("join")) {
                        type = "signup";
                    }
                    else if (lowerText.includes("learn") || lowerText.includes("more info")) {
                        type = "learn-more";
                    }
                    else if (lowerText.includes("try") || lowerText.includes("demo") || lowerText.includes("free")) {
                        type = "trial";
                    }
                    ctas.push({ text, type });
                }
            }
            // Urgency/scarcity messaging
            const urgencyMessages = [];
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
            const countdowns = document.querySelectorAll('[class*="countdown"], [class*="timer"], [id*="countdown"]').length > 0;
            // Popup detection (look for modal/overlay classes)
            const popups = document.querySelectorAll('[class*="modal"], [class*="popup"], [class*="overlay"], [role="dialog"]').length > 0;
            // Discounts
            const discounts = [];
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
            const clonedBody = document.body.cloneNode(true);
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
        const screenshotsDir = outputDir ?? (0, path_1.join)(process.cwd(), "public", "screenshots");
        if (!(0, fs_1.existsSync)(screenshotsDir)) {
            await (0, promises_1.mkdir)(screenshotsDir, { recursive: true });
        }
        const publicBase = publicBasePath ?? "/screenshots";
        // Generate unique filename
        const timestamp = Date.now();
        const sanitizedUrl = url
            .replace(/^https?:\/\//, "")
            .replace(/[^a-z0-9]/gi, "-")
            .substring(0, 50);
        const filename = `${sanitizedUrl}-${timestamp}.png`;
        const heroFilename = `${sanitizedUrl}-${timestamp}-hero.png`;
        const screenshotPath = (0, path_1.join)(screenshotsDir, filename);
        const heroScreenshotPath = (0, path_1.join)(screenshotsDir, heroFilename);
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
        await (0, promises_1.writeFile)(heroScreenshotPath, heroScreenshotBuffer);
        // Convert hero screenshot to base64
        const heroScreenshotBase64 = heroScreenshotBuffer.toString("base64");
        // ========== CAPTURE SECTION-SPECIFIC SCREENSHOTS ==========
        console.log("📸 Capturing section-specific screenshots...");
        const sectionScreenshots = {};
        // Hero section (already captured above)
        sectionScreenshots.hero = formatPublicPath(publicBase, heroFilename);
        // Try Vision API first for intelligent section detection
        const fullPageScreenshot = await page.screenshot({
            fullPage: true,
            type: "png",
        });
        // Vision API temporarily disabled due to coordinate scaling issues
        // TODO: Fix coordinate transformation between resized image and live page
        console.log("⚠️  Vision API temporarily disabled - using CSS selectors only");
        // Commented out until coordinate scaling is fixed:
        // const visionDetectedSections = await detectSectionsWithVision(
        //   fullPageScreenshot,
        //   viewportWidth,
        //   viewportHeight
        // );
        // Pricing section - Using CSS selectors only
        const pricingSectionPath = await captureElementScreenshot(page, [
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
        ], `${sanitizedUrl}-${timestamp}-pricing.png`, screenshotsDir, publicBase, "Pricing");
        if (pricingSectionPath)
            sectionScreenshots.pricing = pricingSectionPath;
        // Social Proof section - Using CSS selectors only
        const socialProofSectionPath = await captureElementScreenshot(page, [
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
        ], `${sanitizedUrl}-${timestamp}-social-proof.png`, screenshotsDir, publicBase, "Social Proof");
        if (socialProofSectionPath)
            sectionScreenshots.socialProof = socialProofSectionPath;
        // Trust Signals section - Using CSS selectors only
        const trustSignalsSectionPath = await captureElementScreenshot(page, [
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
        ], `${sanitizedUrl}-${timestamp}-trust-signals.png`, screenshotsDir, publicBase, "Trust Signals");
        if (trustSignalsSectionPath)
            sectionScreenshots.trustSignals = trustSignalsSectionPath;
        // Marketing Elements section - Using CSS selectors only
        const marketingSectionPath = await captureElementScreenshot(page, [
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
        ], `${sanitizedUrl}-${timestamp}-marketing.png`, screenshotsDir, publicBase, "Marketing Elements");
        if (marketingSectionPath)
            sectionScreenshots.marketing = marketingSectionPath;
        // Features section - Using CSS selectors only
        const featuresSectionPath = await captureElementScreenshot(page, [
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
        ], `${sanitizedUrl}-${timestamp}-features.png`, screenshotsDir, publicBase, "Features");
        if (featuresSectionPath)
            sectionScreenshots.features = featuresSectionPath;
        // Detailed summary
        console.log(`✅ Screenshot capture complete:`);
        console.log(`   Hero: ${sectionScreenshots.hero ? '✓' : '✗'}`);
        console.log(`   Pricing: ${sectionScreenshots.pricing ? '✓' : '✗'}`);
        console.log(`   Social Proof: ${sectionScreenshots.socialProof ? '✓' : '✗'}`);
        console.log(`   Trust Signals: ${sectionScreenshots.trustSignals ? '✓' : '✗'}`);
        console.log(`   Marketing: ${sectionScreenshots.marketing ? '✓' : '✗'}`);
        console.log(`   Features: ${sectionScreenshots.features ? '✓' : '✗'}`);
        console.log(`   Total: ${Object.keys(sectionScreenshots).length}/6`);
        // Save full page screenshot to file (reuse from Vision detection)
        await (0, promises_1.writeFile)(screenshotPath, fullPageScreenshot);
        // Convert to base64 for API response
        const screenshotBase64 = fullPageScreenshot.toString("base64");
        console.log("✅ Website scraped successfully");
        return {
            url,
            title: pageData.title,
            description: pageData.description,
            visibleText: pageData.visibleText,
            html: limitedHtml,
            screenshotPath: formatPublicPath(publicBase, filename),
            screenshotBase64: `data:image/png;base64,${screenshotBase64}`,
            heroScreenshotPath: formatPublicPath(publicBase, heroFilename),
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
    }
    catch (error) {
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
    }
    finally {
        // Cleanup
        if (page)
            await page.close().catch(() => { });
        if (browser)
            await browser.close().catch(() => { });
    }
}
/**
 * Extract structured product information from scraped data
 */
function extractProductInfo(data) {
    const productName = data.metadata.productName || data.metadata.ogTitle || data.title || "Unknown Product";
    const price = data.metadata.price || "Price not found";
    const description = data.metadata.ogDescription || data.description || data.visibleText.substring(0, 500);
    const rating = data.metadata.rating || "No rating available";
    const reviewCount = data.metadata.reviewCount || "No reviews";
    // Extract key features from visible text (simple heuristic)
    const keyFeatures = [];
    const lines = data.visibleText.split("\n");
    for (const line of lines) {
        const trimmed = line.trim();
        // Look for bullet points or numbered lists
        if ((trimmed.startsWith("•") || trimmed.startsWith("-") || /^\d+\./.test(trimmed)) &&
            trimmed.length > 10 &&
            trimmed.length < 200) {
            keyFeatures.push(trimmed);
            if (keyFeatures.length >= 10)
                break;
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
