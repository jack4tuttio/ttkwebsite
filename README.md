# RobloxFlagged — GitHub Pages site

This version fixes Roblox avatars and profile names on GitHub Pages.

## Why the old version failed

A GitHub Pages site runs entirely in a visitor's browser. Direct browser requests to Roblox API domains can be blocked by cross-origin (CORS) rules. This version has a GitHub Action call Roblox's API during deployment, save the results to `data.json`, and then publish the static site.

## Deploy

1. Upload **everything**, including the hidden `.github` folder, to the root of your repository.
2. Open the repository's **Settings → Pages**.
3. Under **Build and deployment → Source**, select **GitHub Actions**.
4. Open the **Actions** tab and run **Build and deploy site** once, or push a commit to `main`.
5. Wait for the workflow to finish, then reload your custom domain.

The workflow also refreshes Roblox names and avatars once per day.

## Add a listing

Edit `flagged.txt` and add one line per account:

```text
ROBLOX_USER_ID | Category One, Category Two | Neutral summary | https://evidence-link.example | 2026-07-27 | Under review
```

Use the numeric Roblox user ID. Committing a change to `flagged.txt` automatically rebuilds and deploys the site.

## Test locally

Generate `data.json`, then start a local server:

```bash
node scripts/build-data.mjs
python -m http.server 8000
```

Open `http://localhost:8000`.

## Important safeguards

- Treat listings as allegations unless independently proven.
- Require evidence and provide a working appeal route.
- Never publish private identifying information or doxxing material.
- Use careful, neutral wording for severe allegations.
- Remove or correct entries promptly when evidence is unreliable.
- Replace `appeals@example.com` in `index.html` with your real appeals address.
