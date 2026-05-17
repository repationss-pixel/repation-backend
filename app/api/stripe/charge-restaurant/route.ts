import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateInvoice } from '@/lib/billing'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '')

export async function POST(req: NextRequest) {
  let body: { restaurantId?: string; visitesCertifiees?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const { restaurantId, visitesCertifiees } = body

  if (!restaurantId || visitesCertifiees === undefined) {
    return NextResponse.json(
      { error: 'restaurantId et visitesCertifiees sont requis' },
      { status: 400 }
    )
  }

  if (!Number.isInteger(visitesCertifiees) || visitesCertifiees < 1) {
    return NextResponse.json(
      { error: 'visitesCertifiees doit être un entier positif' },
      { status: 400 }
    )
  }

  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } })

  if (!restaurant) {
    return NextResponse.json({ error: 'Restaurant introuvable' }, { status: 404 })
  }

  if (!restaurant.stripeCustomerId) {
    return NextResponse.json(
      { error: 'Aucun customer Stripe enregistré pour ce restaurant' },
      { status: 422 }
    )
  }

  const { montantHT, montantTTC, tarifParClient } = calculateInvoice(visitesCertifiees)

  const amountCents = Math.round(montantTTC * 100)

  const customer = await stripe.customers.retrieve(restaurant.stripeCustomerId)
  if ('deleted' in customer) {
    return NextResponse.json({ error: 'Customer Stripe supprimé' }, { status: 422 })
  }

  const defaultPm = customer.invoice_settings?.default_payment_method
  const paymentMethodId =
    typeof defaultPm === 'string'
      ? defaultPm
      : defaultPm && typeof defaultPm === 'object' && 'id' in defaultPm
        ? defaultPm.id
        : null

  if (!paymentMethodId) {
    return NextResponse.json(
      { error: 'Aucune méthode de paiement par défaut pour ce restaurant' },
      { status: 422 }
    )
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: 'eur',
    customer: restaurant.stripeCustomerId,
    payment_method: paymentMethodId,
    confirm: true,
    off_session: true,
    description: `Repation — Facturation restaurant ${restaurant.nom} — ${visitesCertifiees * 2} clients certifiés`,
    metadata: {
      restaurantId: restaurant.id,
      restaurantSlug: restaurant.slug,
      visitesCertifiees: String(visitesCertifiees),
    },
  })

  return NextResponse.json({
    success: true,
    montantHT: `${montantHT.toFixed(2)} €`,
    montantTTC: `${montantTTC.toFixed(2)} €`,
    tarifParClient: `${tarifParClient.toFixed(2)} €`,
    clientsCertifies: visitesCertifiees * 2,
    stripePaymentIntentId: paymentIntent.id,
  })
}
