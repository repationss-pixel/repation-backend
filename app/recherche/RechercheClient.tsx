"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Restaurant {
  id: string;
  nom: string;
  adresse: string;
  slug: string;
  photoUrl: string | null;
  latitude: number;
  longitude: number;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function RechercheClient({ restaurants }: { restaurants: Restaurant[] }) {
  const [distanceKm, setDistanceKm] = useState(50);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<"pending" | "ok" | "refused">("pending");

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoStatus("refused");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus("ok");
      },
      () => setGeoStatus("refused"),
      { timeout: 8000 }
    );
  }, []);

  const visible =
    userPos
      ? restaurants.filter(
          (r) => haversineKm(userPos.lat, userPos.lng, r.latitude, r.longitude) <= distanceKm
        )
      : restaurants;

  return (
    <div className="min-h-screen" style={{ background: "#F2EAD9" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/">
            <img src="/logo-repation.png" alt="Repation" style={{ height: "36px", width: "auto" }} />
          </Link>
          <span style={{ color: "#D4BFA0" }}>|</span>
          <h1 className="text-base font-semibold" style={{ color: "#1C1009" }}>Trouver une table</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Slider distance */}
        <div
          className="mb-8 rounded-2xl p-5"
          style={{ background: "white", border: "1px solid #D4BFA0" }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold" style={{ color: "#1C1009" }}>
              Dans un rayon de{" "}
              <span style={{ color: "#8B5E3C" }}>{distanceKm} km</span>
            </span>
            {geoStatus === "refused" && (
              <span className="text-xs" style={{ color: "#7A6A55" }}>
                Géolocalisation désactivée — tous les restaurants affichés
              </span>
            )}
            {geoStatus === "pending" && (
              <span className="text-xs" style={{ color: "#7A6A55" }}>
                Localisation en cours…
              </span>
            )}
          </div>
          <input
            type="range"
            min={1}
            max={200}
            value={distanceKm}
            onChange={(e) => setDistanceKm(Number(e.target.value))}
            disabled={geoStatus !== "ok"}
            className="w-full disabled:opacity-40"
            style={{ accentColor: "#8B5E3C" }}
          />
          <div className="flex justify-between text-xs mt-1" style={{ color: "#B0A090" }}>
            <span>1 km</span>
            <span>200 km</span>
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="text-center py-20" style={{ color: "#7A6A55" }}>
            Aucun restaurant dans ce rayon. Augmentez la distance.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {visible.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl flex flex-col overflow-hidden hover:shadow-md transition-shadow"
                style={{ background: "white", border: "1px solid #D4BFA0" }}
              >
                {/* Photo */}
                {r.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.photoUrl} alt={r.nom} className="w-full h-40 object-cover" />
                ) : (
                  <div
                    className="w-full h-40 flex items-center justify-center"
                    style={{ background: "#F2EAD9" }}
                  >
                    <svg className="w-10 h-10" style={{ color: "#D4BFA0" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                <div className="p-5 flex flex-col gap-3">
                  <h2 className="text-lg font-bold leading-tight" style={{ color: "#1C1009" }}>{r.nom}</h2>

                  <p className="text-sm flex items-start gap-1.5" style={{ color: "#7A6A55" }}>
                    <svg className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#B0A090" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {r.adresse}
                  </p>

                  {userPos && (
                    <p className="text-xs" style={{ color: "#B0A090" }}>
                      à {haversineKm(userPos.lat, userPos.lng, r.latitude, r.longitude).toFixed(1)} km
                    </p>
                  )}

                  <Link
                    href={`/restaurant/${r.slug}`}
                    className="mt-auto block text-center text-sm font-semibold py-2.5 rounded-xl transition-colors"
                    style={{ background: "#2C1A0A", color: "#F2EAD9" }}
                  >
                    Rejoindre une table →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
