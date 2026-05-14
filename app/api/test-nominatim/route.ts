import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch(
      'https://nominatim.openstreetmap.org/search?format=json&q=Paris&countrycodes=fr&limit=1',
      {
        headers: {
          'Accept-Language': 'fr',
          'User-Agent': 'Repation App contact@repation.fr',
        },
      }
    )

    const status = res.status
    const headers = Object.fromEntries(res.headers.entries())

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ ok: false, status, headers, body: text }, { status: 502 })
    }

    const data = await res.json()
    return NextResponse.json({ ok: true, status, resultCount: data.length, firstResult: data[0] ?? null })
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, error: JSON.stringify(err, Object.getOwnPropertyNames(err)) },
      { status: 500 }
    )
  }
}
