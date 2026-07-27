name: Build and deploy site

on:
  push:
    branches: [main]
  workflow_dispatch:
  schedule:
    - cron: '17 6 * * *'

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Check out repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Fetch Roblox profiles and avatars
        run: node scripts/build-data.mjs

      - name: Configure GitHub Pages
        uses: actions/configure-pages@v5

      - name: Upload site artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
