import { prisma } from '@/lib/prisma'
import { UserType } from '@prisma/client'

export const dynamic = 'force-dynamic'

export default async function AdminParticuliersPage() {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const users = await prisma.user.findMany({
    where: { type: UserType.PARTICULIER },
    include: {
      _count: { select: { reservations: true } },
      reservations: {
        where: { creneau: { gte: thirtyDaysAgo } },
        select: { id: true },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Particuliers</h1>
        <p className="text-gray-500 text-sm mt-1">
          {users.length.toLocaleString('fr-FR')} membre{users.length > 1 ? 's' : ''} inscrits
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Prénom</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Téléphone</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Inscription</th>
                <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Réservations</th>
                <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => {
                const actif = u.reservations.length > 0
                return (
                  <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-4 font-medium text-gray-900">{u.prenom}</td>
                    <td className="px-4 py-4 text-gray-600">{u.email}</td>
                    <td className="px-4 py-4 text-gray-600 font-mono text-xs">{u.phone}</td>
                    <td className="px-4 py-4 text-gray-500">
                      {u.createdAt.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' })}
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-gray-800">
                      {u._count.reservations}
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

          {users.length === 0 && (
            <div className="px-6 py-16 text-center text-gray-400">
              Aucun particulier inscrit.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
