import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q || q.length < 3) return NextResponse.json([])

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=fr&limit=5`,
    { headers: { 'User-Agent': 'Repation/1.0 contact@repation.fr' } }
  )
  const data = await res.json()
  return NextResponse.json(data)
}
