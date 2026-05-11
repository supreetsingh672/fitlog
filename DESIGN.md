# FitLog — Design Document

## What is this

FitLog is a personal fitness tracking web app. Users upload screenshots of workout summaries from any app (Strava, Garmin, Apple Watch, etc.) and an AI vision model reads the image and extracts structured data — distance, duration, pace, heart rate, calories. That data is saved to a database and displayed as a workout log with charts and insights.

---

## Live URLs

| | URL |
|---|---|
| App | https://fitlog-two-green.vercel.app |
| GitHub | https://github.com/supreetsingh672/fitlog |
| Vercel dashboard | https://vercel.com/supreet-singh-projectz/fitlog |
| Supabase dashboard | https://supabase.com/dashboard/project/xfyhsioquczvitmjbtcf |

---

## Architecture overview

```
Browser
  ↕
Next.js app (Vercel)
  ├── Server components  →  fetch data from Supabase and render HTML
  ├── Client components  →  interactivity (upload, charts, modals)
  └── API routes         →  POST /api/extract (Groq AI)
                            POST /api/workouts (save to DB)
                            GET  /api/workouts (fetch from DB)
  ↕                              ↕
Supabase                       Groq
(PostgreSQL + Auth)            (Llama 4 vision model)
```

---

## Folder structure

```
fitlog/
├── src/
│   ├── app/
│   │   ├── page.tsx                  ← landing page
│   │   ├── login/page.tsx            ← login page
│   │   ├── signup/page.tsx           ← signup page
│   │   ├── dashboard/
│   │   │   ├── layout.tsx            ← nav bar, auth guard
│   │   │   ├── page.tsx              ← main dashboard (stats, charts, workout list)
│   │   │   └── upload/page.tsx       ← screenshot upload + extraction flow
│   │   └── api/
│   │       ├── extract/route.ts      ← sends image to Groq, returns extracted JSON
│   │       └── workouts/route.ts     ← GET and POST workouts in Supabase
│   ├── components/
│   │   ├── Charts.tsx                ← recharts: weekly distance, pace trend, HR trend
│   │   ├── WorkoutList.tsx           ← workout cards with edit and delete
│   │   ├── ExportButtons.tsx         ← CSV download and PDF report
│   │   └── LogoutButton.tsx          ← signs out via Supabase Auth
│   ├── lib/
│   │   ├── supabase/client.ts        ← Supabase client for browser
│   │   └── supabase/server.ts        ← Supabase client for server components
│   └── middleware.ts                 ← redirects unauthenticated users away from /dashboard
├── supabase-schema.sql               ← DB schema to run in Supabase SQL editor
├── .env.local                        ← secret keys (not committed to git)
└── DESIGN.md                         ← this file
```

---

## Database

Single table in Supabase PostgreSQL:

```sql
workouts (
  id                   uuid  primary key
  user_id              uuid  references auth.users
  sport                text  (running, cycling, swimming, walking, hiking, strength, other)
  date                 date
  distance_km          numeric
  duration_sec         integer
  avg_pace_sec_per_km  integer
  avg_hr               integer
  calories             integer
  notes                text
  raw_json             jsonb  (raw AI output stored for debugging)
  created_at           timestamptz
)
```

Row Level Security is enabled — users can only see and modify their own rows.

---

## Auth

Email + password via Supabase Auth. Sessions are stored in cookies and managed by `@supabase/ssr`.

The middleware at `src/middleware.ts` runs on every request to `/dashboard/*`. If there is no valid session cookie, it redirects to `/login`.

---

## AI extraction flow

1. User drops an image on the upload page
2. Browser sends the image as `multipart/form-data` to `POST /api/extract`
3. The API route converts the image to base64 and sends it to Groq with a structured prompt
4. Groq runs Llama 4 Scout (vision model) and returns a JSON object with the workout fields
5. The API route parses the JSON and returns it to the browser
6. The browser pre-fills a confirmation form with the extracted values
7. User can edit any field, then clicks Save
8. Browser sends the confirmed data to `POST /api/workouts`
9. API route inserts the row into Supabase

---

## Environment variables

Stored in `.env.local` locally and in Vercel's Environment Variables for production.

| Variable | What it is |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key (safe to expose) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase secret key (server-side only) |
| `GROQ_API_KEY` | Groq API key for AI extraction |

`NEXT_PUBLIC_` prefix means the variable is available in the browser. The service role key and Groq key are never sent to the browser.

---

## Tech stack

| Layer | Technology | Free tier |
|---|---|---|
| Framework | Next.js 14 (App Router) | Yes |
| Styling | Tailwind CSS | Yes |
| Hosting | Vercel | Yes |
| Database | Supabase / PostgreSQL | 500MB |
| Auth | Supabase Auth | 50k users |
| AI | Groq — Llama 4 Scout vision | Yes |
| Charts | Recharts | Yes (library) |
| Export | CSV native, PDF via browser print | Yes |

---

## How to make changes and deploy

### 1. Edit code locally

```bash
cd /Users/supreet/fitlog
npm run dev
```

Open http://localhost:3000. The app hot-reloads as you save files.

### 2. Test your changes

Make sure the feature works end to end — sign up, upload a screenshot, check the dashboard. Fix any errors shown in the terminal.

### 3. Deploy to production

```bash
git add .
git commit -m "describe what you changed"
git push
```

That's it. Vercel detects the push to the `main` branch and automatically deploys. The live site updates in about 60 seconds. You can watch the build at https://vercel.com/supreet-singh-projectz/fitlog.

### 4. Adding environment variables

If you add a new API key or secret, add it in two places:
- `.env.local` for local development
- Vercel dashboard → Project → Settings → Environment Variables for production

---

## Common things you might want to change

**Change the AI model**
Edit `src/app/api/extract/route.ts` — change the `model` field in the Groq API call. Any Groq vision model works.

**Add a new field to workouts**
1. Add the column in Supabase SQL editor: `ALTER TABLE workouts ADD COLUMN new_field text;`
2. Update the extraction prompt in `src/app/api/extract/route.ts` to ask for the new field
3. Add the field to the confirmation form in `src/app/dashboard/upload/page.tsx`
4. Display it in `src/components/WorkoutList.tsx`

**Add a new chart**
Add a new chart component or extend `src/components/Charts.tsx`. All chart data is derived from the `workouts` array passed as a prop.

**Change the app's color scheme**
The primary color is orange (`orange-500` in Tailwind). Find and replace `orange-500`, `orange-400`, `orange-600` across the component files.

**Add Google login**
1. Create OAuth credentials in Google Cloud Console
2. Enable Google provider in Supabase → Authentication → Sign In / Providers
3. Add a "Sign in with Google" button that calls `supabase.auth.signInWithOAuth({ provider: 'google' })`

---

## Monitoring and analytics

- **Vercel** → Analytics tab — page views, visitors, countries
- **Supabase** → Reports — database usage, API requests, active users
- **Groq** → console.groq.com — API usage and rate limits
