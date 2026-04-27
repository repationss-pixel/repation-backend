import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ReservationStatut } from '@prisma/client'
import Stripe from 'stripe'
import { sendScanReminderEmail, sendNoScanChargeEmail } from '@/lib/email'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '')

// Recommandé : cron toutes les 10 minutes pour couvrir la fenêtre rappel (T+20) et prélèvement (T+30)
// Exemple vercel.json : { "crons": [{ "path": "/api/cron/no-scan-check", "schedule": "*/10 * * * *" }] }

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
  const t20 = new Date(now.getTime() - 20 * 60 * 1000) // T - 20 min
  const t30 = new Date(now.getTime() - 30 * 60 * 1000) // T - 30 min
  // Fenêtre rappel : créneau passé entre 30 et 20 min (≥ 20 min mais < 30 min ago)
  const reminderWindowStart = t30
  const reminderWindowEnd = t20

  const reminderResults: { reservationId: string; status: string; error?: string }[] = []
  const chargeResults: { reservationId: string; status: string; error?: string }[] = []

  // ── 1. Rappels (T+20 min) ─────────────────────────────────────────────────
  const toRemind = await prisma.reservation.findMany({
    where: {
      statut: { in: STATUTS_ACTIFS },
      scanReminderSentAt: null,
      creneau: { gte: reminderWindowStart, lt: reminderWindowEnd },
      checkins: { none: { validated: true } },
    },
    include: { user: true, restaurant: { select: { nom: true } } },
  })

  for (const r of toRemind) {
    try {
      await sendScanReminderEmail(
        r.user.email, r.user.prenom, r.restaurant.nom, r.creneau.toISOString()
      )
      await prisma.reservation.update({
        where: { id: r.id },
        data: { scanReminderSentAt: now },
      })
      reminderResults.push({ reservationId: r.id, status: 'reminder-sent' })
    } catch (err) {
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

  for (const r of toCharge) {
    try {
      // Marque immédiatement NO_SHOW pour éviter un double-prélèvement si le cron repasse
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
      }

      await sendNoScanChargeEmail(
        r.user.email, r.user.prenom, r.restaurant.nom, r.creneau.toISOString()
      )

      chargeResults.push({
        reservationId: r.id,
        status: r.user.stripePaymentMethodId ? 'charged' : 'no-payment-method',
      })
    } catch (err) {
      chargeResults.push({
        reservationId: r.id,
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return NextResponse.json({
    processedAt: now.toISOString(),
    reminders: reminderResults,
    charges: chargeResults,
  })
}
