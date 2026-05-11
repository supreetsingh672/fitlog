'use client'

import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'

interface Workout {
  id: string
  sport: string
  date: string
  distance_km: number | null
  duration_sec: number | null
  avg_pace_sec_per_km: number | null
  avg_hr: number | null
  calories: number | null
}

function formatPace(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function getWeekLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function buildWeeklyDistance(workouts: Workout[]) {
  const map: Record<string, number> = {}
  workouts.forEach(w => {
    if (!w.distance_km) return
    const d = new Date(w.date + 'T00:00:00')
    const day = d.getDay()
    const monday = new Date(d)
    monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
    const key = monday.toISOString().slice(0, 10)
    map[key] = (map[key] ?? 0) + Number(w.distance_km)
  })
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-10)
    .map(([date, km]) => ({ week: getWeekLabel(date), km: Math.round(km * 100) / 100 }))
}

function buildPaceTrend(workouts: Workout[]) {
  return workouts
    .filter(w => w.avg_pace_sec_per_km && w.sport === 'running')
    .slice(0, 20)
    .reverse()
    .map(w => ({
      date: getWeekLabel(w.date),
      pace: w.avg_pace_sec_per_km!,
      paceLabel: formatPace(w.avg_pace_sec_per_km!),
    }))
}

function buildHRTrend(workouts: Workout[]) {
  return workouts
    .filter(w => w.avg_hr)
    .slice(0, 20)
    .reverse()
    .map(w => ({
      date: getWeekLabel(w.date),
      hr: w.avg_hr!,
    }))
}

const CustomPaceTooltip = ({ active, payload, label }: { active?: boolean; payload?: {value: number}[]; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm">
        <p className="text-gray-400">{label}</p>
        <p className="text-orange-400 font-medium">{formatPace(payload[0].value)}/km</p>
      </div>
    )
  }
  return null
}

const CustomDistTooltip = ({ active, payload, label }: { active?: boolean; payload?: {value: number}[]; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm">
        <p className="text-gray-400">Week of {label}</p>
        <p className="text-orange-400 font-medium">{payload[0].value} km</p>
      </div>
    )
  }
  return null
}

const CustomHRTooltip = ({ active, payload, label }: { active?: boolean; payload?: {value: number}[]; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm">
        <p className="text-gray-400">{label}</p>
        <p className="text-red-400 font-medium">{payload[0].value} bpm</p>
      </div>
    )
  }
  return null
}

export default function Charts({ workouts }: { workouts: Workout[] }) {
  const weeklyDist = buildWeeklyDistance(workouts)
  const paceTrend = buildPaceTrend(workouts)
  const hrTrend = buildHRTrend(workouts)

  if (workouts.length < 2) return null

  return (
    <div className="space-y-6 mb-8">
      <h2 className="text-lg font-semibold text-white">Insights</h2>

      {/* Weekly Distance */}
      {weeklyDist.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-sm text-gray-400 mb-4">Weekly Distance (km)</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyDist} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="week" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip content={<CustomDistTooltip />} cursor={{ fill: 'rgba(249,115,22,0.08)' }} />
              <Bar dataKey="km" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Pace Trend */}
      {paceTrend.length > 1 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-sm text-gray-400 mb-4">Running Pace Trend (lower = faster)</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={paceTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={40}
                reversed
                tickFormatter={formatPace}
              />
              <Tooltip content={<CustomPaceTooltip />} />
              <Line
                type="monotone"
                dataKey="pace"
                stroke="#f97316"
                strokeWidth={2}
                dot={{ fill: '#f97316', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* HR Trend */}
      {hrTrend.length > 1 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-sm text-gray-400 mb-4">Avg Heart Rate Trend (bpm)</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={hrTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={35} />
              <Tooltip content={<CustomHRTooltip />} />
              <Line
                type="monotone"
                dataKey="hr"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: '#ef4444', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
