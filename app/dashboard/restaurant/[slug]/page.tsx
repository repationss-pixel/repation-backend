import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { calculateInvoice } from '@/lib/billing'
import { ReservationStatut } from '@prisma/client'
import InvoicePDFButton, { type InvoiceData } from './InvoicePDFButton'

export default async function RestaurantDashboard({ params }: { params: { slug: string } }) {
  const restaurant = await prisma.restaurant.findUnique({ where: { slug: params.slug } })
  if (!restaurant) notFound()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const valideeReservations = await prisma.reservation.findMany({
    where: {
      restaurantId: restaurant.id,
      statut: ReservationStatut.VALIDEE,
      visitId: { not: null },
      creneau: { gte: startOfMonth, lt: endOfMonth },
    },
    include: {
      user: { select: { prenom: true } },
      checkins: { where: { validated: true }, orderBy: { timestamp: 'asc' }, take: 1 },
    },
    orderBy: { creneau: 'asc' },
  })

  // Grouper par visitId pour former des paires
  const visitMap = new Map<string, typeof valideeReservations>()
  for (const r of valideeReservations) {
    if (!r.visitId) continue
    const group = visitMap.get(r.visitId) ?? []
    group.push(r)
    visitMap.set(r.visitId, group)
  }

  const visits = Array.from(visitMap.values())
    .filter((pair) => pair.length === 2)
    .map((pair) => {
      const ts = pair[0].checkins[0]?.timestamp ?? pair[0].creneau
      return {
        dateStr: ts.toLocaleString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          hour: '2-digit',
          minute: '2-digit',
        }),
        user1: pair[0].user.prenom,
        user2: pair[1].user.prenom,
      }
    })

  const certifiedCount = visits.length
  const { montantHT, montantTTC, tarifParClient } = calculateInvoice(
    restaurant.categorie,
    certifiedCount
  )
  const billable = certifiedCount >= 5

  const invoiceData: InvoiceData = {
    restaurant: {
      nom: restaurant.nom,
      adresse: restaurant.adresse,
      categorie: restaurant.categorie,
    },
    mois: now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'Europe/Paris' }),
    visitesCertifiees: certifiedCount,
    tarifParClient,
    montantHT,
    montantTTC,
    visits,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-[#1D9E75] rounded-full flex items-center justify-center text-white font-bold">
              R
            </div>
            <span className="text-sm text-gray-500 font-medium">Tableau de bord restaurateur</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{restaurant.nom}</h1>
          <p className="text-gray-500 mt-1">{restaurant.adresse}</p>
          <span className="inline-block mt-2 px-3 py-1 bg-[#1D9E75]/10 text-[#1D9E75] text-sm rounded-full font-medium capitalize">
            {restaurant.categorie}
          </span>
        </div>

        {/* Cartes statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="text-4xl font-bold text-[#1D9E75]">{certifiedCount}</div>
            <div className="text-gray-700 font-medium mt-1">Clients certifiés</div>
            <div className="text-xs text-gray-400 mt-1">
              {now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'Europe/Paris' })}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="text-4xl font-bold text-gray-800">{tarifParClient.toFixed(2)} €</div>
            <div className="text-gray-700 font-medium mt-1">Tarif par client amené</div>
            <div className="text-xs text-gray-400 mt-1 capitalize">Catégorie {restaurant.categorie}</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className={`text-4xl font-bold ${billable ? 'text-orange-500' : 'text-gray-300'}`}>
              {billable ? `${montantTTC.toFixed(2)} €` : '—'}
            </div>
            <div className="text-gray-700 font-medium mt-1">Facture estimée TTC</div>
            <div className="text-xs text-gray-400 mt-1">
              {billable
                ? `HT : ${montantHT.toFixed(2)} € · TVA 20%`
                : `Facturation à partir de 5 visites certifiées (${certifiedCount}/5)`}
            </div>
          </div>
        </div>

        {/* Liste des visites certifiées */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">Visites certifiées ce mois</h2>
            <p className="text-sm text-gray-400 mt-0.5">Double scan QR validé</p>
          </div>

          {visits.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400">
              <div className="text-4xl mb-3">📋</div>
              <p>Aucune visite certifiée ce mois.</p>
              <p className="text-sm mt-1">Les visites apparaissent ici quand les deux convives ont scanné.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {visits.map((visit, i) => (
                <div key={i} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-800">
                      {visit.user1} &amp; {visit.user2}
                    </div>
                    <div className="text-sm text-gray-400 mt-0.5 capitalize">{visit.dateStr}</div>
                  </div>
                  <span className="px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full font-medium">
                    Certifiée ✓
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section facture */}
        {billable ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Facture — {now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'Europe/Paris' })}
            </h2>
            <div className="space-y-3 mb-6">
              {[
                ['Visites certifiées', `${certifiedCount} visites`],
                ['Clients amenés (× 2)', `${certifiedCount * 2} clients`],
                [`Tarif Repation par client`, `${tarifParClient.toFixed(2)} €`],
                ['Montant HT', `${montantHT.toFixed(2)} €`],
                ['TVA 20%', `${(montantTTC - montantHT).toFixed(2)} €`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-gray-700 text-sm">
                  <span>{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
              <div className="flex justify-between text-lg font-bold text-[#1D9E75] border-t border-gray-100 pt-3">
                <span>Total TTC</span>
                <span>{montantTTC.toFixed(2)} €</span>
              </div>
            </div>
            <InvoicePDFButton data={invoiceData} />
          </div>
        ) : (
          certifiedCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-800 text-sm">
              La facturation Repation s'active à partir de 5 visites certifiées par mois.
              Vous en avez {certifiedCount} ce mois — encore {5 - certifiedCount} pour atteindre le seuil.
            </div>
          )
        )}
      </div>
    </div>
  )
}
