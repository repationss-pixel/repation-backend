import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
  const raw = cookies().get('repation_session')?.value
  if (!raw) return NextResponse.json({ loggedIn: false })

  try {
    const parsed = JSON.parse(raw)
    return NextResponse.json({
      loggedIn: true,
      prenom: parsed.prenom ?? null,
      type: parsed.type ?? null,
    })
  } catch {
    return NextResponse.json({ loggedIn: false })
  }
}
