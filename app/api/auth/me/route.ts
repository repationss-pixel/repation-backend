import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
  const raw = cookies().get('repation_session')?.value

  const headers = {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
  }

  if (!raw) return NextResponse.json({ loggedIn: false }, { headers })

  try {
    const parsed = JSON.parse(raw)
    return NextResponse.json({
      loggedIn: true,
      prenom: parsed.prenom ?? null,
      type: parsed.type ?? null,
    }, { headers })
  } catch {
    return NextResponse.json({ loggedIn: false }, { headers })
  }
}
