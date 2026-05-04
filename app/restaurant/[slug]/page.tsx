import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { RestaurantCategorie, ReservationStatut } from "@prisma/client";
import BookingSection from "./BookingSection";

const CATEGORIE_LABEL: Record<RestaurantCategorie, string> = {
  RESTAURANT:  "Restaurant",
  BRASSERIE:   "Brasserie",
  CAFE:        "Café",
  BAR:         "Bar",
  FAST_FOOD:   "Fast-food",
  BOULANGERIE: "Boulangerie",
};

export const dynamic = "force-dynamic";

export default async function RestaurantPage({ params }: { params: { slug: string } }) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: params.slug },
    select: { id: true, nom: true, adresse: true, categorie: true, slug: true, photoUrl: true },
  });

  if (!restaurant) notFound();

  // Date de base pour les créneaux = aujourd'hui (UTC)
  const dateBase = new Date().toISOString().split("T")[0];

  // Comptage des réservations actives par créneau pour aujourd'hui
  const [year, month, day] = dateBase.split("-").map(Number);
  const rangeStart = new Date(Date.UTC(year, month - 1, day, 0, 0));
  const rangeEnd = new Date(Date.UTC(year, month - 1, day + 1, 0, 0));

  const todayReservations = await prisma.reservation.findMany({
    where: {
      restaurantId: restaurant.id,
      creneau: { gte: rangeStart, lt: rangeEnd },
      statut: { notIn: [ReservationStatut.ANNULEE, ReservationStatut.NO_SHOW] },
    },
    select: { creneau: true },
  });

  const slotCounts: Record<string, number> = {};
  for (const r of todayReservations) {
    const hhmm = r.creneau.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Paris",
    });
    slotCounts[hhmm] = (slotCounts[hhmm] ?? 0) + 1;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/recherche" className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <Link href="/">
            <img src="/logo-repation.png" alt="Repation" style={{ height: "32px", width: "auto" }} />
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        {/* Fiche restaurant */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {restaurant.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={restaurant.photoUrl} alt={restaurant.nom} className="w-full h-52 object-cover" />
          ) : (
            <div className="w-full h-52 bg-gradient-to-br from-[#1D9E75]/10 to-[#1D9E75]/5 flex items-center justify-center">
              <svg className="w-14 h-14 text-[#1D9E75]/25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          <div className="p-6 space-y-3">
            <span className="inline-block text-xs font-semibold text-[#1D9E75] bg-[#1D9E75]/10 px-2.5 py-1 rounded-full">
              {CATEGORIE_LABEL[restaurant.categorie]}
            </span>
            <h1 className="text-2xl font-extrabold text-gray-900">{restaurant.nom}</h1>
            <p className="text-sm text-gray-500 flex items-start gap-1.5">
              <svg className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {restaurant.adresse}
            </p>
          </div>
        </div>

        {/* Réservation */}
        <BookingSection
          restaurant={{ id: restaurant.id, nom: restaurant.nom }}
          dateBase={dateBase}
          slotCounts={slotCounts}
        />
      </main>
    </div>
  );
}
