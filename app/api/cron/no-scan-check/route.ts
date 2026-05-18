import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ReservationStatut } from '@prisma/client'
import Stripe from 'stripe'
import {
  sendPreReminderEmail,
  sendScanReminderEmail,
  sendNoScanChargeEmail,
} from '@/lib/email'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '')

// Cron toutes les heures (plan Vercel gratuit)
// vercel.json : { "crons": [{ "path": "/api/cron/no-scan-check", "schedule": "0 * * * *" }] }

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

  // Fenêtres de temps
  const pre28  = new Date(now.getTime() + 28 * 60 * 1000)  // +28 min
  const pre32  = new Date(now.getTime() + 32 * 60 * 1000)  // +32 min
  const post8  = new Date(now.getTime() - 8  * 60 * 1000)  // -8 min
  const post12 = new Date(now.getTime() - 12 * 60 * 1000)  // -12 min
  const t30    = new Date(now.getTime() - 30 * 60 * 1000)  // -30 min

  console.log('[cron/no-scan-check] démarrage', { now: now.toISOString() })

  const preReminderResults: { reservationId: string; status: string; error?: string }[] = []
  const scanReminderResults: { reservationId: string; status: string; error?: string }[] = []
  const chargeResults:       { reservationId: string; status: string; error?: string }[] = []

  // ── 1. RAPPEL ANNULATION (T-30 min) ──────────────────────────────────────────
  // Créneau dans 28-32 min, rappel pas encore envoyé
  const toPreRemind = await prisma.reservation.findMany({
    where: {
      statut: { in: STATUTS_ACTIFS },
      preReminderSentAt: null,
      creneau: { gte: pre28, lte: pre32 },
    },
    include: { user: true, restaurant: { select: { nom: true } } },
  })

  console.log(`[cron/no-scan-check] rappels pré-annulation : ${toPreRemind.length}`)

  for (const r of toPreRemind) {
    try {
      await sendPreReminderEmail(
        r.user.email,
        r.user.prenom,
        r.restaurant.nom,
        r.creneau.toISOString()
      )
      await prisma.reservation.update({
        where: { id: r.id },
        data: { preReminderSentAt: now },
      })
      console.log(`[cron/no-scan-check] pré-rappel envoyé ✓ reservation=${r.id}`)
      preReminderResults.push({ reservationId: r.id, status: 'pre-reminder-sent' })
    } catch (err) {
      console.error(`[cron/no-scan-check] erreur pré-rappel reservation=${r.id}:`, JSON.stringify(err))
      preReminderResults.push({
        reservationId: r.id,
        status: 'pre-reminder-error',
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  // ── 2. RAPPEL QR CODE (T+10 min) ─────────────────────────────────────────────
  // Créneau passé depuis 8-12 min, pas de scan validé, rappel pas encore envoyé
  const toScanRemind = await prisma.reservation.findMany({
    where: {
      statut: { in: STATUTS_ACTIFS },
      scanReminderSentAt: null,
      creneau: { gte: post12, lte: post8 },
      checkins: { none: { validated: true } },
    },
    include: { user: true, restaurant: { select: { nom: true } } },
  })

  console.log(`[cron/no-scan-check] rappels QR code : ${toScanRemind.length}`)

  for (const r of toScanRemind) {
    try {
      await sendScanReminderEmail(
        r.user.email,
        r.user.prenom,
        r.restaurant.nom,
        r.creneau.toISOString()
      )
      await prisma.reservation.update({
        where: { id: r.id },
        data: { scanReminderSentAt: now },
      })
      console.log(`[cron/no-scan-check] rappel QR envoyé ✓ reservation=${r.id}`)
      scanReminderResults.push({ reservationId: r.id, status: 'scan-reminder-sent' })
    } catch (err) {
      console.error(`[cron/no-scan-check] erreur rappel QR reservation=${r.id}:`, JSON.stringify(err))
      scanReminderResults.push({
        reservationId: r.id,
        status: 'scan-reminder-error',
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  // ── 3. PRÉLÈVEMENT ABSENCE (T+30 min) ────────────────────────────────────────
  // Créneau passé depuis plus de 30 min, pas de scan validé
  const toCharge = await prisma.reservation.findMany({
    where: {
      statut: { in: STATUTS_ACTIFS },
      creneau: { lt: t30 },
      checkins: { none: { validated: true } },
    },
    include: { user: true, restaurant: { select: { nom: true } } },
  })

  console.log(`[cron/no-scan-check] prélèvements absence : ${toCharge.length}`)

  for (const r of toCharge) {
    try {
      // Marquer NO_SHOW immédiatement pour éviter tout double-prélèvement
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
      }

      await sendNoScanChargeEmail(
        r.user.email,
        r.user.prenom,
        r.restaurant.nom,
        r.creneau.toISOString()
      )

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
    preReminders: preReminderResults.length,
    scanReminders: scanReminderResults.length,
    charges: chargeResults.length,
  })

  return NextResponse.json({
    processedAt: now.toISOString(),
    preReminders: preReminderResults,
    scanReminders: scanReminderResults,
    charges: chargeResults,
  })
}
