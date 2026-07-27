# RobloxFlagged static site

A GitHub Pages-ready community safety directory.

## Deploy

1. Upload all files in this folder to the root of your GitHub repository.
2. In GitHub, open **Settings → Pages**.
3. Choose **Deploy from a branch**, select `main` and `/root`, then save.
4. Keep your existing custom-domain configuration.

## Add a listing

Edit `flagged.txt` and add one line per account:

```text
ROBLOX_USER_ID | Category One, Category Two | Neutral summary | https://evidence-link.example | 2026-07-27 | Under review
```

Use the numeric Roblox user ID rather than a username. The browser fetches the current username, display name, account creation date, and avatar from Roblox's public APIs.

## Important safeguards

- Treat listings as allegations unless independently proven.
- Require evidence and provide an appeal route.
- Never publish addresses, phone numbers, private messages containing personal data, or other doxxing material.
- For severe allegations, use careful labels such as `Sexual misconduct allegation` rather than stating criminal guilt as fact.
- Remove or correct entries promptly when evidence is unreliable.
- Change `appeals@example.com` in `index.html` to your real appeals address.

## Local preview

Opening `index.html` directly may block `flagged.txt` because browsers restrict local file requests. Run a small local server instead:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.
