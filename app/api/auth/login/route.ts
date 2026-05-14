import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

const COOKIE = 'repation_session'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 jours

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string; type?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const { email, password } = body
  if (!email) return NextResponse.json({ error: 'Email requis' }, { status: 400 })
  if (!password) return NextResponse.json({ error: 'Mot de passe requis' }, { status: 400 })

  const user = await prisma.user.findFirst({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, prenom: true, type: true, passwordHash: true },
  })

  if (!user || !user.passwordHash || !await bcrypt.compare(password, user.passwordHash)) {
    return NextResponse.json({ error: 'Identifiants incorrects.' }, { status: 401 })
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
