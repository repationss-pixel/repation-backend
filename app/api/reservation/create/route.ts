import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ReservationStatut } from '@prisma/client'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '')

const MESSAGE_CARTE_REQUISE =
  `🔒 Votre carte bancaire est requise pour confirmer votre réservation.\n\n` +
  `Rassurez-vous : aucun montant ne sera prélevé pour votre participation.\n\n` +
  `Un seul cas de prélèvement : si vous ne vous présentez pas sans avoir annulé au moins ` +
  `20 minutes avant l'heure de votre réservation, 1€ sera débité automatiquement.\n\n` +
  `Ce système nous permet de garantir la fiabilité de Repation pour tous les convives et ` +
  `nos restaurants partenaires. Merci pour votre compréhension et votre respect envers les autres 🙏`

export async function POST(req: NextRequest) {
  let body: { userId?: string; phone?: string; restaurantId?: string; creneau?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const { restaurantId, creneau } = body
  let { userId } = body

  if (!restaurantId || !creneau) {
    return NextResponse.json(
      { error: 'restaurantId et creneau sont requis' },
      { status: 400 }
    )
  }

  // Résoudre userId depuis le numéro de téléphone si nécessaire
  if (!userId && body.phone) {
    const normalizedPhone = body.phone.replace(/\s/g, '')
    const found = await prisma.user.findUnique({ where: { phone: normalizedPhone } })
    if (!found) return NextResponse.json({ error: 'Aucun compte associé à ce numéro' }, { status: 404 })
    userId = found.id
  }

  if (!userId) {
    return NextResponse.json({ error: 'userId ou phone est requis' }, { status: 400 })
  }

  const creneauDate = new Date(creneau)
  if (isNaN(creneauDate.getTime())) {
    return NextResponse.json({ error: 'creneau est une date invalide' }, { status: 400 })
  }

  const [user, restaurant] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.restaurant.findUnique({ where: { id: restaurantId }, select: { id: true, nom: true, slug: true, restaurateurId: true } }),
  ])

  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
  if (!restaurant) return NextResponse.json({ error: 'Restaurant introuvable' }, { status: 404 })

  // Vérifie qu'il n'y a pas déjà une réservation active sur ce créneau
  const conflict = await prisma.reservation.findFirst({
    where: {
      userId,
      restaurantId,
      creneau: creneauDate,
      statut: { notIn: [ReservationStatut.ANNULEE, ReservationStatut.NO_SHOW] },
    },
  })

  if (conflict) {
    return NextResponse.json(
      { error: 'Vous avez déjà une réservation sur ce créneau' },
      { status: 409 }
    )
  }

  // Pas de carte enregistrée → demander la carte avant de confirmer
  if (!user.stripePaymentMethodId) {
    const setupIntent = await stripe.setupIntents.create({
      usage: 'off_session',
      metadata: { userId },
    })

    return NextResponse.json({
      requiresCard: true,
      clientSecret: setupIntent.client_secret,
      message: MESSAGE_CARTE_REQUISE,
      userId,
    })
  }

  // Carte déjà enregistrée → créer la réservation directement
  const annulationDeadline = new Date(creneauDate.getTime() - 20 * 60 * 1000)

  const reservation = await prisma.reservation.create({
    data: {
      userId,
      restaurantId,
      creneau: creneauDate,
      annulationDeadline,
    },
    include: { restaurant: { select: { nom: true, slug: true } } },
  })

  // Emails — fire-and-forget (l'échec n'interrompt pas la réponse)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  fetch(`${appUrl}/api/email/confirmation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: user.email,
      prenom: user.prenom,
      restaurantNom: reservation.restaurant.nom,
      creneau: creneauDate.toISOString(),
    }),
  }).catch((err) => console.error('[email/confirmation] envoi échoué :', err))

  // Notification au restaurateur si le lien existe
  if (restaurant.restaurateurId) {
    prisma.user.findUnique({ where: { id: restaurant.restaurateurId }, select: { email: true } })
      .then((restaurateur) => {
        if (!restaurateur) return
        fetch(`${appUrl}/api/email/restaurant-notification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: restaurateur.email,
            restaurantNom: reservation.restaurant.nom,
            creneau: creneauDate.toISOString(),
          }),
        }).catch((err) => console.error('[email/restaurant-notification] envoi échoué :', err))
      })
      .catch((err) => console.error('[email/restaurant-notification] lookup échoué :', err))
  }

  return NextResponse.json({ reservation }, { status: 201 })
}
