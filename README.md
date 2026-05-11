# FitLog

A lightweight workout tracker that turns screenshots into structured fitness data. Upload a screenshot from any workout app — Strava, Garmin, Apple Watch, Nike Run Club — and AI automatically extracts the data, saves it to your profile, and gives you insights over time.

**Live app: https://fitlog-two-green.vercel.app**

---

## What it does

- Upload a screenshot of any workout summary
- AI reads the image and extracts: sport, date, distance, duration, pace, heart rate, calories
- You confirm (and optionally edit) the extracted data before saving
- Dashboard shows your full workout history with stats and charts
- Export your data as CSV or a printable PDF report

## How to use it

1. Go to **https://fitlog-two-green.vercel.app**
2. Create a free account with your email and password
3. Click **+ Log Workout**
4. Drop in a screenshot from Strava, Garmin, Apple Watch, or any other app
5. Click **Extract Workout Data** — the AI fills in the fields automatically
6. Review, edit if needed, and click **Save Workout**
7. Your dashboard updates with the new entry, charts, and personal bests

### Supported workout apps
Any app that shows a workout summary screen — Strava, Garmin Connect, Apple Fitness, Nike Run Club, Polar, Whoop, and more.

### Supported sports
Running, cycling, swimming, walking, hiking, strength training, and others.

---

## How it works (high level)

### Frontend
Built with **Next.js 14** (App Router) and **Tailwind CSS**, hosted on **Vercel**.

- Pages live in `src/app/` — each folder is a route (`/dashboard`, `/login`, `/signup`, etc.)
- Client components (marked `'use client'`) handle interactivity — file upload, form state, charts, edit/delete modals
- Server components fetch data directly from Supabase on the server before rendering — no loading spinners for the main dashboard
- **Recharts** powers the three insight charts: weekly distance (bar), pace trend (line), heart rate trend (line)

### Backend
Next.js **API routes** in `src/app/api/` act as the backend — they run server-side on Vercel's edge.

- `POST /api/extract` — receives the uploaded image, sends it to the Groq AI model as base64, parses the returned JSON, and sends it back to the browser
- `POST /api/workouts` — saves a confirmed workout to Supabase
- `GET /api/workouts` — fetches all workouts for the logged-in user

### AI Extraction
Uses **Groq** (free tier) running the `meta-llama/llama-4-scout-17b-16e-instruct` vision model.

The image is converted to base64 in the API route and sent to Groq with a structured prompt that asks for a specific JSON format. The model reads the screenshot and returns fields like distance, duration, pace, and heart rate. The response is parsed and sent back to the user for confirmation before anything is saved.

### Database & Auth
**Supabase** (free tier) provides both the database and authentication.

- Auth: email/password login via Supabase Auth. Sessions are managed through cookies using `@supabase/ssr`
- Database: a single `workouts` table in PostgreSQL with Row Level Security — users can only read and write their own data
- Middleware in `src/middleware.ts` protects the `/dashboard` routes and redirects unauthenticated users to `/login`

### Data flow for a workout upload
```
User drops screenshot
  → browser sends image to POST /api/extract
  → API route sends base64 image to Groq vision model
  → Groq returns JSON with extracted fields
  → browser shows confirmation form pre-filled with extracted data
  → user edits if needed and clicks Save
  → browser sends confirmed data to POST /api/workouts
  → API route inserts row into Supabase
  → dashboard refreshes and shows the new entry
```

---

## Running locally

```bash
git clone https://github.com/supreetsingh672/fitlog.git
cd fitlog
npm install
```

Create a `.env.local` file with:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GROQ_API_KEY=your_groq_api_key
```

Run the Supabase schema in your project's SQL editor (see `supabase-schema.sql`), then:

```bash
npm run dev
```

Open http://localhost:3000.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, Tailwind CSS, Recharts |
| Hosting | Vercel (free tier) |
| Database | Supabase / PostgreSQL (free tier) |
| Auth | Supabase Auth |
| AI extraction | Groq — Llama 4 Scout vision model (free tier) |
| Export | CSV (native), PDF (browser print) |
