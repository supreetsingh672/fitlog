'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'

interface ExtractedData {
  sport: string
  date: string
  distance_km: number | null
  duration_sec: number | null
  avg_pace_sec_per_km: number | null
  avg_hr: number | null
  calories: number | null
}

function formatDuration(sec: number | null): string {
  if (!sec) return ''
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatPace(sec: number | null): string {
  if (!sec) return ''
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}/km`
}

export default function UploadPage() {
  const router = useRouter()
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [extracted, setExtracted] = useState<ExtractedData | null>(null)
  const [form, setForm] = useState<ExtractedData | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setExtracted(null)
    setForm(null)
    setError('')
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
  })

  async function handleExtract() {
    if (!file) return
    setExtracting(true)
    setError('')

    const formData = new FormData()
    formData.append('image', file)

    const res = await fetch('/api/extract', { method: 'POST', body: formData })
    const json = await res.json()

    if (!res.ok || json.error) {
      setError(json.error || 'Extraction failed')
      setExtracting(false)
      return
    }

    setExtracted(json.data)
    setForm(json.data)
    setExtracting(false)
  }

  async function handleSave() {
    if (!form) return
    setSaving(true)
    setError('')

    const res = await fetch('/api/workouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, raw_json: extracted }),
    })
    const json = await res.json()

    if (!res.ok || json.error) {
      setError(json.error || 'Failed to save')
      setSaving(false)
      return
    }

    router.push('/dashboard')
  }

  function updateForm(field: keyof ExtractedData, value: string) {
    if (!form) return
    const numFields = ['distance_km', 'duration_sec', 'avg_pace_sec_per_km', 'avg_hr', 'calories']
    setForm({
      ...form,
      [field]: numFields.includes(field) ? (value === '' ? null : Number(value)) : value,
    })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Log a Workout</h1>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors mb-6
          ${isDragActive ? 'border-orange-500 bg-orange-500/10' : 'border-gray-700 hover:border-gray-500'}`}
      >
        <input {...getInputProps()} />
        {preview ? (
          <img src={preview} alt="Workout screenshot" className="max-h-64 mx-auto rounded-lg object-contain" />
        ) : (
          <div>
            <div className="text-4xl mb-3">📸</div>
            <p className="text-gray-400">Drop your workout screenshot here</p>
            <p className="text-gray-600 text-sm mt-1">or click to browse — PNG, JPG, WEBP</p>
          </div>
        )}
      </div>

      {/* Extract button */}
      {file && !extracted && (
        <button
          onClick={handleExtract}
          disabled={extracting}
          className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors mb-6"
        >
          {extracting ? 'Extracting data...' : 'Extract Workout Data'}
        </button>
      )}

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {/* Extracted form */}
      {form && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white mb-2">Confirm & Edit</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Sport</label>
              <select
                value={form.sport}
                onChange={e => updateForm('sport', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
              >
                {['running','cycling','swimming','walking','hiking','strength','other'].map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Date</label>
              <input
                type="date"
                value={form.date || ''}
                onChange={e => updateForm('date', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Distance (km)</label>
              <input
                type="number"
                step="0.01"
                value={form.distance_km ?? ''}
                onChange={e => updateForm('distance_km', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                placeholder="e.g. 5.2"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Duration (seconds)</label>
              <input
                type="number"
                value={form.duration_sec ?? ''}
                onChange={e => updateForm('duration_sec', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                placeholder="e.g. 1935"
              />
              {form.duration_sec && (
                <p className="text-gray-500 text-xs mt-1">{formatDuration(form.duration_sec)}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Avg Pace (sec/km)</label>
              <input
                type="number"
                value={form.avg_pace_sec_per_km ?? ''}
                onChange={e => updateForm('avg_pace_sec_per_km', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                placeholder="e.g. 330"
              />
              {form.avg_pace_sec_per_km && (
                <p className="text-gray-500 text-xs mt-1">{formatPace(form.avg_pace_sec_per_km)}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Avg Heart Rate (bpm)</label>
              <input
                type="number"
                value={form.avg_hr ?? ''}
                onChange={e => updateForm('avg_hr', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                placeholder="e.g. 152"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Calories</label>
              <input
                type="number"
                value={form.calories ?? ''}
                onChange={e => updateForm('calories', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                placeholder="e.g. 420"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors mt-2"
          >
            {saving ? 'Saving...' : 'Save Workout'}
          </button>
        </div>
      )}
    </div>
  )
}
