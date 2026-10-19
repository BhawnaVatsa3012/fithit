# FitHit

Personal gym, protein and body tracker. Vite app on Vercel, data in Supabase (project parv-app).

## Structure
| File | What it holds |
|---|---|
| `src/catalogue.js` | Exercises (machines, free weights, functional), how-to guides, workout order, knee/back cues, weekly plan, foods (protein + kcal, per gram or per unit), default targets |
| `src/model.js` | Pure calculations: validation, totals, time planner, protein by weight, progression, pace, waist-to-hip ratio |
| `src/store.js` | All Supabase calls, conflict-checked saves, on-device cache and unsaved drafts |
| `src/state.js` | Shared app state |
| `src/views.js` | The five screens (Log, Meals, Guide, Progress, Calendar) and sign-in |
| `src/main.js` | Wiring: rendering, taps and typing, saving, start-up |
| `supabase/migrations/` | Database setup, versioned with the code |
| `tests/` | `npm test` runs the calculation tests |

Personal numbers (targets, weights) are never stored in this repo. They live in your account's `fithit_settings` row.

## Data and privacy
- `fithit_days`: one row per day (workout, loads, knee, meals, body check-in). Row-level security: only the owner can read or write.
- `fithit_members`: the single account allowed to use FitHit. Anyone else who signs in sees "Not set up for this account".
- `fithit_settings`: your targets and My foods.
- In the app: Progress → Targets & settings → Export (JSON download) or Delete (everything).

## Deploying a change
1. Commit to `main`. Vercel builds and deploys automatically.
2. If the change includes a new file in `supabase/migrations/`, apply it to parv-app (Supabase dashboard → SQL editor, or ask Claude).

## First-time setup / new owner
Apply the migrations, then run `supabase/seed_owner.sql` with your email **before** sharing the link.

## Local development
npm install
npm run dev
npm test
npx -y eslint@9 src tests   # optional code check (uses eslint.config.js)
