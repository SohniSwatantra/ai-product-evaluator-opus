#!/usr/bin/env node

/**
 * GitHub Actions Worker Script
 * Runs Playwright scraping and AI evaluation
 * Saves results to Neon DB and uploads screenshots to R2
 */

import Anthropic from "@anthropic-ai/sdk";
import { chromium } from "playwright";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { neon } from "@neondatabase/serverless";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { readFile } from "fs/promises";

// Environment variables
const PRODUCT_URL = process.env.PRODUCT_URL;
const DEMOGRAPHICS = JSON.parse(process.env.DEMOGRAPHICS || "{}");
const JOB_ID = process.env.JOB_ID;
const DATABASE_URL = process.env.DATABASE_URL;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// R2 Configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "ai-evaluator-screenshots";

// Initialize clients
const sql = neon(DATABASE_URL);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// R2 Client (S3-compatible)
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

console.log(`🚀 Starting evaluation for job ${JOB_ID}`);
console.log(`   Product URL: ${PRODUCT_URL}`);
console.log(`   Demographics:`, DEMOGRAPHICS);

/**
 * Update job status in database
 */
async function updateJobStatus(status, error = null) {
  try {
    await sql`
      UPDATE evaluation_jobs
      SET status = ${status},
          error = ${error},
          updated_at = NOW()
      WHERE id = ${JOB_ID}
    `;
    console.log(`✅ Job status updated to: ${status}`);
  } catch (err) {
    console.error("Failed to update job status:", err);
  }
}

/**
 * Upload file to Cloudflare R2
 */
async function uploadToR2(filePath, key) {
  try {
    const fileContent = await readFile(filePath);

    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: fileContent,
        ContentType: "image/png",
      })
    );

    const publicUrl = `https://pub-${R2_ACCOUNT_ID}.r2.dev/${key}`;
    console.log(`✅ Uploaded to R2: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error(`Failed to upload ${key} to R2:`, error);
    throw error;
  }
}

/**
 * Simplified web scraping (extracted from lib/web-scraper.ts)
 */
async function scrapeWebsite(url) {
  let browser = null;

  try {
    console.log(`🌐 Scraping: ${url}`);

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    const page = await context.newPage();

    await page.goto(url, { timeout: 30000, waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Extract page data
    const pageData = await page.evaluate(() => {
      const title = document.title || "";
      const visibleText = document.body.innerText?.substring(0, 10000) || "";

      return { title, visibleText };
    });

    // Create screenshots directory
    const screenshotsDir = join(process.cwd(), "public", "screenshots");
    if (!existsSync(screenshotsDir)) {
      await mkdir(screenshotsDir, { recursive: true });
    }

    // Capture screenshot
    const timestamp = Date.now();
    const sanitizedUrl = url.replace(/^https?:\/\//, "").replace(/[^a-z0-9]/gi, "-").substring(0, 50);
    const filename = `${sanitizedUrl}-${timestamp}.png`;
    const filepath = join(screenshotsDir, filename);

    const screenshotBuffer = await page.screenshot({ fullPage: true, type: "png" });
    await writeFile(filepath, screenshotBuffer);

    console.log("✅ Screenshot captured");

    await browser.close();

    return {
      title: pageData.title,
      visibleText: pageData.visibleText,
      screenshotPath: filepath,
      screenshotFilename: filename,
    };
  } catch (error) {
    if (browser) await browser.close();
    throw error;
  }
}

/**
 * Main evaluation logic
 */
async function runEvaluation() {
  try {
    // Update status to processing
    await updateJobStatus("processing");

    // Step 1: Scrape website
    const scrapedData = await scrapeWebsite(PRODUCT_URL);

    // Step 2: Upload screenshot to R2
    const screenshotUrl = await uploadToR2(
      scrapedData.screenshotPath,
      `screenshots/${scrapedData.screenshotFilename}`
    );

    // Step 3: Run AI evaluation (simplified version)
    console.log("🤖 Running AI evaluation...");

    const demographicDescription = `
Target Customer Profile:
- Age: ${DEMOGRAPHICS.ageRange} years old
- Gender: ${DEMOGRAPHICS.gender}
- Income: ${DEMOGRAPHICS.incomeTier}
- Region: ${DEMOGRAPHICS.region}
`;

    const prompt = `Evaluate this product for the target demographic and return a JSON evaluation.

Product URL: ${PRODUCT_URL}
${demographicDescription}

Visible Text (first 5000 chars):
${scrapedData.visibleText.substring(0, 5000)}

Return JSON with: overallScore, buyingIntentProbability, purchaseIntentAnchor (low/middle/high), factors array, analysis, demographicImpact, recommendations.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const evaluation = JSON.parse(jsonMatch[0]);

    // Add screenshot URL and metadata
    evaluation.websiteSnapshot = {
      screenshotPath: screenshotUrl,
      productName: scrapedData.title,
      price: "N/A",
      rating: "N/A",
      reviewCount: "N/A",
      description: scrapedData.visibleText.substring(0, 500),
      keyFeatures: [],
    };

    // Step 4: Save evaluation to database
    console.log("💾 Saving evaluation to database...");

    await sql`
      UPDATE evaluation_jobs
      SET status = 'completed',
          result = ${JSON.stringify(evaluation)},
          completed_at = NOW(),
          updated_at = NOW()
      WHERE id = ${JOB_ID}
    `;

    console.log(`✅ Evaluation completed successfully for job ${JOB_ID}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Evaluation failed:", error);
    await updateJobStatus("failed", error.message);
    process.exit(1);
  }
}

// Run the evaluation
runEvaluation();
