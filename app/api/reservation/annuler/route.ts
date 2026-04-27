import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ReservationStatut } from '@prisma/client'
import Stripe from 'stripe'
import {
  sendCascadeCancelConviveEmail,
  sendCascadeCancelRestaurantEmail,
} from '@/lib/email'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '')

const FRAIS_NO_SHOW_CENTS = 100 // 1 €

const STATUTS_ANNULABLES = [ReservationStatut.EN_ATTENTE, ReservationStatut.CONFIRMEE]

export async function POST(req: NextRequest) {
  let body: { reservationId?: string; userId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const { reservationId, userId } = body

  if (!reservationId || !userId) {
    return NextResponse.json({ error: 'reservationId et userId sont requis' }, { status: 400 })
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      user: true,
      restaurant: { select: { id: true, nom: true, restaurateurId: true } },
    },
  })

  if (!reservation) {
    return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 })
  }

  if (reservation.userId !== userId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  if (!(STATUTS_ANNULABLES as string[]).includes(reservation.statut)) {
    return NextResponse.json(
      { error: 'Cette réservation ne peut plus être annulée' },
      { status: 409 }
    )
  }

  const now = new Date()
  const deadline =
    reservation.annulationDeadline ??
    new Date(reservation.creneau.getTime() - 20 * 60 * 1000)
  const isLate = now >= deadline

  // ── 1. Annuler la réservation du convive qui annule ───────────────────────
  await prisma.reservation.update({
    where: { id: reservationId },
    data: { statut: isLate ? ReservationStatut.NO_SHOW : ReservationStatut.ANNULEE },
  })

  // ── 2. Prélèvement si annulation tardive ──────────────────────────────────
  let stripePaymentIntentId: string | null = null

  if (isLate && reservation.user.stripePaymentMethodId) {
    const pi = await stripe.paymentIntents.create({
      amount: FRAIS_NO_SHOW_CENTS,
      currency: 'eur',
      payment_method: reservation.user.stripePaymentMethodId,
      confirm: true,
      off_session: true,
      description: `Repation — Annulation tardive — Réservation ${reservationId}`,
      metadata: { reservationId, userId },
    })
    stripePaymentIntentId = pi.id
  }

  // ── 3. Trouver et annuler la réservation partenaire ───────────────────────
  const partner = await prisma.reservation.findFirst({
    where: {
      restaurantId: reservation.restaurant.id,
      creneau: reservation.creneau,
      userId: { not: userId },
      statut: { in: STATUTS_ANNULABLES },
    },
    include: { user: true },
  })

  if (partner) {
    await prisma.reservation.update({
      where: { id: partner.id },
      data: { statut: ReservationStatut.ANNULEE },
    })

    // Email au convive partenaire — fire-and-forget
    sendCascadeCancelConviveEmail(
      partner.user.email,
      partner.user.prenom,
      reservation.restaurant.nom,
      reservation.creneau.toISOString()
    ).catch((err) => console.error('[email cascade convive]', err))
  }

  // ── 4. Email au restaurateur ───────────────────────────────────────────────
  if (reservation.restaurant.restaurateurId) {
    prisma.user
      .findUnique({
        where: { id: reservation.restaurant.restaurateurId },
        select: { email: true },
      })
      .then((restaurateur) => {
        if (!restaurateur) return
        sendCascadeCancelRestaurantEmail(
          restaurateur.email,
          reservation.restaurant.nom,
          reservation.creneau.toISOString()
        ).catch((err) => console.error('[email cascade restaurant]', err))
      })
      .catch((err) => console.error('[lookup restaurateur]', err))
  }

  return NextResponse.json({
    annule: true,
    frais: isLate,
    montant: isLate ? '1.00 €' : '0.00 €',
    partnerAnnule: !!partner,
    stripePaymentIntentId,
  })
}
