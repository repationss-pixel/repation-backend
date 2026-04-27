import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '')

const MESSAGE_RESTAURANT =
  `Repation ne vous facture que si nous vous amenons des clients. ` +
  `Aucun frais tant que 5 clients confirmés ne sont pas atteints dans le mois.`

export async function POST(req: NextRequest) {
  let body: { restaurantId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const { restaurantId } = body

  if (!restaurantId) {
    return NextResponse.json({ error: 'restaurantId est requis' }, { status: 400 })
  }

  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } })
  if (!restaurant) {
    return NextResponse.json({ error: 'Restaurant introuvable' }, { status: 404 })
  }

  let customerId = restaurant.stripeCustomerId

  // Créer un Customer Stripe s'il n'en a pas encore
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: restaurant.nom,
      metadata: { restaurantId: restaurant.id, restaurantSlug: restaurant.slug },
    })
    customerId = customer.id

    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { stripeCustomerId: customerId },
    })
  }

  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    usage: 'off_session',
    metadata: { restaurantId: restaurant.id },
  })

  return NextResponse.json({
    clientSecret: setupIntent.client_secret,
    customerId,
    message: MESSAGE_RESTAURANT,
  })
}
