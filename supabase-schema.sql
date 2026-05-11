-- Run this in Supabase Dashboard > SQL Editor

create table if not exists workouts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  sport text not null default 'running',
  date date not null,
  distance_km numeric(8,2),
  duration_sec integer,
  avg_pace_sec_per_km integer,
  avg_hr integer,
  calories integer,
  notes text,
  raw_json jsonb,
  created_at timestamptz default now()
);

alter table workouts enable row level security;

create policy "Users can manage their own workouts"
  on workouts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
