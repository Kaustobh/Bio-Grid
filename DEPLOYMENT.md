# GitHub Pages Deployment & CI/CD Guide

This guide details the build configuration, workflow execution, asset routing, and troubleshooting steps for hosting **Bio Grid** live on **GitHub Pages**.

---

## 🎯 Hosting Strategy Overview

Next.js projects deployed to GitHub Pages operate as static site exports (`output: "export"`). Because GitHub Pages hosts sites either under user root domains (`https://<username>.github.io`) or repository subpaths (`https://<username>.github.io/<repo-name>/`), static asset resolution requires specific build parameters.

```
Push to main branch ──► GitHub Actions Workflow (.github/workflows/deploy.yml)
                                  │
                                  ├──► Next.js Static Export (`npm run build`)
                                  ├──► Create `out/.nojekyll` & `out/404.html`
                                  └──► Deploy `out/` folder to GitHub Pages
```

---

## ⚙️ Configuration Setup

### 1. Next.js Static Export (`next.config.ts`)
The project utilizes `output: "export"` and `images: { unoptimized: true }` to bundle static assets into the `./out` directory without requiring a Node.js server runtime:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || "",
};

export default nextConfig;
```

### 2. GitHub Actions Automated Pipeline (`.github/workflows/deploy.yml`)
The repository includes an automated CI/CD pipeline triggered on every commit to `main`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - name: Build Project
        env:
          NEXT_PUBLIC_BASE_PATH: /${{ github.event.repository.name }}
        run: npm run build
      - name: Add .nojekyll File
        run: touch out/.nojekyll
      - name: Add 404.html Fallback
        run: cp out/index.html out/404.html
      - uses: actions/upload-pages-artifact@v3
        with:
          path: './out'

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

---

## 🔧 Repository Deployment Settings

Follow these steps in your GitHub Repository to enable GitHub Actions deployment:

1. Navigate to your repository on GitHub: `https://github.com/<username>/<repo-name>`
2. Click **Settings** in the top navigation bar.
3. Under the **Code and automation** sidebar section, select **Pages**.
4. Under **Build and deployment**:
   - **Source**: Select **GitHub Actions** from the dropdown menu.
5. Push a commit to the `main` branch to trigger the build workflow.

---

## 🛠️ Troubleshooting Matrix

| Issue / Error Symptom | Root Cause | Resolution Strategy |
|---|---|---|
| **Blank White Screen on Load** | Asset URL mismatch due to subpath hosting (missing `basePath`). | Ensure `NEXT_PUBLIC_BASE_PATH` is passed during build or set `basePath` in `next.config.ts`. |
| **Missing CSS/JS Assets (404 on `_next/*`)** | GitHub Pages Jekyll processor ignores folders starting with an underscore (`_next`). | Add a `.nojekyll` file inside the build output root (`out/.nojekyll`). |
| **404 Error on Direct Route Refresh (`/body-mapping`)** | GitHub Pages static server does not support server-side SPA route rewrites natively. | Include `out/404.html` fallback redirect script or copy `index.html` to `404.html`. |
| **Broken Images / 3D Textures** | Next.js image optimization endpoint (`/_next/image`) unavailable on static export. | Set `images: { unoptimized: true }` in `next.config.ts`. |
| **Build Timeout / Memory Error** | Turbopack cache congestion during GitHub Actions runner execution. | Use `node-version: 20` and run clean `npm ci` before `npm run build`. |

---

## 📦 Alternative: Manual `gh-pages` Deployment

If you prefer manual deployment over GitHub Actions:

```bash
# 1. Install gh-pages CLI helper
npm install --save-dev gh-pages

# 2. Add deploy script to package.json:
# "deploy": "next build && touch out/.nojekyll && gh-pages -d out -b gh-pages"

# 3. Execute deployment
npm run deploy
```

Then in **Settings > Pages**, set **Source** to `Deploy from a branch`, choose branch `gh-pages`, folder `/ (root)`.
