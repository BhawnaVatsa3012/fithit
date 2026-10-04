# FitHit

Personal gym and protein tracker. Vite app, deployed on Vercel, data in Supabase.

## What's inside
- `index.html` – page shell
- `src/main.js` – all app logic: weekly plan, knee/back cues, logging, meals and protein, progress, calendar, sign-in, saving
- `src/style.css` – the "Scoreboard" design from Claude Design
- `src/config.js` – public Supabase connection details (project: parv-app)

## Data
One row per logged day in the `fithit_days` table (Supabase project parv-app).
Row-level security means only your signed-in account can read or write your rows.

## Run locally (optional)
npm install
npm run dev

## Deploy
Every push to the `main` branch redeploys on Vercel automatically.
