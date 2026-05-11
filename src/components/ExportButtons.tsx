'use client'

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
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}/km`
}

export default function ExportButtons({ workouts }: { workouts: Workout[] }) {
  function downloadCSV() {
    const headers = ['Date', 'Sport', 'Distance (km)', 'Duration', 'Avg Pace', 'Avg HR (bpm)', 'Calories']
    const rows = workouts.map(w => [
      w.date,
      w.sport,
      w.distance_km ?? '',
      formatDuration(w.duration_sec),
      formatPace(w.avg_pace_sec_per_km),
      w.avg_hr ?? '',
      w.calories ?? '',
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fitlog-workouts-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function printReport() {
    const totalKm = workouts.reduce((s, w) => s + (Number(w.distance_km) || 0), 0)
    const totalCal = workouts.reduce((s, w) => s + (w.calories || 0), 0)
    const runs = workouts.filter(w => w.sport === 'running')
    const bestPace = runs.filter(w => w.avg_pace_sec_per_km).reduce((best, w) =>
      !best || w.avg_pace_sec_per_km! < best.avg_pace_sec_per_km! ? w : best, null as Workout | null)
    const longestRun = runs.filter(w => w.distance_km).reduce((best, w) =>
      !best || Number(w.distance_km) > Number(best.distance_km) ? w : best, null as Workout | null)

    const rows = workouts.map(w => `
      <tr>
        <td>${w.date}</td>
        <td style="text-transform:capitalize">${w.sport}</td>
        <td>${w.distance_km ? Number(w.distance_km).toFixed(2) + ' km' : '—'}</td>
        <td>${formatDuration(w.duration_sec) || '—'}</td>
        <td>${formatPace(w.avg_pace_sec_per_km) || '—'}</td>
        <td>${w.avg_hr ? w.avg_hr + ' bpm' : '—'}</td>
        <td>${w.calories ? w.calories + ' kcal' : '—'}</td>
      </tr>`).join('')

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>FitLog Report</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 40px; color: #111; }
    h1 { font-size: 24px; margin-bottom: 4px; }
    .sub { color: #666; font-size: 14px; margin-bottom: 32px; }
    .stats { display: flex; gap: 32px; margin-bottom: 32px; }
    .stat { }
    .stat-val { font-size: 28px; font-weight: 700; color: #ea580c; }
    .stat-label { font-size: 13px; color: #666; margin-top: 2px; }
    .bests { display: flex; gap: 32px; margin-bottom: 32px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; padding: 8px 12px; background: #f5f5f5; font-weight: 600; color: #444; }
    td { padding: 8px 12px; border-bottom: 1px solid #eee; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <h1>FitLog Report</h1>
  <div class="sub">Generated ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
  <div class="stats">
    <div class="stat"><div class="stat-val">${workouts.length}</div><div class="stat-label">Total Workouts</div></div>
    <div class="stat"><div class="stat-val">${totalKm.toFixed(1)} km</div><div class="stat-label">Total Distance</div></div>
    ${totalCal > 0 ? `<div class="stat"><div class="stat-val">${totalCal.toLocaleString()}</div><div class="stat-label">Total Calories</div></div>` : ''}
  </div>
  ${longestRun || bestPace ? `
  <div class="bests">
    ${longestRun ? `<div class="stat"><div class="stat-val">${Number(longestRun.distance_km).toFixed(2)} km</div><div class="stat-label">Longest Run</div></div>` : ''}
    ${bestPace ? `<div class="stat"><div class="stat-val">${formatPace(bestPace.avg_pace_sec_per_km)}</div><div class="stat-label">Best Pace</div></div>` : ''}
  </div>` : ''}
  <table>
    <thead><tr><th>Date</th><th>Sport</th><th>Distance</th><th>Duration</th><th>Pace</th><th>HR</th><th>Calories</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`

    const w = window.open('', '_blank')!
    w.document.write(html)
    w.document.close()
    w.print()
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={downloadCSV}
        className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
      >
        Export CSV
      </button>
      <button
        onClick={printReport}
        className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
      >
        PDF Report
      </button>
    </div>
  )
}
