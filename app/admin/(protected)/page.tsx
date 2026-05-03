import { prisma } from '@/lib/prisma'
import { UserType } from '@prisma/client'

export const dynamic = 'force-dynamic'

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      <div className="text-gray-700 font-medium mt-1">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  )
}

export default async function AdminDashboard() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const moisLabel = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'Europe/Paris' })

  const [totalRestaurants, totalParticuliers, totalReservationsMois, revenueAgg] =
    await Promise.all([
      prisma.restaurant.count(),
      prisma.user.count({ where: { type: UserType.PARTICULIER } }),
      prisma.reservation.count({
        where: { creneau: { gte: startOfMonth, lt: endOfMonth } },
      }),
      prisma.facture.aggregate({
        _sum: { montantHT: true },
      }),
    ])

  const revenusMois = revenueAgg._sum.montantHT ?? 0

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500 text-sm mt-1 capitalize">{moisLabel}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Restaurants inscrits"
          value={totalRestaurants.toString()}
          sub="Total depuis le début"
        />
        <StatCard
          label="Particuliers inscrits"
          value={totalParticuliers.toLocaleString('fr-FR')}
          sub="Total depuis le début"
        />
        <StatCard
          label="Réservations ce mois"
          value={totalReservationsMois.toLocaleString('fr-FR')}
          sub={`En ${moisLabel}`}
        />
        <StatCard
          label="Revenus du mois"
          value={`${revenusMois.toFixed(2)} €`}
          sub="Factures encaissées (TTC)"
        />
      </div>
    </div>
  )
}
