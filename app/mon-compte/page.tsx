import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Prisma, ReservationStatut } from "@prisma/client";
import CancelButton from "./CancelButton";

type ReservationAvecRestaurant = Prisma.ReservationGetPayload<{
  include: { restaurant: { select: { nom: true; adresse: true; slug: true } } };
}>;

export const dynamic = "force-dynamic";

const STATUT_LABEL: Record<ReservationStatut, { label: string; color: string }> = {
  EN_ATTENTE: { label: "En attente",            color: "bg-yellow-50 text-yellow-700" },
  CONFIRMEE:  { label: "Confirmée",             color: "bg-blue-50 text-blue-700" },
  VALIDEE:    { label: "Présence confirmée ✓",  color: "bg-green-50 text-green-700" },
  ANNULEE:    { label: "Annulée",               color: "bg-gray-100 text-gray-500" },
  NO_SHOW:    { label: "Absence non justifiée", color: "bg-red-50 text-red-600" },
  TERMINEE:   { label: "Terminée",              color: "bg-gray-50 text-gray-500" },
};

function fmtSlot(date: Date) {
  return (
    date.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Europe/Paris",
    }) +
    " · " +
    date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })
  );
}

export default async function MonComptePage() {
  const raw = cookies().get("repation_session")?.value;
  if (!raw) redirect("/connexion");

  let userId: string;
  try {
    const parsed = JSON.parse(raw);
    if (parsed.type !== "PARTICULIER") redirect("/connexion");
    userId = parsed.userId;
  } catch {
    redirect("/connexion");
  }

  let user: { id: string; prenom: string; email: string; phone: string | null } | null = null;
  let upcoming: ReservationAvecRestaurant[] = [];
  let past: ReservationAvecRestaurant[] = [];

  try {
    const now = new Date();
    [user, upcoming, past] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, prenom: true, email: true, phone: true },
      }),
      prisma.reservation.findMany({
        where: {
          userId,
          creneau: { gte: now },
          statut: { in: [ReservationStatut.EN_ATTENTE, ReservationStatut.CONFIRMEE] },
        },
        include: { restaurant: { select: { nom: true, adresse: true, slug: true } } },
        orderBy: { creneau: "asc" },
      }),
      prisma.reservation.findMany({
        where: {
          userId,
          OR: [
            { creneau: { lt: now } },
            { statut: { in: [ReservationStatut.ANNULEE, ReservationStatut.NO_SHOW, ReservationStatut.TERMINEE, ReservationStatut.VALIDEE] } },
          ],
        },
        include: { restaurant: { select: { nom: true, adresse: true, slug: true } } },
        orderBy: { creneau: "desc" },
        take: 20,
      }),
    ]);
  } catch {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Impossible de charger votre compte. Veuillez réessayer.</p>
          <Link href="/" className="text-[#1D9E75] hover:underline text-sm">← Retour à l'accueil</Link>
        </div>
      </div>
    );
  }

  if (!user) redirect("/connexion");

  const now = new Date();

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <img src="/logo-repation.png" alt="Repation" style={{ height: "32px", width: "auto" }} />
            </Link>
            <span className="text-gray-300">|</span>
            <span className="text-sm font-semibold text-gray-700">Mon compte</span>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              formAction="/api/auth/logout"
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">

        {/* Profil */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#1D9E75]/10 flex items-center justify-center text-[#1D9E75] font-bold text-lg">
              {user.prenom[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{user.prenom}</h1>
              <p className="text-sm text-gray-500">Convive Repation</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-400 mb-0.5">Email</p>
              <p className="font-medium text-gray-800 truncate">{user.email}</p>
            </div>
            <div className="bg-gray-50 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-400 mb-0.5">Téléphone</p>
              <p className="font-medium text-gray-800">{user.phone ?? "—"}</p>
            </div>
          </div>
        </div>

        {/* Réservations à venir */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Réservations à venir</h2>
            <Link
              href="/recherche"
              className="text-sm font-medium text-[#1D9E75] hover:underline"
            >
              + Trouver une table
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-gray-400 text-sm mb-3">Aucune réservation à venir.</p>
              <Link
                href="/recherche"
                className="inline-block bg-[#1D9E75] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#178560] transition-colors"
              >
                Trouver une table →
              </Link>
            </div>
          ) : (
            <>
              <div className="px-6 py-3 bg-[#1D9E75]/5 border-b border-[#1D9E75]/10">
                <p className="text-xs text-[#1D9E75] font-medium">
                  ✅ Annulation gratuite jusqu'à 20 minutes avant votre réservation
                </p>
              </div>
              <div className="divide-y divide-gray-50">
                {upcoming.map((r) => {
                  const deadline =
                    r.annulationDeadline ??
                    new Date(r.creneau.getTime() - 20 * 60 * 1000);
                  const isLate = now >= deadline;
                  return (
                    <div key={r.id} className="px-6 py-4 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800">
                          {r.restaurant.nom}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {fmtSlot(r.creneau)}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {r.restaurant.adresse}
                        </p>
                        {!isLate && (
                          <p className="text-xs text-gray-400 mt-1">
                            Annulation gratuite avant{" "}
                            {deadline.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        )}
                        {isLate && (
                          <p className="text-xs text-orange-500 mt-1 font-medium">
                            ⚠️ Annulation tardive — 1€ de frais
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUT_LABEL[r.statut].color}`}>
                          {STATUT_LABEL[r.statut].label}
                        </span>
                        <CancelButton
                          reservationId={r.id}
                          userId={userId}
                          isLate={isLate}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Réservations passées */}
        {past.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Historique</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {past.map((r) => (
                <div key={r.id} className="px-6 py-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800">
                      {r.restaurant.nom}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{fmtSlot(r.creneau)}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${STATUT_LABEL[r.statut].color}`}>
                    {STATUT_LABEL[r.statut].label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer légal */}
        <div className="flex items-center gap-4 text-xs text-gray-400 pt-2">
          <a href="/cgu" className="hover:text-gray-600 underline">CGU</a>
          <a href="/confidentialite" className="hover:text-gray-600 underline">Confidentialité</a>
        </div>

      </main>
    </div>
  );
}
