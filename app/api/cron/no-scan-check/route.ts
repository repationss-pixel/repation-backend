import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ReservationStatut } from '@prisma/client'
import Stripe from 'stripe'
import { sendScanReminderEmail, sendNoScanChargeEmail } from '@/lib/email'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '')

// Cron toutes les 10 minutes
// vercel.json : { "crons": [{ "path": "/api/cron/no-scan-check", "schedule": "*/10 * * * *" }] }

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  return req.headers.get('authorization') === `Bearer ${secret}`
}

const STATUTS_ACTIFS = [ReservationStatut.EN_ATTENTE, ReservationStatut.CONFIRMEE]

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const now = new Date()
  const t20 = new Date(now.getTime() - 20 * 60 * 1000)
  const t30 = new Date(now.getTime() - 30 * 60 * 1000)

  console.log('[cron/no-scan-check] démarrage', {
    now: now.toISOString(),
    t20: t20.toISOString(),
    t30: t30.toISOString(),
  })

  const reminderResults: { reservationId: string; status: string; error?: string }[] = []
  const chargeResults: { reservationId: string; status: string; error?: string }[] = []

  // ── 1. Rappels (T+20 min) ─────────────────────────────────────────────────
  // Créneau passé depuis 20-30 min, rappel pas encore envoyé, pas de scan validé
  const toRemind = await prisma.reservation.findMany({
    where: {
      statut: { in: STATUTS_ACTIFS },
      scanReminderSentAt: null,
      creneau: { gte: t30, lt: t20 },
      checkins: { none: { validated: true } },
    },
    include: { user: true, restaurant: { select: { nom: true } } },
  })

  console.log(`[cron/no-scan-check] rappels à envoyer : ${toRemind.length}`)

  for (const r of toRemind) {
    console.log(`[cron/no-scan-check] envoi rappel → reservation=${r.id} user=${r.user.email}`)
    try {
      await sendScanReminderEmail(
        r.user.email,
        r.user.prenom,
        r.restaurant.nom,
        r.creneau.toISOString()
      )
      console.log(`[cron/no-scan-check] rappel envoyé ✓ reservation=${r.id}`)

      await prisma.reservation.update({
        where: { id: r.id },
        data: { scanReminderSentAt: now },
      })
      reminderResults.push({ reservationId: r.id, status: 'reminder-sent' })
    } catch (err) {
      console.error(`[cron/no-scan-check] erreur rappel reservation=${r.id}:`, JSON.stringify(err))
      reminderResults.push({
        reservationId: r.id,
        status: 'reminder-error',
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  // ── 2. Prélèvements (T+30 min) ────────────────────────────────────────────
  const toCharge = await prisma.reservation.findMany({
    where: {
      statut: { in: STATUTS_ACTIFS },
      creneau: { lt: t30 },
      checkins: { none: { validated: true } },
    },
    include: { user: true, restaurant: { select: { nom: true } } },
  })

  console.log(`[cron/no-scan-check] prélèvements à traiter : ${toCharge.length}`)

  for (const r of toCharge) {
    console.log(`[cron/no-scan-check] traitement absence → reservation=${r.id} user=${r.user.email}`)
    try {
      // Marque NO_SHOW immédiatement pour éviter un double-prélèvement
      await prisma.reservation.update({
        where: { id: r.id },
        data: { statut: ReservationStatut.NO_SHOW },
      })

      if (r.user.stripePaymentMethodId) {
        await stripe.paymentIntents.create({
          amount: 100,
          currency: 'eur',
          payment_method: r.user.stripePaymentMethodId,
          confirm: true,
          off_session: true,
          description: `Repation — Absence sans scan QR — Réservation ${r.id}`,
          metadata: { reservationId: r.id, userId: r.user.id },
        })
        console.log(`[cron/no-scan-check] stripe 1€ prélevé ✓ reservation=${r.id}`)
      } else {
        console.log(`[cron/no-scan-check] pas de payment method — absence non facturée reservation=${r.id}`)
      }

      await sendNoScanChargeEmail(
        r.user.email,
        r.user.prenom,
        r.restaurant.nom,
        r.creneau.toISOString()
      )
      console.log(`[cron/no-scan-check] email absence envoyé ✓ reservation=${r.id}`)

      chargeResults.push({
        reservationId: r.id,
        status: r.user.stripePaymentMethodId ? 'charged' : 'no-payment-method',
      })
    } catch (err) {
      console.error(`[cron/no-scan-check] erreur absence reservation=${r.id}:`, JSON.stringify(err))
      chargeResults.push({
        reservationId: r.id,
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  console.log('[cron/no-scan-check] terminé', {
    reminders: reminderResults.length,
    charges: chargeResults.length,
  })

  return NextResponse.json({
    processedAt: now.toISOString(),
    reminders: reminderResults,
    charges: chargeResults,
  })
}
