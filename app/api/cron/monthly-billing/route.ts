import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateInvoice } from '@/lib/billing'
import { ReservationStatut } from '@prisma/client'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '')

// Protège l'endpoint Vercel Cron avec le secret dans l'en-tête Authorization
function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return true // Dev: pas de secret requis
  const authHeader = req.headers.get('authorization')
  return authHeader === `Bearer ${cronSecret}`
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const now = new Date()
  // Facturation du mois précédent
  const billingDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const mois = billingDate.getMonth() + 1
  const annee = billingDate.getFullYear()
  const startOfMonth = billingDate
  const endOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const restaurants = await prisma.restaurant.findMany({
    where: { stripeCustomerId: { not: null } },
  })

  const results: { slug: string; status: string; error?: string }[] = []

  for (const restaurant of restaurants) {
    try {
      // Compte les visites certifiées du mois précédent
      const visitIds = await prisma.reservation.findMany({
        where: {
          restaurantId: restaurant.id,
          statut: ReservationStatut.VALIDEE,
          visitId: { not: null },
          creneau: { gte: startOfMonth, lt: endOfMonth },
        },
        select: { visitId: true },
        distinct: ['visitId'],
      })

      const visitesCertifiees = visitIds.length

      // Seuil minimal : 5 visites certifiées (= 10 clients)
      if (visitesCertifiees < 5) {
        results.push({ slug: restaurant.slug, status: 'skipped — sous le seuil de 5 visites certifiées' })
        continue
      }

      // Évite la double facturation
      const existing = await prisma.facture.findUnique({
        where: { restaurantId_mois_annee: { restaurantId: restaurant.id, mois, annee } },
      })
      if (existing?.payee) {
        results.push({ slug: restaurant.slug, status: 'already-billed' })
        continue
      }

      const { montantHT, montantTTC } = calculateInvoice(visitesCertifiees)

      const amountCents = Math.round(montantTTC * 100)

      // Crée ou récupère la facture en base
      const facture = await prisma.facture.upsert({
        where: { restaurantId_mois_annee: { restaurantId: restaurant.id, mois, annee } },
        create: { restaurantId: restaurant.id, mois, annee, visitesCertifiees, montantHT, montantTTC },
        update: { visitesCertifiees, montantHT, montantTTC },
      })

      // Prélèvement Stripe via le customer enregistré
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: 'eur',
        customer: restaurant.stripeCustomerId!,
        confirm: true,
        description: `Repation — Forfait clients ${mois}/${annee} — ${visitesCertifiees * 2} clients certifiés`,
        metadata: {
          restaurantSlug: restaurant.slug,
          factureId: facture.id,
          mois: String(mois),
          annee: String(annee),
        },
        // Utilise la méthode de paiement par défaut du customer
        payment_method: await getDefaultPaymentMethod(restaurant.stripeCustomerId!),
        off_session: true,
      })

      await prisma.facture.update({
        where: { id: facture.id },
        data: { stripeChargeId: paymentIntent.id, payee: true },
      })

      results.push({ slug: restaurant.slug, status: 'billed', error: undefined })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      results.push({ slug: restaurant.slug, status: 'error', error: message })
    }
  }

  return NextResponse.json({
    mois,
    annee,
    processed: results.length,
    results,
  })
}

async function getDefaultPaymentMethod(customerId: string): Promise<string> {
  const customer = await stripe.customers.retrieve(customerId)
  if ('deleted' in customer) throw new Error('Customer supprimé')
  const defaultPm = customer.invoice_settings?.default_payment_method
  if (typeof defaultPm === 'string') return defaultPm
  if (defaultPm && typeof defaultPm === 'object' && 'id' in defaultPm) return defaultPm.id
  throw new Error(`Aucune méthode de paiement par défaut pour le customer ${customerId}`)
}
