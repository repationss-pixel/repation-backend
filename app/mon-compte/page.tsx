import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Prisma, ReservationStatut } from "@prisma/client";
import CancelButton from "./CancelButton";
import ProfilSection from "./ProfilSection";
import CompanionCard from "./CompanionCard";

type ReservationAvecRestaurant = Prisma.ReservationGetPayload<{
  include: { restaurant: { select: { nom: true; adresse: true; slug: true } } };
}>;

export interface CompanionData {
  prenom: string
  photoUrl: string | null
  age: number | null
  profession: string | null
  bio: string | null
  interets: string | null
}

export const dynamic = "force-dynamic";

const STATUT_LABEL: Record<ReservationStatut, { label: string; color: string }> = {
  EN_ATTENTE: { label: "En attente",            color: "bg-[#FBF5E6] text-[#8B5E3C]" },
  CONFIRMEE:  { label: "Confirmée",             color: "bg-blue-50 text-blue-700" },
  VALIDEE:    { label: "Présence confirmée ✓",  color: "bg-[#F2EAD9] text-[#6B3D14]" },
  ANNULEE:    { label: "Annulée",               color: "bg-gray-100 text-gray-500" },
  NO_SHOW:    { label: "Absence non justifiée", color: "bg-red-50 text-red-600" },
  TERMINEE:   { label: "Terminée",              color: "bg-gray-50 text-gray-500" },
};

function fmtSlot(date: Date) {
  return (
    date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Paris" }) +
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
  } catch { redirect("/connexion"); }

  type UserData = {
    id: string; prenom: string; email: string; phone: string | null;
    photoUrl: string | null; age: number | null; profession: string | null; bio: string | null; interets: string | null;
  }
  let user: UserData | null = null;
  let upcoming: ReservationAvecRestaurant[] = [];
  let past: ReservationAvecRestaurant[] = [];
  const companionMap: Record<string, CompanionData | null> = {};

  try {
    const now = new Date();
    [user, upcoming, past] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, prenom: true, email: true, phone: true, photoUrl: true, age: true, profession: true, bio: true, interets: true },
      }),
      prisma.reservation.findMany({
        where: { userId, creneau: { gte: now }, statut: { in: [ReservationStatut.EN_ATTENTE, ReservationStatut.CONFIRMEE] } },
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

    if (upcoming.length > 0) {
      const companions = await Promise.all(
        upcoming.map((r) =>
          prisma.reservation.findFirst({
            where: {
              restaurantId: r.restaurantId,
              creneau: r.creneau,
              statut: { notIn: [ReservationStatut.ANNULEE, ReservationStatut.NO_SHOW] },
              userId: { not: userId },
            },
            include: { user: { select: { prenom: true, photoUrl: true, age: true, profession: true, bio: true, interets: true } } },
          })
        )
      );
      upcoming.forEach((r, i) => { companionMap[r.id] = companions[i]?.user ?? null; });
    }
  } catch {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#F2EAD9" }}>
        <div className="text-center">
          <p className="text-sm mb-4" style={{ color: "#7A6A55" }}>Impossible de charger votre compte. Veuillez réessayer.</p>
          <Link href="/" style={{ color: "#8B5E3C", fontSize: "13px" }}>← Retour à l&apos;accueil</Link>
        </div>
      </div>
    );
  }

  if (!user) redirect("/connexion");

  const now = new Date();

  return (
    <div className="min-h-screen" style={{ background: "#F2EAD9" }}>

      {/* Header */}
      <header style={{
        background: "#FBF5E6",
        borderBottom: "1px solid #D4BFA0",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/"><img src="/logo-repation.png" alt="Repation" style={{ height: "32px", width: "auto" }} /></Link>
            <span style={{ color: "#D4BFA0" }}>|</span>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#1C1009" }}>Mon compte</span>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" style={{
              fontSize: "13px",
              fontWeight: 600,
              background: "#2C1A0A",
              color: "#F2EAD9",
              border: "none",
              borderRadius: "8px",
              padding: "7px 16px",
              cursor: "pointer",
              fontFamily: "inherit",
            }}>
              Déconnexion
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">

        {/* ── Section Profil ── */}
        <ProfilSection user={user} />

        {/* ── Réservations à venir ── */}
        <div style={{ background: "#FBF5E6", borderRadius: "16px", border: "1px solid #D4BFA0", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #D4BFA0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#1C1009",
              fontFamily: '"Playfair Display", Georgia, serif',
            }}>
              Réservations à venir
            </h2>
            <Link href="/recherche" style={{ fontSize: "13px", fontWeight: 600, color: "#8B5E3C", textDecoration: "none" }}>
              + Trouver une table
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center" }}>
              <p style={{ color: "#B0A090", fontSize: "13px", marginBottom: "12px" }}>Aucune réservation à venir.</p>
              <Link href="/recherche" style={{
                display: "inline-block",
                background: "#8B5E3C",
                color: "#F2EAD9",
                fontSize: "13px",
                fontWeight: 600,
                padding: "10px 20px",
                borderRadius: "10px",
                textDecoration: "none",
              }}>
                Trouver une table →
              </Link>
            </div>
          ) : (
            <>
              <div style={{ padding: "10px 24px", background: "#F2EAD9", borderBottom: "1px solid #D4BFA0" }}>
                <p style={{ fontSize: "12px", color: "#8B5E3C", fontWeight: 500 }}>
                  ✅ Annulation possible sans frais jusqu&apos;à 20 min avant votre repas
                </p>
              </div>
              <div>
                {upcoming.map((r, idx) => {
                  const deadline = r.annulationDeadline ?? new Date(r.creneau.getTime() - 20 * 60 * 1000);
                  const isLate = now >= deadline;
                  const companion = companionMap[r.id] ?? null;
                  const hasCompanion = companion !== null;

                  return (
                    <div key={r.id} style={{
                      padding: "16px 24px",
                      borderTop: idx > 0 ? "1px solid #EDE3CF" : "none",
                    }}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p style={{ fontSize: "14px", fontWeight: 600, color: "#1C1009" }}>{r.restaurant.nom}</p>
                          <p style={{ fontSize: "12px", color: "#7A6A55", marginTop: "2px" }}>{fmtSlot(r.creneau)}</p>
                          <p style={{ fontSize: "12px", color: "#B0A090", marginTop: "2px" }} className="truncate">{r.restaurant.adresse}</p>
                          {!isLate && (
                            <p style={{ fontSize: "12px", color: "#B0A090", marginTop: "4px" }}>
                              Annulation gratuite avant{" "}
                              {deadline.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })}
                            </p>
                          )}
                          {isLate && <p style={{ fontSize: "12px", color: "#B45309", marginTop: "4px", fontWeight: 500 }}>⚠️ Annulation tardive — 1€ de frais</p>}
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUT_LABEL[r.statut].color}`}>
                            {STATUT_LABEL[r.statut].label}
                          </span>
                          <CancelButton reservationId={r.id} userId={userId} isLate={isLate} />
                        </div>
                      </div>

                      <CompanionCard
                        hasCompanion={hasCompanion}
                        companion={companion}
                        creneau={r.creneau.toISOString()}
                        restaurantNom={r.restaurant.nom}
                      />
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* ── Historique ── */}
        {past.length > 0 && (
          <div style={{ background: "#FBF5E6", borderRadius: "16px", border: "1px solid #D4BFA0", overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #D4BFA0" }}>
              <h2 style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "#1C1009",
                fontFamily: '"Playfair Display", Georgia, serif',
              }}>
                Historique
              </h2>
            </div>
            <div>
              {past.map((r, idx) => (
                <div key={r.id} style={{
                  padding: "14px 24px",
                  borderTop: idx > 0 ? "1px solid #EDE3CF" : "none",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "16px",
                }}>
                  <div className="min-w-0">
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "#1C1009" }}>{r.restaurant.nom}</p>
                    <p style={{ fontSize: "12px", color: "#7A6A55", marginTop: "2px" }}>{fmtSlot(r.creneau)}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${STATUT_LABEL[r.statut].color}`}>
                    {STATUT_LABEL[r.statut].label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "16px", paddingTop: "8px" }}>
          <a href="/cgu" style={{ fontSize: "12px", color: "#B0A090", textDecoration: "underline" }}>CGU</a>
          <a href="/confidentialite" style={{ fontSize: "12px", color: "#B0A090", textDecoration: "underline" }}>Confidentialité</a>
        </div>

      </main>
    </div>
  );
}
