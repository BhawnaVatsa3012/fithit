# FitHit

Personal gym, protein and body tracker. Vite app on Vercel, data in Supabase (project parv-app).

## Structure
| File | What it holds |
|---|---|
| `src/catalogue.js` | Exercises (machines, free weights, functional), how-to guides, workout order, knee/back cues, weekly plan, foods (protein + kcal, per gram or per unit), default targets; v4: moods, pain-area rules (swap/skip/cue), sharp-pain rules, red flags, BMI and waist-to-hip lines, MET values |
| `src/model.js` | Pure calculations: validation, totals, time planner, protein by weight, progression, pace, waist-to-hip ratio; v4: `buildRoutine`, `adjustFor`, `bmiOf`, `suggestLoad`, `estimateKcal` |
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
- `fithit_settings`: your targets, My foods, and (v4) height, weight, gender and today's pain areas. Saves are conflict-checked on `updated_at` and blocked until the server copy has loaded, so an offline phone can't overwrite them.
- In the app: Progress → Targets & settings → Export (JSON download) or Delete (everything).

## Today's routine (v4)
On the Log tab, today only: pick **Heavy workout**, **Light** or **Only cardio**. The first time each day FitHit asks about pain (one tap for "same as last time").
- Niggle: moves that load the area are swapped or skipped (`TROUBLE_RULES`), and the rest get a cue.
- Sharp pain today: the whole region is rested (`SHARP_RULES`), with a red-flag warning.
- Heavy and light days add free weights from `FREE_ADD` (rotating daily); your usual moves are planned first, extras only if time allows.
- Height + weight give BMI (Indian lines: 23 / 25) to steer cardio, and a kcal estimate (MET × kg × hours, 2024 Compendium). Gender sets the waist-to-hip line (0.85 / 0.90, WHO).
- The mood is saved with the day and shown in Recent sessions.

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
