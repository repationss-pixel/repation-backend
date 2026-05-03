import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Prisma, ReservationStatut } from '@prisma/client'
import { calculateInvoice } from '@/lib/billing'
import LogoutButton from './LogoutButton'

export const dynamic = 'force-dynamic'

type ReservationAvecUser = Prisma.ReservationGetPayload<{
  include: { user: { select: { prenom: true } } }
}>

const STATUT_LABEL: Record<ReservationStatut, { label: string; color: string }> = {
  EN_ATTENTE: { label: 'En attente', color: 'bg-yellow-50 text-yellow-700' },
  CONFIRMEE:  { label: 'Confirmée',  color: 'bg-blue-50 text-blue-700' },
  VALIDEE:    { label: 'Validée ✓',  color: 'bg-green-50 text-green-700' },
  ANNULEE:    { label: 'Annulée',    color: 'bg-gray-100 text-gray-500' },
  NO_SHOW:    { label: 'Absence non justifiée', color: 'bg-red-50 text-red-600' },
  TERMINEE:   { label: 'Terminée',   color: 'bg-gray-50 text-gray-500' },
}

function fmtSlot(date: Date) {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/Paris',
  }) + ' · ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-gray-600 mb-4">{message}</p>
        <Link href="/" className="text-[#1D9E75] hover:underline text-sm">← Retour à l'accueil</Link>
      </div>
    </div>
  )
}

export default async function RestaurateurDashboard() {
  const session = cookies().get('repation_session')?.value
  if (!session) redirect('/connexion')

  let userId: string
  try {
    const parsed = JSON.parse(session)
    if (parsed.type !== 'RESTAURATEUR') redirect('/connexion')
    userId = parsed.userId
  } catch {
    redirect('/connexion')
  }

  let restaurant: Awaited<ReturnType<typeof prisma.restaurant.findFirst>>
  try {
    restaurant = await prisma.restaurant.findFirst({
      where: { restaurateurId: userId },
    })
  } catch {
    return <ErrorState message="Impossible de charger votre restaurant. Veuillez réessayer." />
  }

  if (!restaurant) {
    return <ErrorState message="Aucun restaurant lié à votre compte." />
  }

  const now = new Date()

  const startOfDay  = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay    = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

  const dow         = now.getDay()
  const daysFromMon = dow === 0 ? 6 : dow - 1
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysFromMon)
  const endOfWeek   = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000)

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const activeStatuts = [ReservationStatut.EN_ATTENTE, ReservationStatut.CONFIRMEE, ReservationStatut.VALIDEE]

  let todayCount = 0
  let weekCount = 0
  let certifiedVisitIds: { visitId: string | null }[] = []
  let upcoming: ReservationAvecUser[] = []
  let past: ReservationAvecUser[] = []

  try {
    ;[todayCount, weekCount, certifiedVisitIds, upcoming, past] = await Promise.all([
      prisma.reservation.count({
        where: { restaurantId: restaurant.id, creneau: { gte: startOfDay, lt: endOfDay }, statut: { in: activeStatuts } },
      }),
      prisma.reservation.count({
        where: { restaurantId: restaurant.id, creneau: { gte: startOfWeek, lt: endOfWeek }, statut: { in: activeStatuts } },
      }),
      prisma.reservation.findMany({
        where: {
          restaurantId: restaurant.id,
          statut: ReservationStatut.VALIDEE,
          visitId: { not: null },
          creneau: { gte: startOfMonth, lt: endOfMonth },
        },
        select: { visitId: true },
        distinct: ['visitId'],
      }),
      prisma.reservation.findMany({
        where: {
          restaurantId: restaurant.id,
          creneau: { gte: now },
          statut: { in: [ReservationStatut.EN_ATTENTE, ReservationStatut.CONFIRMEE] },
        },
        include: { user: { select: { prenom: true } } },
        orderBy: { creneau: 'asc' },
        take: 30,
      }),
      prisma.reservation.findMany({
        where: { restaurantId: restaurant.id, creneau: { lt: now } },
        include: { user: { select: { prenom: true } } },
        orderBy: { creneau: 'desc' },
        take: 30,
      }),
    ])
  } catch {
    return <ErrorState message="Impossible de charger les données. Veuillez réessayer dans quelques instants." />
  }

  const certifiedCount = certifiedVisitIds.length
  const totalClients   = certifiedCount * 2
  const { montantHT, montantTTC, tarifParClient } = calculateInvoice(restaurant.categorie, certifiedCount)
  const billable = certifiedCount >= 5

  const slotMap = new Map<string, typeof upcoming>()
  for (const r of upcoming) {
    const key = r.creneau.toISOString()
    slotMap.set(key, [...(slotMap.get(key) ?? []), r])
  }
  const upcomingSlots = Array.from(slotMap.values())

  return (
    <div
      className="min-h-screen"
      style={restaurant.photoUrl ? {
        backgroundImage: `linear-gradient(rgba(29, 158, 117, 0.85), rgba(29, 158, 117, 0.85)), url(${restaurant.photoUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      } : { background: '#F8F9FA' }}
    >
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <img src="/logo-repation.png" alt="Repation" style={{ height: '32px', width: 'auto' }} />
            </Link>
            <span className="text-gray-300">|</span>
            <span className="text-sm font-semibold text-gray-700">Tableau de bord</span>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Titre restaurant */}
        <div>
          <span className="inline-block text-xs font-semibold text-[#1D9E75] bg-[#1D9E75]/10 px-2.5 py-1 rounded-full mb-2">
            {restaurant.categorie}
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900">{restaurant.nom}</h1>
          <p className="text-gray-500 text-sm mt-1">{restaurant.adresse}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Réservations aujourd'hui", value: todayCount, sub: "actives" },
            { label: "Cette semaine", value: weekCount, sub: "réservations" },
            { label: "Clients ce mois", value: totalClients, sub: "certifiés (scan QR)" },
            {
              label: "Facture estimée",
              value: billable ? `${montantTTC.toFixed(2)} €` : '—',
              sub: billable ? `HT ${montantHT.toFixed(2)} €` : `Seuil : ${certifiedCount}/5 visites`,
              highlight: billable,
            },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className={`text-3xl font-extrabold ${s.highlight ? 'text-orange-500' : 'text-[#1D9E75]'}`}>
                {s.value}
              </div>
              <div className="text-sm font-medium text-gray-700 mt-1">{s.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Facture détaillée */}
        {billable && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Facture estimée — {now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'Europe/Paris' })}
            </h2>
            <div className="space-y-2 text-sm">
              {[
                ['Visites certifiées', `${certifiedCount}`],
                ['Clients amenés', `${totalClients}`],
                [`Tarif / client (${restaurant.categorie})`, `${tarifParClient.toFixed(2)} €`],
                ['Montant HT', `${montantHT.toFixed(2)} €`],
                ['TVA 20 %', `${(montantTTC - montantHT).toFixed(2)} €`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-gray-600">
                  <span>{k}</span><span className="font-medium">{v}</span>
                </div>
              ))}
              <div className="flex justify-between text-base font-bold text-[#1D9E75] border-t border-gray-100 pt-3 mt-1">
                <span>Total TTC</span><span>{montantTTC.toFixed(2)} €</span>
              </div>
            </div>
          </div>
        )}

        {/* Réservations à venir */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-50">
            <h2 className="text-lg font-bold text-gray-900">Réservations à venir</h2>
          </div>

          {upcomingSlots.length === 0 ? (
            <p className="px-6 py-10 text-center text-gray-400 text-sm">Aucune réservation à venir.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {upcomingSlots.map((slot) => (
                <div key={slot[0].creneau.toISOString()} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{fmtSlot(slot[0].creneau)}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {slot.length === 1
                        ? `${slot[0].user.prenom} · En attente d'un convive`
                        : `${slot[0].user.prenom} & ${slot[1].user.prenom}`}
                    </div>
                  </div>
                  <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${STATUT_LABEL[slot[0].statut].color}`}>
                    {STATUT_LABEL[slot[0].statut].label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Réservations passées */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-50">
            <h2 className="text-lg font-bold text-gray-900">Historique</h2>
          </div>

          {past.length === 0 ? (
            <p className="px-6 py-10 text-center text-gray-400 text-sm">Aucune réservation passée.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {past.map((r) => (
                <div key={r.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{fmtSlot(r.creneau)}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{r.user.prenom}</div>
                  </div>
                  <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${STATUT_LABEL[r.statut].color}`}>
                    {STATUT_LABEL[r.statut].label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer légal */}
        <div className="flex items-center gap-4 text-xs text-gray-400 pt-2">
          <a href="/cgu-restaurateurs" className="hover:text-gray-600 underline">CGU Restaurateurs</a>
          <a href="/confidentialite" className="hover:text-gray-600 underline">Politique de confidentialité</a>
        </div>

      </main>
    </div>
  )
}
