"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix des icônes Leaflet cassées sous webpack/Next.js
const greenIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="32" height="42">
        <path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 26 16 26S32 26 32 16C32 7.163 24.837 0 16 0z"
          fill="#1D9E75" stroke="#ffffff" stroke-width="2"/>
        <circle cx="16" cy="16" r="6" fill="#ffffff"/>
      </svg>
    `),
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -44],
});

interface Restaurant {
  id: string;
  nom: string;
  slug: string;
  latitude: number;
  longitude: number;
  categorie: string;
  photoUrl: string | null;
}

function FitBounds({ restaurants }: { restaurants: Restaurant[] }) {
  const map = useMap();
  useEffect(() => {
    if (restaurants.length === 0) return;
    if (restaurants.length === 1) {
      map.setView([restaurants[0].latitude, restaurants[0].longitude], 13);
      return;
    }
    const bounds = L.latLngBounds(
      restaurants.map((r) => [r.latitude, r.longitude] as [number, number])
    );
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 });
  }, [restaurants, map]);
  return null;
}

export default function MapComponent() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/restaurants/map")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setRestaurants(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#F0ECE4] rounded-3xl">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <svg className="animate-spin w-8 h-8" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          <span className="text-sm font-medium">Chargement de la carte…</span>
        </div>
      </div>
    );
  }

  return (
    <MapContainer
      center={[46.5, 2.5]}
      zoom={6}
      scrollWheelZoom={false}
      style={{ width: "100%", height: "100%", borderRadius: "inherit" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {restaurants.length > 0 && <FitBounds restaurants={restaurants} />}

      {restaurants.map((r) => (
        <Marker key={r.id} position={[r.latitude, r.longitude]} icon={greenIcon}>
          <Popup maxWidth={220} className="repation-popup">
            <div style={{ padding: "2px 0" }}>
              {r.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.photoUrl}
                  alt={r.nom}
                  style={{ width: "100%", height: "80px", objectFit: "cover", borderRadius: "6px", marginBottom: "8px" }}
                />
              )}
              <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: "14px", color: "#111827" }}>
                {r.nom}
              </p>
              <p style={{ margin: "0 0 10px", fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                {r.categorie.replace("_", " ")}
              </p>
              <a
                href={`/restaurant/${r.slug}`}
                style={{
                  display: "block",
                  background: "#1D9E75",
                  color: "#fff",
                  textAlign: "center",
                  padding: "7px 12px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Voir la table →
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
