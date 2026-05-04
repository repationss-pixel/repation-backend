import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  let body: { email?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  if (!email) return NextResponse.json({ error: 'Email requis' }, { status: 400 })

  // Réponse identique que l'email existe ou non (évite l'énumération)
  const user = await prisma.user.findUnique({ where: { email } })

  if (user) {
    const token = crypto.randomUUID()
    const expiry = new Date(Date.now() + 60 * 60 * 1000) // +1 heure

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpiry: expiry },
    })

    try {
      await sendPasswordResetEmail(email, user.prenom, token)
    } catch (err) {
      console.error('[mot-de-passe-oublie] erreur email:', JSON.stringify(err))
    }
  }

  return NextResponse.json({ ok: true })
}
