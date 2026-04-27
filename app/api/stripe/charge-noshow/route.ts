import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '')

const FRAIS_NO_SHOW_CENTS = 100 // 1 €

export async function POST(req: NextRequest) {
  let body: { userId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const { userId } = body

  if (!userId) {
    return NextResponse.json({ error: 'userId est requis' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })

  if (!user) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
  }

  if (!user.stripePaymentMethodId) {
    return NextResponse.json(
      { error: 'Aucune carte enregistrée pour cet utilisateur' },
      { status: 422 }
    )
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: FRAIS_NO_SHOW_CENTS,
    currency: 'eur',
    payment_method: user.stripePaymentMethodId,
    confirm: true,
    off_session: true,
    description: `Repation — Absence non justifiée — Utilisateur ${userId}`,
    metadata: { userId },
  })

  return NextResponse.json({
    success: true,
    montant: '1.00 €',
    stripePaymentIntentId: paymentIntent.id,
  })
}
