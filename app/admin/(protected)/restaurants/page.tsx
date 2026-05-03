import { prisma } from '@/lib/prisma'
import { ReservationStatut } from '@prisma/client'

export const dynamic = 'force-dynamic'

function extractVille(adresse: string): string {
  const parts = adresse.split(',')
  if (parts.length < 2) return adresse
  const last = parts[parts.length - 1].trim()
  return last.replace(/^\d{5}\s*/, '').trim() || adresse
}

export default async function AdminRestaurantsPage() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const mois = now.getMonth() + 1
  const annee = now.getFullYear()

  const restaurants = await prisma.restaurant.findMany({
    include: {
      factures: {
        where: { mois, annee },
        select: { montantTTC: true, payee: true },
      },
      reservations: {
        where: {
          creneau: { gte: startOfMonth, lt: endOfMonth },
          statut: ReservationStatut.VALIDEE,
        },
        select: { id: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Restaurants</h1>
        <p className="text-gray-500 text-sm mt-1">{restaurants.length} restaurant{restaurants.length > 1 ? 's' : ''} inscrits</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Restaurant</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ville</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Catégorie</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Inscription</th>
                <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Clients ce mois</th>
                <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Facturé ce mois</th>
                <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {restaurants.map((r) => {
                const clientsMois = r.reservations.length
                const facture = r.factures[0]
                const montantFacture = facture?.payee ? facture.montantTTC : 0
                const actif = clientsMois > 0
                return (
                  <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900">{r.nom}</div>
                    </td>
                    <td className="px-4 py-4 text-gray-600">{extractVille(r.adresse)}</td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-0.5 bg-[#1D9E75]/10 text-[#1D9E75] rounded-full text-xs font-medium capitalize">
                        {r.categorie}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-500">
                      {r.createdAt.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' })}
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-gray-800">
                      {clientsMois > 0 ? clientsMois : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-gray-800">
                      {montantFacture > 0
                        ? `${montantFacture.toFixed(2)} €`
                        : <span className="text-gray-300">—</span>
                      }
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          actif
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {restaurants.length === 0 && (
            <div className="px-6 py-16 text-center text-gray-400">
              Aucun restaurant inscrit.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
