import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '')

export async function POST(req: NextRequest) {
  let body: { restaurantId?: string; setupIntentId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const { restaurantId, setupIntentId } = body

  if (!restaurantId || !setupIntentId) {
    return NextResponse.json(
      { error: 'restaurantId et setupIntentId sont requis' },
      { status: 400 }
    )
  }

  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } })
  if (!restaurant) {
    return NextResponse.json({ error: 'Restaurant introuvable' }, { status: 404 })
  }

  if (!restaurant.stripeCustomerId) {
    return NextResponse.json(
      { error: 'Aucun customer Stripe pour ce restaurant' },
      { status: 422 }
    )
  }

  const setupIntent = await stripe.setupIntents.retrieve(setupIntentId)

  if (setupIntent.status !== 'succeeded') {
    return NextResponse.json(
      { error: `SetupIntent non confirmé (statut : ${setupIntent.status})` },
      { status: 422 }
    )
  }

  const pm = setupIntent.payment_method
  const paymentMethodId = typeof pm === 'string' ? pm : pm?.id ?? null

  if (!paymentMethodId) {
    return NextResponse.json(
      { error: 'Aucune méthode de paiement dans le SetupIntent' },
      { status: 422 }
    )
  }

  // Définit la carte comme méthode par défaut du customer
  await stripe.customers.update(restaurant.stripeCustomerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  })

  return NextResponse.json({ success: true, paymentMethodId })
}
