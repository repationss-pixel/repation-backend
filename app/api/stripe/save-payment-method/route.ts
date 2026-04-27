import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  let body: { userId?: string; paymentMethodId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const { userId, paymentMethodId } = body

  if (!userId || !paymentMethodId) {
    return NextResponse.json(
      { error: 'userId et paymentMethodId sont requis' },
      { status: 400 }
    )
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
  }

  await prisma.user.update({
    where: { id: userId },
    data: { stripePaymentMethodId: paymentMethodId },
  })

  return NextResponse.json({ success: true })
}
