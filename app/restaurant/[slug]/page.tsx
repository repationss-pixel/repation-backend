import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { RestaurantCategorie } from "@prisma/client";
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
    select: { id: true, nom: true, adresse: true, categorie: true, slug: true },
  });

  if (!restaurant) notFound();

  // Date de base pour les créneaux = aujourd'hui
  const dateBase = new Date().toISOString().split("T")[0];

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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
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

        {/* Réservation */}
        <BookingSection
          restaurant={{ id: restaurant.id, nom: restaurant.nom }}
          dateBase={dateBase}
        />
      </main>
    </div>
  );
}
