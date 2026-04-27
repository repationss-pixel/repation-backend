import { prisma } from '@/lib/prisma'
import { ReservationStatut } from '@prisma/client'

export const dynamic = 'force-dynamic'

const STATUT_STYLE: Record<ReservationStatut, { bg: string; text: string; label: string }> = {
  EN_ATTENTE: { bg: 'bg-gray-100',    text: 'text-gray-600',   label: 'En attente' },
  CONFIRMEE:  { bg: 'bg-blue-50',     text: 'text-blue-700',   label: 'Confirmée' },
  ANNULEE:    { bg: 'bg-orange-50',   text: 'text-orange-700', label: 'Annulée' },
  TERMINEE:   { bg: 'bg-gray-100',    text: 'text-gray-500',   label: 'Terminée' },
  VALIDEE:    { bg: 'bg-green-50',    text: 'text-green-700',  label: 'Validée' },
  NO_SHOW:    { bg: 'bg-red-50',      text: 'text-red-700',    label: 'No-show' },
}

export default async function AdminReservationsPage() {
  const reservations = await prisma.reservation.findMany({
    include: {
      restaurant: { select: { nom: true } },
      user: { select: { prenom: true } },
    },
    orderBy: { creneau: 'desc' },
    take: 500,
  })

  // Associer les partenaires pour les visites certifiées (visitId partagé)
  const groups = new Map<string, typeof reservations>()
  for (const r of reservations) {
    if (!r.visitId) continue
    const g = groups.get(r.visitId) ?? []
    g.push(r)
    groups.set(r.visitId, g)
  }
  const partnerMap = new Map<string, string>()
  groups.forEach((pair) => {
    if (pair.length === 2) {
      partnerMap.set(pair[0].id, pair[1].user.prenom)
      partnerMap.set(pair[1].id, pair[0].user.prenom)
    }
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Réservations</h1>
        <p className="text-gray-500 text-sm mt-1">
          {reservations.length.toLocaleString('fr-FR')} dernières réservations
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Restaurant</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Convive 1</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Convive 2</th>
                <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {reservations.map((r) => {
                const partner = partnerMap.get(r.id)
                const style = STATUT_STYLE[r.statut]
                return (
                  <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-4 text-gray-700 whitespace-nowrap">
                      {r.creneau.toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-4 font-medium text-gray-900">{r.restaurant.nom}</td>
                    <td className="px-4 py-4 text-gray-700">{r.user.prenom}</td>
                    <td className="px-4 py-4 text-gray-500">
                      {partner ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                        {style.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {reservations.length === 0 && (
            <div className="px-6 py-16 text-center text-gray-400">
              Aucune réservation.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
