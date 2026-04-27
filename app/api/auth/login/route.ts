import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const COOKIE = 'repation_session'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 jours

export async function POST(req: NextRequest) {
  let body: { email?: string; phone?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const { email, phone } = body
  if (!email || !phone) {
    return NextResponse.json({ error: 'Email et téléphone requis' }, { status: 400 })
  }

  const normalizedPhone = phone.replace(/\s/g, '')
  const user = await prisma.user.findFirst({
    where: {
      email: email.trim().toLowerCase(),
      phone: normalizedPhone,
    },
    select: { id: true, prenom: true, type: true },
  })

  if (!user) {
    return NextResponse.json(
      { error: 'Aucun compte trouvé avec ces identifiants.' },
      { status: 401 }
    )
  }

  const sessionValue = JSON.stringify({ userId: user.id, type: user.type, prenom: user.prenom })

  const res = NextResponse.json({ user: { id: user.id, prenom: user.prenom, type: user.type } })
  res.cookies.set(COOKIE, sessionValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  })
  return res
}
