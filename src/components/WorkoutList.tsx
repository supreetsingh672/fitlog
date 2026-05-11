'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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

const SPORT_ICONS: Record<string, string> = {
  running: '🏃', cycling: '🚴', swimming: '🏊',
  walking: '🚶', hiking: '🥾', strength: '🏋️', other: '💪',
}

function formatDuration(sec: number | null): string {
  if (!sec) return '—'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h}h ${m}m`
  return `${m}m ${String(s).padStart(2, '0')}s`
}

function formatPace(sec: number | null): string {
  if (!sec) return '—'
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}/km`
}

function formatDate(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

function EditModal({ workout, onClose, onSaved }: { workout: Workout; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ ...workout })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function update(field: keyof Workout, value: string) {
    const numFields = ['distance_km', 'duration_sec', 'avg_pace_sec_per_km', 'avg_hr', 'calories']
    setForm(f => ({ ...f, [field]: numFields.includes(field) ? (value === '' ? null : Number(value)) : value }))
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase
      .from('workouts')
      .update({
        sport: form.sport,
        date: form.date,
        distance_km: form.distance_km,
        duration_sec: form.duration_sec,
        avg_pace_sec_per_km: form.avg_pace_sec_per_km,
        avg_hr: form.avg_hr,
        calories: form.calories,
      })
      .eq('id', workout.id)

    if (error) { setError(error.message); setSaving(false); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-white mb-4">Edit Workout</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Sport</label>
            <select value={form.sport} onChange={e => update('sport', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500">
              {['running','cycling','swimming','walking','hiking','strength','other'].map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Date</label>
            <input type="date" value={form.date || ''} onChange={e => update('date', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Distance (km)</label>
            <input type="number" step="0.01" value={form.distance_km ?? ''} onChange={e => update('distance_km', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Duration (sec)</label>
            <input type="number" value={form.duration_sec ?? ''} onChange={e => update('duration_sec', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Avg Pace (sec/km)</label>
            <input type="number" value={form.avg_pace_sec_per_km ?? ''} onChange={e => update('avg_pace_sec_per_km', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Avg HR (bpm)</label>
            <input type="number" value={form.avg_hr ?? ''} onChange={e => update('avg_hr', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-400 mb-1">Calories</label>
            <input type="number" value={form.calories ?? ''} onChange={e => update('calories', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500" />
          </div>
        </div>
        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function WorkoutList({ workouts }: { workouts: Workout[] }) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeletingId(id)
    const supabase = createClient()
    await supabase.from('workouts').delete().eq('id', id)
    router.refresh()
    setDeletingId(null)
  }

  const editingWorkout = workouts.find(w => w.id === editingId)

  return (
    <>
      {editingWorkout && (
        <EditModal
          workout={editingWorkout}
          onClose={() => setEditingId(null)}
          onSaved={() => { setEditingId(null); router.refresh() }}
        />
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-white">All Workouts</h2>
        {workouts.map(w => (
          <div key={w.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center gap-4 group">
            <div className="text-3xl">{SPORT_ICONS[w.sport] ?? '💪'}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white font-medium capitalize">{w.sport}</span>
                <span className="text-gray-600 text-sm">·</span>
                <span className="text-gray-400 text-sm">{formatDate(w.date)}</span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                {w.distance_km && <span><span className="text-white font-medium">{Number(w.distance_km).toFixed(2)}</span> km</span>}
                {w.duration_sec && <span><span className="text-white font-medium">{formatDuration(w.duration_sec)}</span></span>}
                {w.avg_pace_sec_per_km && <span>Pace <span className="text-white font-medium">{formatPace(w.avg_pace_sec_per_km)}</span></span>}
                {w.avg_hr && <span>HR <span className="text-white font-medium">{w.avg_hr}</span> bpm</span>}
                {w.calories && <span><span className="text-white font-medium">{w.calories}</span> kcal</span>}
              </div>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setEditingId(w.id)}
                className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(w.id)}
                disabled={deletingId === w.id}
                className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-red-900 hover:text-red-400 text-gray-300 rounded-lg transition-colors disabled:opacity-50"
              >
                {deletingId === w.id ? '...' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
