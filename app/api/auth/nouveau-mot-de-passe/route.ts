import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  let body: { token?: string; password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const { token, password } = body

  if (!token) return NextResponse.json({ error: 'Token manquant' }, { status: 400 })
  if (!password || password.length < 6) {
    return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' }, { status: 422 })
  }

  const user = await prisma.user.findFirst({
    where: { resetToken: token },
    select: { id: true, resetTokenExpiry: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'Lien invalide ou déjà utilisé.' }, { status: 400 })
  }

  if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    return NextResponse.json({ error: 'Ce lien a expiré. Veuillez en demander un nouveau.' }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(password, 10)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExpiry: null,
    },
  })

  return NextResponse.json({ ok: true })
}
