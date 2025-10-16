# 🚀 Netlify Deployment Guide - AI Product Evaluator

This guide will walk you through deploying your AI Product Evaluator to Netlify with GitHub Actions handling Playwright scraping.

---

## 📋 Prerequisites

- GitHub account
- Netlify account
- Neon PostgreSQL database
- Cloudflare R2 account (for screenshot storage)
- Anthropic API key

---

## 🔧 Step 1: Set Up Cloudflare R2

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2 Object Storage**
3. Click **Create bucket**
   - Bucket name: `ai-evaluator-screenshots`
4. Go to **Manage R2 API Tokens**
5. Click **Create API Token**
   - Permissions: **Edit** (Read & Write)
   - Copy the credentials:
     - `Access Key ID`
     - `Secret Access Key`
     - `Account ID`

---

## 🗄️ Step 2: Set Up Neon Database

1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project (or use existing)
3. Copy your **Connection String** (starts with `postgresql://`)
4. Run the database initialization:
   ```bash
   npm run dev
   ```
   Then visit: `http://localhost:3000/api/init-db`

This creates the `evaluations` and `evaluation_jobs` tables.

---

## 🐙 Step 3: Push Code to GitHub

### 3.1 Create GitHub Repository

1. Go to https://github.com/SohniSwatantra
2. Click **New repository**
3. Repository name: `ai-product-evaluator`
4. Make it **Public** or **Private** (your choice)
5. **Do NOT** initialize with README (we already have code)
6. Click **Create repository**

### 3.2 Push Your Code

```bash
# Check Git status
git status

# Add all files
git add .

# Commit changes
git commit -m "Initial commit - Netlify deployment ready"

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/SohniSwatantra/ai-product-evaluator.git

# Push to GitHub
git push -u origin main
```

---

## 🔐 Step 4: Configure GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add the following secrets:

| Secret Name               | Value                                      |
|---------------------------|--------------------------------------------|
| `DATABASE_URL`            | Your Neon PostgreSQL connection string     |
| `ANTHROPIC_API_KEY`       | Your Anthropic API key                     |
| `R2_ACCOUNT_ID`           | Cloudflare R2 Account ID                   |
| `R2_ACCESS_KEY_ID`        | Cloudflare R2 Access Key ID                |
| `R2_SECRET_ACCESS_KEY`    | Cloudflare R2 Secret Access Key            |
| `R2_BUCKET_NAME`          | `ai-evaluator-screenshots`                 |

---

## 🌐 Step 5: Deploy to Netlify

### 5.1 Connect GitHub to Netlify

1. Go to [Netlify](https://www.netlify.com/)
2. Click **Add new site** → **Import an existing project**
3. Choose **GitHub**
4. Authorize Netlify to access your repositories
5. Select `ai-product-evaluator`

### 5.2 Configure Build Settings

Netlify should auto-detect Next.js. Verify:

- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Functions directory**: (leave empty)

### 5.3 Add Environment Variables

Click **Add environment variables** and add:

| Variable Name                              | Value                                      |
|--------------------------------------------|--------------------------------------------|
| `DATABASE_URL`                             | Your Neon PostgreSQL connection string     |
| `ANTHROPIC_API_KEY`                        | Your Anthropic API key                     |
| `GITHUB_TOKEN`                             | Create a GitHub Personal Access Token (see below) |
| `GITHUB_REPO`                              | `SohniSwatantra/ai-product-evaluator`      |
| `R2_ACCOUNT_ID`                            | Cloudflare R2 Account ID                   |
| `R2_ACCESS_KEY_ID`                         | Cloudflare R2 Access Key ID                |
| `R2_SECRET_ACCESS_KEY`                     | Cloudflare R2 Secret Access Key            |
| `R2_BUCKET_NAME`                           | `ai-evaluator-screenshots`                 |
| `NEXT_PUBLIC_STACK_PROJECT_ID`             | Your Stack Auth Project ID                 |
| `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY` | Your Stack Auth Publishable Client Key     |
| `STACK_SECRET_SERVER_KEY`                  | Your Stack Auth Secret Server Key          |

### 5.4 Create GitHub Personal Access Token

1. Go to GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Click **Generate new token (classic)**
3. Name: `Netlify CI/CD Token`
4. Scopes: Check **repo** (all sub-scopes)
5. Click **Generate token**
6. Copy the token and add it to Netlify as `GITHUB_TOKEN`

### 5.5 Deploy

Click **Deploy site**

Netlify will:
- Build your Next.js app
- Deploy to a `.netlify.app` URL
- Automatically redeploy on every `git push`

---

## ✅ Step 6: Test the Deployment

1. Visit your Netlify URL (e.g., `https://your-app.netlify.app`)
2. Enter a product URL and demographics
3. Click **Analyze**
4. You should see "Processing..." while GitHub Actions runs Playwright
5. Results will appear in ~30-60 seconds

---

## 🔍 How It Works

### Architecture Flow:

```
User → Netlify App → Trigger GitHub Actions
                          ↓
                    Playwright Scrapes
                          ↓
                    Saves to Neon DB
                          ↓
                    Uploads to R2
                          ↓
            Netlify App Polls DB for Results
```

### Why This Works:

- **Netlify**: Hosts your Next.js app (fast, CDN-distributed)
- **GitHub Actions**: Runs Playwright (no timeout/memory limits)
- **Neon DB**: Stores evaluations permanently
- **Cloudflare R2**: Stores screenshots (free 10GB)

---

## 🐛 Troubleshooting

### Issue: GitHub Actions Not Triggering

**Solution**: Check that `GITHUB_TOKEN` has **repo** scope and `GITHUB_REPO` is `owner/repo` format.

### Issue: Playwright Fails in GitHub Actions

**Solution**: Check GitHub Actions logs at `https://github.com/SohniSwatantra/ai-product-evaluator/actions`

### Issue: Database Connection Error

**Solution**: Verify `DATABASE_URL` is correct and database tables exist (visit `/api/init-db`).

### Issue: Screenshots Not Uploading to R2

**Solution**: Verify R2 credentials are correct and bucket is public.

---

## 📊 Monitoring

- **Netlify Deploys**: https://app.netlify.com/sites/[your-site]/deploys
- **GitHub Actions**: https://github.com/SohniSwatantra/ai-product-evaluator/actions
- **Neon Database**: https://console.neon.tech/

---

## 🎉 Success!

Your AI Product Evaluator is now live on Netlify with Playwright running in GitHub Actions!

**Next Steps**:
1. Add a custom domain in Netlify
2. Set up analytics
3. Monitor usage and costs

---

## 📝 Cost Estimates

| Service          | Free Tier                | Expected Cost   |
|------------------|--------------------------|-----------------|
| Netlify          | 100GB bandwidth/month    | $0 (likely)     |
| GitHub Actions   | 2000 minutes/month       | $0 (likely)     |
| Neon DB          | 512MB storage            | $0 (likely)     |
| Cloudflare R2    | 10GB storage free        | $0 (likely)     |
| Anthropic API    | Pay-as-you-go            | ~$0.01/eval     |

**Total estimated cost**: ~$0-10/month depending on usage

---

## 🚨 Important Notes

1. **GitHub Actions runs on every evaluation** - No timeout limits!
2. **Screenshots are stored in R2** - Not in the repo
3. **Database stores results** - Query from Netlify app
4. **Async processing** - Results appear after Playwright finishes

---

## ⚙️ Advanced Configuration

### Enable Custom Domain:

1. Netlify → **Domain settings** → **Add custom domain**
2. Follow DNS configuration instructions

### Enable Branch Deploys:

1. Netlify → **Site configuration** → **Build & deploy**
2. Enable **Deploy previews** for pull requests

---

## 📚 Additional Resources

- [Netlify Docs](https://docs.netlify.com/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Playwright CI Guide](https://playwright.dev/docs/ci-intro)
- [Neon Docs](https://neon.tech/docs/introduction)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)

---

**Questions?** Check the GitHub Issues or Netlify support forums.

Happy deploying! 🚀
