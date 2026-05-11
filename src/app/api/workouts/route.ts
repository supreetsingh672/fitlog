import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { sport, date, distance_km, duration_sec, avg_pace_sec_per_km, avg_hr, calories, notes, raw_json } = body

  const { data, error } = await supabase
    .from('workouts')
    .insert({
      user_id: user.id,
      sport,
      date,
      distance_km: distance_km || null,
      duration_sec: duration_sec || null,
      avg_pace_sec_per_km: avg_pace_sec_per_km || null,
      avg_hr: avg_hr || null,
      calories: calories || null,
      notes: notes || null,
      raw_json: raw_json || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
