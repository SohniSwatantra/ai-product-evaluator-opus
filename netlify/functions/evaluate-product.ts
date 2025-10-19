

function buildScrapedDataAppendix(
  scrapedData: Awaited<ReturnType<typeof scrapeWebsite>>,
  productInfo: ReturnType<typeof extractProductInfo>
): string {
  return `
**Product Information:**
- Product Name: ${productInfo.productName}
- Price: ${productInfo.price}
- Rating: ${productInfo.rating}
- Reviews: ${productInfo.reviewCount}
- Description: ${productInfo.description}

**Key Features:**
${productInfo.keyFeatures.length > 0 ? productInfo.keyFeatures.map((f) => `- ${f}`).join("
") : "- No key features extracted"}

**Social Proof (Factor 3: Reviews, ratings, testimonials):**
${scrapedData.socialProof?.starRating ? `- Star Rating: ${scrapedData.socialProof.starRating}/5 (Sentiment: ${scrapedData.socialProof.reviewSentiment})` : "- Star Rating: Not found"}
${scrapedData.socialProof?.userCount ? `- User Count: ${scrapedData.socialProof.userCount}` : ""}
${scrapedData.socialProof?.testimonials && scrapedData.socialProof.testimonials.length > 0 ? `- Customer Testimonials Found: ${scrapedData.socialProof.testimonials.length}
  Sample: "${scrapedData.socialProof.testimonials[0].substring(0, 150)}..."` : "- No testimonials found"}
${scrapedData.socialProof?.verifiedBadges && scrapedData.socialProof.verifiedBadges.length > 0 ? `- Verified Badges: ${scrapedData.socialProof.verifiedBadges.join(", ")}` : ""}

**Trust Signals (Factor 4: Security, guarantees, certifications):**
${scrapedData.trustSignals?.securityBadges && scrapedData.trustSignals.securityBadges.length > 0 ? `- Security Badges: ${scrapedData.trustSignals.securityBadges.join(", ")}` : "- No security badges found"}
${scrapedData.trustSignals?.guarantees && scrapedData.trustSignals.guarantees.length > 0 ? `- Guarantees/Warranties: ${scrapedData.trustSignals.guarantees.slice(0, 3).join("; ")}` : "- No guarantees found"}
${scrapedData.trustSignals?.returnPolicy ? `- Return Policy: ${scrapedData.trustSignals.returnPolicy}` : "- Return policy not clearly stated"}
${scrapedData.trustSignals?.paymentMethods && scrapedData.trustSignals.paymentMethods.length > 0 ? `- Payment Methods: ${scrapedData.trustSignals.paymentMethods.join(", ")}` : ""}
${scrapedData.trustSignals?.certifications && scrapedData.trustSignals.certifications.length > 0 ? `- Certifications: ${scrapedData.trustSignals.certifications.join(", ")}` : ""}

**Authority Signals (Factor 6: Awards, partnerships, endorsements):**
${scrapedData.authoritySignals?.awards && scrapedData.authoritySignals.awards.length > 0 ? `- Awards: ${scrapedData.authoritySignals.awards.slice(0, 3).join(", ")}` : "- No awards found"}
${scrapedData.authoritySignals?.asSeenOn && scrapedData.authoritySignals.asSeenOn.length > 0 ? `- Featured In: ${scrapedData.authoritySignals.asSeenOn.slice(0, 5).join(", ")}` : "- No media mentions found"}
${scrapedData.authoritySignals?.partnerships && scrapedData.authoritySignals.partnerships.length > 0 ? `- Partnerships/Integrations: ${scrapedData.authoritySignals.partnerships.slice(0, 3).join(", ")}` : ""}
${scrapedData.authoritySignals?.expertEndorsements && scrapedData.authoritySignals.expertEndorsements.length > 0 ? `- Expert Endorsements: Found ${scrapedData.authoritySignals.expertEndorsements.length}` : ""}

**Marketing Elements (Factor 5: Advertising approach, CTAs, urgency):**
${scrapedData.marketingElements?.ctas && scrapedData.marketingElements.ctas.length > 0 ? `- Call-to-Actions: ${scrapedData.marketingElements.ctas.slice(0, 5).map((cta) => `"${cta.text}" (${cta.type})`).join(", ")}` : "- No clear CTAs found"}
${scrapedData.marketingElements?.urgencyMessages && scrapedData.marketingElements.urgencyMessages.length > 0 ? `- Urgency/Scarcity Messages: ${scrapedData.marketingElements.urgencyMessages.slice(0, 3).join("; ")}` : "- No urgency messaging detected"}
${scrapedData.marketingElements?.discounts && scrapedData.marketingElements.discounts.length > 0 ? `- Discounts/Promotions: ${scrapedData.marketingElements.discounts.slice(0, 3).join(", ")}` : ""}
${scrapedData.marketingElements?.countdowns ? "- ⚠️ Countdown Timer Detected (can create pressure)" : ""}
${scrapedData.marketingElements?.popups ? "- ⚠️ Popup/Modal Detected (can be intrusive)" : ""}

**Page Content (first 5000 chars):**
${scrapedData.visibleText.substring(0, 5000)}
`;
}

async function enrichWithSSRAnalysis(
  evaluation: ProductEvaluation,
  productUrl: string,
  demographicDescription: string,
  anthropic: Anthropic
) {
  try {
    const prompt = `Based on the research paper "LLMs Reproduce Human Purchase Intent via Semantic Similarity Elicitation of Likert Ratings" (arXiv:2510.08338v1), provide a natural, detailed textual response about purchase intent for this product.

**PRODUCT:** ${productUrl}

**TARGET CUSTOMER:**
${demographicDescription}

**YOUR TASK:** Write a 2-3 paragraph textual response explaining how likely this specific demographic is to purchase this product. Write as if you ARE a person from this demographic sharing your honest thoughts about buying this product.

Consider:
- How well the product fits this demographic's needs and lifestyle
- Price affordability relative to this income level
- Whether the product appeals to this age group and gender
- Regional and cultural factors that might influence the decision
- Trust, brand perception, and social proof relevant to this demographic

Write naturally and conversationally. Be specific about WHY you would or wouldn't buy it. Don't use a rating scale - just explain your thoughts and feelings about purchasing this product.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const textualAnalysis =
      response.content[0].type === "text" ? response.content[0].text : "";

    if (!textualAnalysis) {
      return;
    }

    const ssrResults = await calculateSSR(textualAnalysis);
    const comparison = compareMethodologies(evaluation.overallScore, ssrResults.ssrScore);

    evaluation.ssrScore = ssrResults.ssrScore;
    evaluation.ssrConfidence = ssrResults.ssrConfidence;
    evaluation.ssrMarginConfidence = ssrResults.marginConfidence;
    evaluation.ssrDistribution = ssrResults.ssrDistribution;
    evaluation.textualAnalysis = textualAnalysis;
    evaluation.methodologyComparison = {
      agreement: comparison.agreement,
      factorScore: evaluation.overallScore,
      ssrScore: ssrResults.ssrScore,
      confidenceLevel: comparison.confidenceLevel,
      explanation: comparison.explanation,
    };

    evaluation.buyingIntentProbability = ssrResults.ssrScore;
    evaluation.purchaseIntentAnchor = getAnchorFromSSRScore(ssrResults.ssrScore);
  } catch (error) {
    console.error("SSR calculation failed:", error);
  }
}

async function enrichWithAXAnalysis(
  evaluation: ProductEvaluation,
  productUrl: string,
  anthropic: Anthropic
) {
  try {
    const prompt = createAXEvaluationPrompt(productUrl);
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const agentExperience = parseAgentExperience(text);

    if (agentExperience) {
      evaluation.agentExperience = agentExperience;
    }
  } catch (error) {
    console.error("AX evaluation failed:", error);
  }
}

async function enrichWithSectionRecommendations(
  evaluation: ProductEvaluation,
  productUrl: string,
  demographicDescription: string,
  scrapedData: Awaited<ReturnType<typeof scrapeWebsite>>,
  productInfo: ReturnType<typeof extractProductInfo>,
  demographics: Demographics,
  anthropic: Anthropic
) {
  try {
    if (scrapedData.error || !scrapedData.sectionScreenshots) {
      return;
    }

    const prompt = `Based on your evaluation of ${productUrl} for the target demographic (${demographics.ageRange}, ${demographics.gender}, ${demographics.incomeTier} income), provide a detailed section-by-section breakdown of the website with actionable recommendations.

**YOUR TASK:** For each major section of the website, analyze what's working and what needs improvement. Focus on actionable, specific recommendations.

**EVALUATION FACTORS TO CONSIDER:**
1. **Positioning** (Score: ${evaluation.factors[0]?.score ?? "N/A"}/100)
2. **Pricing** (Score: ${evaluation.factors[1]?.score ?? "N/A"}/100)
3. **Social Proof** (Score: ${evaluation.factors[2]?.score ?? "N/A"}/100)
4. **Trust Signals** (Score: ${evaluation.factors[3]?.score ?? "N/A"}/100)
5. **Marketing Elements** (Score: ${evaluation.factors[4]?.score ?? "N/A"}/100)
6. **Authority Signals** (Score: ${evaluation.factors[5]?.score ?? "N/A"}/100)

**SCRAPED DATA SUMMARY:**
- Pricing: ${productInfo.price}
- Social Proof: ${scrapedData.socialProof?.starRating ? `${scrapedData.socialProof.starRating}/5 stars` : 'No rating'}, ${scrapedData.socialProof?.userCount || 'No user count'}
- Trust Signals: ${scrapedData.trustSignals?.guarantees?.length || 0} guarantees found, ${scrapedData.trustSignals?.securityBadges?.length || 0} security badges
- Marketing: ${scrapedData.marketingElements?.ctas?.length || 0} CTAs, ${scrapedData.marketingElements?.urgencyMessages?.length || 0} urgency messages
- Authority: ${scrapedData.authoritySignals?.awards?.length || 0} awards, ${scrapedData.authoritySignals?.asSeenOn?.length || 0} media mentions

**REQUIRED JSON RESPONSE:**
Return an array of section recommendations. Each section should include:
- section: The section name - **MUST use EXACTLY ONE of these names:**
  * "Pricing"
  * "Social Proof"
  * "Trust Signals"
  * "Marketing Elements"
  * "Features"
- score: The relevant factor score for that section (0-100)
- issues: Array of 2-4 specific problems found in this section
- recommendations: Array of 2-4 actionable improvements for this section
- impact: Priority level ("high", "medium", or "low")

Provide 4-6 section recommendations focusing on the most impactful improvements for this specific demographic.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const sectionJsonMatch = text.match(/\[[\s\S]*\]/);
    if (!sectionJsonMatch) {
      return;
    }

    const sectionedRecommendations: SectionRecommendation[] = JSON.parse(sectionJsonMatch[0]);

    const sectionNameMapping: Record<string, keyof NonNullable<typeof scrapedData.sectionScreenshots>> = {
      Pricing: "pricing",
      "Social Proof": "socialProof",
      "Trust Signals": "trustSignals",
      "Marketing Elements": "marketing",
      Features: "features",
      "Hero Section": "hero",
    };

    for (const section of sectionedRecommendations) {
      const key = sectionNameMapping[section.section];
      if (key && scrapedData.sectionScreenshots?.[key]) {
        section.screenshotPath = scrapedData.sectionScreenshots[key];
        section.isFallbackScreenshot = false;
      } else {
        section.screenshotPath = scrapedData.heroScreenshotPath || scrapedData.screenshotPath;
        section.isFallbackScreenshot = true;
      }
    }

    evaluation.sectionedRecommendations = sectionedRecommendations;
  } catch (error) {
    console.error("Section recommendations generation failed:", error);
  }
}

async function uploadScreenshotsToR2({
  evaluation,
  r2,
  r2BucketName,
  r2AccountId,
  jobId,
}: {
  evaluation: ProductEvaluation;
  r2: S3Client;
  r2BucketName: string;
  r2AccountId: string;
  jobId: string;
}) {
  if (!evaluation.websiteSnapshot) {
    return;
  }

  const uploads = new Map<string, Array<(url: string) => void>>();

  const queue = (localPath: string | undefined, assign: (url: string) => void) => {
    if (!localPath) return;
    if (!existsSync(localPath)) return;
    if (!uploads.has(localPath)) uploads.set(localPath, []);
    uploads.get(localPath)!.push(assign);
  };

  queue(evaluation.websiteSnapshot.screenshotPath, (url) => {
    if (evaluation.websiteSnapshot) {
      evaluation.websiteSnapshot.screenshotPath = url;
    }
  });

  queue(evaluation.websiteSnapshot.heroScreenshotPath, (url) => {
    if (evaluation.websiteSnapshot) {
      evaluation.websiteSnapshot.heroScreenshotPath = url;
    }
  });

  if (evaluation.websiteSnapshot.sectionScreenshots) {
    for (const [section, localPath] of Object.entries(evaluation.websiteSnapshot.sectionScreenshots)) {
      queue(localPath, (url) => {
        if (evaluation.websiteSnapshot?.sectionScreenshots) {
          evaluation.websiteSnapshot.sectionScreenshots[section as keyof SectionScreenshotData] = url;
        }
      });
    }
  }

  if (evaluation.sectionedRecommendations) {
    for (const recommendation of evaluation.sectionedRecommendations) {
      queue(recommendation.screenshotPath, (url) => {
        recommendation.screenshotPath = url;
      });
    }
  }

  for (const [localPath, assignees] of uploads.entries()) {
    const key = `evaluations/${jobId}/${Date.now()}-${path.basename(localPath)}`;
    const file = await readFile(localPath);

    await r2.send(
      new PutObjectCommand({
        Bucket: r2BucketName,
        Key: key,
        Body: file,
        ContentType: "image/png",
      })
    );

    const remoteUrl = `https://pub-${r2AccountId}.r2.dev/${key}`;
    assignees.forEach((assign) => assign(remoteUrl));

    await rm(localPath, { force: true }).catch(() => {});
  }
}
