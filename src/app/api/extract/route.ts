import Groq from 'groq-sdk'
import { NextRequest, NextResponse } from 'next/server'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mimeType = file.type

    const prompt = `You are a fitness data extractor. Look at this workout screenshot and extract the data.

Return ONLY a valid JSON object with these fields (use null for any field not visible):
{
  "sport": "running" | "cycling" | "swimming" | "walking" | "hiking" | "strength" | "other",
  "date": "YYYY-MM-DD",
  "distance_km": number or null,
  "duration_sec": number or null,
  "avg_pace_sec_per_km": number or null,
  "avg_hr": number or null,
  "calories": number or null
}

Rules:
- Convert miles to km if needed (1 mile = 1.60934 km)
- Convert pace from min/mile to sec/km if needed
- duration_sec is total seconds (e.g. 32:15 = 1935)
- avg_pace_sec_per_km is seconds per km (e.g. 5:30/km = 330)
- Return ONLY the JSON, no explanation or markdown`

    const result = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
          ],
        },
      ],
      max_tokens: 512,
    })

    const text = result.choices[0].message.content?.trim() ?? ''
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const extracted = JSON.parse(cleaned)

    return NextResponse.json({ data: extracted })
  } catch (err) {
    console.error('Extraction error:', err)
    return NextResponse.json({ error: 'Failed to extract workout data' }, { status: 500 })
  }
}
