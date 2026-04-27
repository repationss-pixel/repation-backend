import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { haversineDistance } from '@/lib/geo'
import { ReservationStatut } from '@prisma/client'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { phone, restaurantSlug, latitude, longitude } = body

  if (!phone || !restaurantSlug || latitude == null || longitude == null) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }

  const normalizedPhone = String(phone).replace(/\s/g, '')

  const user = await prisma.user.findUnique({ where: { phone: normalizedPhone } })
  if (!user) {
    return NextResponse.json({ error: 'Numéro de téléphone non reconnu' }, { status: 404 })
  }

  const restaurant = await prisma.restaurant.findUnique({ where: { slug: restaurantSlug } })
  if (!restaurant) {
    return NextResponse.json({ error: 'Restaurant introuvable' }, { status: 404 })
  }

  const distance = haversineDistance(latitude, longitude, restaurant.latitude, restaurant.longitude)
  if (distance > 100) {
    return NextResponse.json(
      { error: `Vous êtes à ${Math.round(distance)} m du restaurant. Rapprochez-vous à moins de 100 m.` },
      { status: 400 }
    )
  }

  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

  const reservation = await prisma.reservation.findFirst({
    where: {
      userId: user.id,
      restaurantId: restaurant.id,
      creneau: { gte: startOfDay, lt: endOfDay },
      statut: { in: [ReservationStatut.CONFIRMEE, ReservationStatut.EN_ATTENTE] },
    },
    include: { checkins: true },
  })

  if (!reservation) {
    return NextResponse.json(
      { error: "Aucune réservation active aujourd'hui dans ce restaurant" },
      { status: 400 }
    )
  }

  if (reservation.checkins.some((c) => c.userId === user.id)) {
    return NextResponse.json({ error: 'Présence déjà enregistrée' }, { status: 400 })
  }

  await prisma.checkin.create({
    data: {
      reservationId: reservation.id,
      userId: user.id,
      latitude,
      longitude,
    },
  })

  // Cherche un convive qui a également scanné aujourd'hui dans ce restaurant
  const partnerReservations = await prisma.reservation.findMany({
    where: {
      restaurantId: restaurant.id,
      creneau: { gte: startOfDay, lt: endOfDay },
      statut: { in: [ReservationStatut.CONFIRMEE, ReservationStatut.EN_ATTENTE] },
      id: { not: reservation.id },
    },
    include: { checkins: true, user: { select: { prenom: true } } },
  })

  const partner = partnerReservations.find((r) => r.checkins.length > 0)

  if (partner) {
    const visitId = [reservation.id, partner.id].sort().join('-')

    await prisma.$transaction([
      prisma.reservation.update({
        where: { id: reservation.id },
        data: { statut: ReservationStatut.VALIDEE, visitId },
      }),
      prisma.reservation.update({
        where: { id: partner.id },
        data: { statut: ReservationStatut.VALIDEE, visitId },
      }),
      prisma.checkin.updateMany({
        where: { reservationId: reservation.id },
        data: { validated: true },
      }),
      prisma.checkin.updateMany({
        where: { reservationId: partner.id },
        data: { validated: true },
      }),
    ])

    return NextResponse.json({
      success: true,
      validated: true,
      prenom: user.prenom,
      partnerPrenom: partner.user.prenom,
    })
  }

  return NextResponse.json({ success: true, validated: false, prenom: user.prenom })
}
