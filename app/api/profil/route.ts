import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

function getSession() {
  const raw = cookies().get('repation_session')?.value
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (parsed.type !== 'PARTICULIER') return null
    return parsed as { userId: string; type: string; prenom: string }
  } catch {
    return null
  }
}

export async function GET() {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, prenom: true, email: true, photoUrl: true, age: true, profession: true, bio: true, interets: true },
  })
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

  return NextResponse.json(user)
}

export async function PATCH(req: NextRequest) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let body: {
    photoUrl?: string | null
    age?: number | null
    profession?: string | null
    bio?: string | null
    interets?: string | null
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  if (body.bio && body.bio.length > 150) {
    return NextResponse.json({ error: 'La bio ne peut pas dépasser 150 caractères.' }, { status: 422 })
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      ...(body.photoUrl !== undefined && { photoUrl: body.photoUrl }),
      ...(body.age !== undefined && { age: body.age }),
      ...(body.profession !== undefined && { profession: body.profession }),
      ...(body.bio !== undefined && { bio: body.bio }),
      ...(body.interets !== undefined && { interets: body.interets }),
    },
  })

  return NextResponse.json({ success: true })
}
