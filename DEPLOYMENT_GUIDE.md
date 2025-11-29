# Deployment Guide - AI Product Evaluator

This guide will help you deploy your AI Product Evaluator to Netlify with GitHub Actions for Playwright scraping.

## Architecture Overview

```
User Request → Next.js App (Netlify) → Creates Job in DB → Triggers GitHub Actions
                                                              ↓
                                            GitHub Actions runs Playwright + Claude Opus 4.5
                                                              ↓
                                            Saves results to Database + R2
                                                              ↓
                                            Frontend polls for results
```

---

## Step 1: GitHub Secrets Configuration ✅ COMPLETED

The following secrets have been added to your GitHub repository:

- ✅ `DATABASE_URL` - Neon database connection
- ✅ `ANTHROPIC_API_KEY` - Claude API key
- ✅ `R2_ACCOUNT_ID` - Cloudflare R2 account (placeholder - update needed)
- ✅ `R2_ACCESS_KEY_ID` - R2 access key (placeholder - update needed)
- ✅ `R2_SECRET_ACCESS_KEY` - R2 secret (placeholder - update needed)
- ✅ `R2_BUCKET_NAME` - Screenshot storage bucket

**⚠️ Action Required: Update R2 Credentials**

To get R2 credentials:
1. Go to https://dash.cloudflare.com
2. Navigate to R2 Object Storage
3. Create a bucket named `ai-evaluator-screenshots`
4. Generate API tokens with R2 read/write permissions
5. Update these secrets at: https://github.com/SohniSwatantra/ai-product-evaluator-opus/settings/secrets/actions

---

## Step 2: Create GitHub Personal Access Token

You need a Personal Access Token (PAT) for Netlify to trigger GitHub Actions.

### Steps:

1. Go to https://github.com/settings/tokens/new
2. Create a **Fine-grained token** or **Classic token**
3. **Required scopes:**
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
4. **Expiration:** Choose "No expiration" or set a long duration
5. Click **Generate token**
6. **COPY THE TOKEN** - you won't see it again!

---

## Step 3: Configure Netlify Environment Variables

Once you deploy to Netlify, add these environment variables in the Netlify dashboard:

### Required Netlify Environment Variables:

#### **Database & API Keys:**
```
DATABASE_URL=<your_neon_database_url>

ANTHROPIC_API_KEY=<your_anthropic_api_key>
```

**Note:** Use the same values from your `.env.local` file

#### **GitHub Actions Integration:**
```
GITHUB_TOKEN=<your_personal_access_token_from_step_2>
GITHUB_REPO=SohniSwatantra/ai-product-evaluator-opus
```

#### **Stack Auth (Authentication):**
```
NEXT_PUBLIC_STACK_PROJECT_ID=<your_stack_project_id>
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=<your_stack_publishable_key>
STACK_SECRET_SERVER_KEY=<your_stack_secret_key>
```

**Note:** Use the same values from your `.env.local` file

### How to Add Environment Variables in Netlify:

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Click **Add a variable**
4. Add each variable name and value
5. Click **Save**

---

## Step 4: Deploy to Netlify

### Option A: Deploy via Netlify Dashboard (Recommended)

1. Go to https://app.netlify.com
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub** as the Git provider
4. Select your repository: `SohniSwatantra/ai-product-evaluator-opus`
5. Configure build settings:
   - **Build command:** `npx playwright install --with-deps chromium && npm run build`
   - **Publish directory:** `.next`
   - **Base directory:** (leave empty)
6. Click **"Deploy site"**
7. After deployment, add the environment variables (Step 3)

### Option B: Deploy via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize and deploy
netlify init

# Deploy
netlify deploy --prod
```

---

## Step 5: Update Local Development Environment

Update your `.env.local` file with the GitHub token:

```bash
GITHUB_TOKEN=<your_personal_access_token>
```

Then restart your development server:

```bash
npm run dev
```

---

## Step 6: Test the Complete Flow

### Test Locally:

1. Start the dev server: `npm run dev`
2. Navigate to http://localhost:3000
3. Enter a product URL (e.g., `https://amazon.com/dp/B08N5WRWNW`)
4. Select demographics
5. Click **"Analyze Buying Intent"**
6. Watch the GitHub Actions workflow run at: https://github.com/SohniSwatantra/ai-product-evaluator-opus/actions

### Test on Netlify:

1. Deploy your site to Netlify
2. Visit your Netlify URL
3. Test the same flow
4. Verify GitHub Actions triggers successfully

---

## Troubleshooting

### Issue: "GITHUB_TOKEN is not configured"

**Solution:** Add `GITHUB_TOKEN` to Netlify environment variables (Step 3)

### Issue: GitHub Actions not triggering

**Possible causes:**
1. Token doesn't have `workflow` scope
2. Token expired
3. Repository name mismatch in `GITHUB_REPO`

**Solution:** Verify token scopes and regenerate if needed

### Issue: R2 screenshot upload fails

**Solution:** Update R2 credentials in GitHub Secrets:
- Go to https://github.com/SohniSwatantra/ai-product-evaluator-opus/settings/secrets/actions
- Update `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`

### Issue: Playwright fails in GitHub Actions

**Solution:** The workflow already installs Playwright with dependencies. Check:
- GitHub Actions logs at: https://github.com/SohniSwatantra/ai-product-evaluator-opus/actions
- Ensure secrets are set correctly

---

## Summary Checklist

- ✅ GitHub Secrets configured
- ⏳ Create GitHub Personal Access Token
- ⏳ Deploy to Netlify
- ⏳ Add Netlify environment variables
- ⏳ Get R2 credentials and update GitHub Secrets
- ⏳ Test the complete flow

---

## Next Steps

1. Create GitHub Personal Access Token (Step 2)
2. Deploy to Netlify (Step 4)
3. Add environment variables to Netlify (Step 3)
4. Get R2 credentials and update GitHub Secrets
5. Test the application!

**Repository:** https://github.com/SohniSwatantra/ai-product-evaluator-opus

**Questions?** Check the GitHub Actions logs or Netlify deploy logs for detailed error messages.
