/**
 * GitHub Actions Trigger Library
 * Triggers GitHub Actions workflows via repository_dispatch
 */

export interface TriggerScrapeJobParams {
  productUrl: string;
  demographics: any;
  jobId: string;
}

/**
 * Trigger GitHub Actions workflow to scrape and evaluate a product
 */
export async function triggerScrapeJob(params: TriggerScrapeJobParams): Promise<boolean> {
  try {
    const { productUrl, demographics, jobId } = params;

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO = process.env.GITHUB_REPO; // Format: "owner/repo"

    if (!GITHUB_TOKEN || !GITHUB_REPO) {
      throw new Error("Missing GITHUB_TOKEN or GITHUB_REPO environment variables");
    }

    const [owner, repo] = GITHUB_REPO.split("/");

    console.log(`🚀 Triggering GitHub Actions workflow for job ${jobId}`);

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/dispatches`,
      {
        method: "POST",
        headers: {
          Accept: "application/vnd.github.v3+json",
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_type: "scrape-product",
          client_payload: {
            productUrl,
            demographics: JSON.stringify(demographics),
            jobId,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("GitHub Actions trigger failed:", errorText);
      throw new Error(`Failed to trigger GitHub Actions: ${response.statusText}`);
    }

    console.log(`✅ GitHub Actions workflow triggered successfully for job ${jobId}`);
    return true;
  } catch (error) {
    console.error("Error triggering GitHub Actions:", error);
    throw error;
  }
}
