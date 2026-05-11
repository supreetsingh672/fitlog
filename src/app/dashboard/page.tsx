import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Charts from '@/components/Charts'
import WorkoutList from '@/components/WorkoutList'
import ExportButtons from '@/components/ExportButtons'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: workouts } = await supabase
    .from('workouts')
    .select('*')
    .order('date', { ascending: false })

  const w = workouts ?? []
  const totalKm = w.reduce((sum, x) => sum + (Number(x.distance_km) || 0), 0)
  const totalWorkouts = w.length
  const totalCalories = w.reduce((sum, x) => sum + (x.calories || 0), 0)

  const runs = w.filter(x => x.sport === 'running' && x.distance_km)
  const longestRun = runs.reduce((best, x) => Number(x.distance_km) > Number(best?.distance_km ?? 0) ? x : best, null as typeof w[0] | null)
  const fastestPace = runs.filter(x => x.avg_pace_sec_per_km).reduce((best, x) => {
    if (!best) return x
    return x.avg_pace_sec_per_km! < best.avg_pace_sec_per_km! ? x : best
  }, null as typeof w[0] | null)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Your Workouts</h1>
        {w.length > 0 && <ExportButtons workouts={w} />}
      </div>

      {/* Stats */}
      {totalWorkouts > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{totalWorkouts}</p>
            <p className="text-gray-500 text-sm mt-1">Workouts</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{totalKm.toFixed(1)}</p>
            <p className="text-gray-500 text-sm mt-1">Total km</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{totalCalories > 0 ? totalCalories.toLocaleString() : '—'}</p>
            <p className="text-gray-500 text-sm mt-1">Calories</p>
          </div>
        </div>
      )}

      {/* Personal Bests */}
      {(longestRun || fastestPace) && (
        <div className="grid grid-cols-2 gap-4 mb-8">
          {longestRun && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Longest Run</p>
              <p className="text-xl font-bold text-orange-400">{Number(longestRun.distance_km).toFixed(2)} km</p>
              <p className="text-gray-600 text-xs mt-1">{new Date(longestRun.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>
          )}
          {fastestPace && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Best Pace</p>
              <p className="text-xl font-bold text-orange-400">
                {Math.floor(fastestPace.avg_pace_sec_per_km! / 60)}:{String(fastestPace.avg_pace_sec_per_km! % 60).padStart(2, '0')}/km
              </p>
              <p className="text-gray-600 text-xs mt-1">{new Date(fastestPace.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>
          )}
        </div>
      )}

      {/* Charts */}
      <Charts workouts={w} />

      {/* Workout list */}
      {w.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📸</div>
          <p className="text-gray-400 text-lg mb-2">No workouts yet</p>
          <p className="text-gray-600 text-sm mb-6">Upload a screenshot to get started</p>
          <Link href="/dashboard/upload" className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors">
            Log your first workout
          </Link>
        </div>
      ) : (
        <WorkoutList workouts={w} />
      )}
    </div>
  )
}
