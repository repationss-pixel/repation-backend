"use client";

import { useState } from "react";
import Link from "next/link";
import { RestaurantCategorie } from "@prisma/client";

interface Restaurant {
  id: string;
  nom: string;
  adresse: string;
  categorie: RestaurantCategorie;
  slug: string;
}

const CATEGORIE_LABEL: Record<RestaurantCategorie, string> = {
  RESTAURANT:  "Restaurant",
  BRASSERIE:   "Brasserie",
  CAFE:        "Café",
  BAR:         "Bar",
  FAST_FOOD:   "Fast-food",
  BOULANGERIE: "Boulangerie",
};

const FILTERS = [
  { label: "Tous",       match: (_: RestaurantCategorie) => true },
  { label: "Restaurant", match: (c: RestaurantCategorie) => c === "RESTAURANT" || c === "BRASSERIE" },
  { label: "Fast-food",  match: (c: RestaurantCategorie) => c === "FAST_FOOD" },
  { label: "Café",       match: (c: RestaurantCategorie) => c === "CAFE" || c === "BAR" || c === "BOULANGERIE" },
];

export default function RechercheClient({ restaurants }: { restaurants: Restaurant[] }) {
  const [activeFilter, setActiveFilter] = useState(0);

  const visible = restaurants.filter((r) => FILTERS[activeFilter].match(r.categorie));

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo-repation.png" alt="Repation" style={{ height: "36px", width: "auto" }} />
          </Link>
          <span className="text-gray-300">|</span>
          <h1 className="text-base font-semibold text-gray-700">Trouver une table</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Filtres */}
        <div className="flex flex-wrap gap-2 mb-8">
          {FILTERS.map((f, i) => (
            <button
              key={f.label}
              onClick={() => setActiveFilter(i)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                activeFilter === i
                  ? "bg-[#1D9E75] text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-[#1D9E75] hover:text-[#1D9E75]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <p className="text-gray-400 text-center py-20">
            Aucun restaurant dans cette catégorie pour le moment.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {visible.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-3 hover:shadow-md transition-shadow"
              >
                {/* Catégorie badge */}
                <span className="inline-block self-start text-xs font-semibold text-[#1D9E75] bg-[#1D9E75]/10 px-2.5 py-1 rounded-full">
                  {CATEGORIE_LABEL[r.categorie]}
                </span>

                <h2 className="text-lg font-bold text-gray-900 leading-tight">{r.nom}</h2>

                <p className="text-sm text-gray-500 flex items-start gap-1.5">
                  <svg className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {r.adresse}
                </p>

                <Link
                  href={`/restaurant/${r.slug}`}
                  className="mt-auto block text-center bg-[#1D9E75] hover:bg-[#178560] text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                >
                  Rejoindre une table →
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
