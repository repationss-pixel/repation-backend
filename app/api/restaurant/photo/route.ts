import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest) {
  const session = cookies().get('repation_session')?.value
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let userId: string
  try {
    const parsed = JSON.parse(session)
    if (parsed.type !== 'RESTAURATEUR') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    userId = parsed.userId
  } catch {
    return NextResponse.json({ error: 'Session invalide' }, { status: 401 })
  }

  let body: { photoUrl?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const { photoUrl } = body
  if (!photoUrl) return NextResponse.json({ error: 'photoUrl est requis' }, { status: 422 })

  const restaurant = await prisma.restaurant.findFirst({ where: { restaurateurId: userId } })
  if (!restaurant) return NextResponse.json({ error: 'Restaurant introuvable' }, { status: 404 })

  await prisma.restaurant.update({
    where: { id: restaurant.id },
    data: { photoUrl },
  })

  return NextResponse.json({ success: true })
}
